#!/bin/bash
#
# restore.sh - Database and file backup restoration script for Metronomics Platform
#
# This script automates the restoration of database and file backups for the
# Metronomics Platform. It supports various restore strategies including RDS snapshot
# restoration, point-in-time recovery, logical database restore, and S3 file recovery.
#
# Author: Metronomics DevOps Team
# Version: 1.0
#
# Usage:
#   ./restore.sh --environment <env> --type <type> [options]
#
# Examples:
#   ./restore.sh --environment production --type snapshot --snapshot-id snap-12345 --target new-instance
#   ./restore.sh --environment staging --type point-in-time --timestamp "2023-04-01 14:30:00" --verify
#   ./restore.sh --environment development --type logical --backup-file s3://metronomics-backups/logical/mybackup.sql.gz
#   ./restore.sh --environment production --type s3-files --backup-path s3://metronomics-backups/files/2023-04-01/ --target-bucket metronomics-restored-files
#

# Enable strict error handling
set -e          # Exit immediately if a command exits with a non-zero status
set -o pipefail # Return the exit status of the last command in the pipe that failed
set -u          # Treat unset variables as an error

# Default values and constants
# These can be overridden with environment variables or command-line arguments
AWS_REGION=${AWS_REGION:-"us-east-1"}
SECONDARY_REGION=${SECONDARY_REGION:-"us-west-2"}
S3_BACKUP_BUCKET=${S3_BACKUP_BUCKET:-"metronomics-backups"}
ENVIRONMENT=${ENVIRONMENT:-""}
RESTORE_TEMP_DIR=${RESTORE_TEMP_DIR:-"/tmp/metronomics-restore"}
BACKUP_PREFIX="metronomics-${ENVIRONMENT}"
RDS_INSTANCE_IDENTIFIER="metronomics-${ENVIRONMENT}-db"
RESTORE_TYPES=("snapshot" "point-in-time" "logical" "s3-files")
MAX_RESTORE_ATTEMPTS=3

# Notification settings
SNS_TOPIC_ARN=${SNS_TOPIC_ARN:-""}

# Logging settings
LOG_FILE="${RESTORE_TEMP_DIR}/restore-$(date +%Y%m%d-%H%M%S).log"
VERBOSE=${VERBOSE:-false}

# Logging function
log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    
    # Ensure log directory exists
    mkdir -p "$(dirname "$LOG_FILE")"
    
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
    
    # For errors, also log to stderr
    if [[ "$level" == "ERROR" ]]; then
        echo "[$timestamp] [$level] $message" >&2
    fi
}

# Function to show script usage
show_usage() {
    cat <<EOF
Usage: $(basename "$0") --environment <env> --type <type> [options]

Required arguments:
  --environment, -e <env>    Environment (development, staging, production)
  --type, -t <type>          Restore type (snapshot, point-in-time, logical, s3-files)

Snapshot restore options:
  --snapshot-id <id>         Snapshot identifier to restore from
  --target <mode>            Target mode (new-instance, overwrite-existing)
  --target-identifier <id>   Target instance identifier (default: auto-generated)

Point-in-time restore options:
  --timestamp <timestamp>    Point in time to restore to (format: "YYYY-MM-DD HH:MM:SS")
  --target <mode>            Target mode (new-instance, overwrite-existing)
  --target-identifier <id>   Target instance identifier (default: auto-generated)

Logical backup restore options:
  --backup-file <path>       Backup file path (S3 URI or local path)
  --target <mode>            Target mode (new-instance, overwrite-existing)
  --target-identifier <id>   Target database name (default: same as source)

S3 file restore options:
  --backup-path <path>       Backup path (S3 URI)
  --target-bucket <bucket>   Target bucket for restored files

Common options:
  --verify                   Verify the restore operation
  --decrypt                  Decrypt backup files (if encrypted)
  --update-config            Update application configuration after restore
  --restart-services         Restart services after restore
  --help, -h                 Show this help message

Examples:
  ./restore.sh --environment production --type snapshot --snapshot-id snap-12345 --target new-instance
  ./restore.sh --environment staging --type point-in-time --timestamp "2023-04-01 14:30:00" --verify
  ./restore.sh --environment development --type logical --backup-file s3://metronomics-backups/logical/mybackup.sql.gz
  ./restore.sh --environment production --type s3-files --backup-path s3://metronomics-backups/files/2023-04-01/ --target-bucket metronomics-restored-files
EOF
}

# Function to check prerequisites
check_prerequisites() {
    log "INFO" "Checking prerequisites..."
    
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        log "ERROR" "AWS CLI is not installed. Please install it and try again."
        return 1
    fi
    
    # Check if PostgreSQL client tools are installed (for logical backups)
    if [[ "$RESTORE_TYPE" == "logical" ]]; then
        if ! command -v psql &> /dev/null || ! command -v pg_restore &> /dev/null; then
            log "ERROR" "PostgreSQL client tools are not installed. Please install them and try again."
            return 1
        fi
    fi
    
    # Check if AWS credentials are configured
    if ! aws sts get-caller-identity &> /dev/null; then
        log "ERROR" "AWS credentials are not configured or are invalid. Please configure AWS credentials and try again."
        return 1
    fi
    
    # Check if jq is installed
    if ! command -v jq &> /dev/null; then
        log "ERROR" "jq is not installed. Please install it and try again."
        return 1
    fi
    
    # Check if required environment variables are set
    if [[ -z "$ENVIRONMENT" ]]; then
        log "ERROR" "ENVIRONMENT is not set. Please set it and try again."
        return 1
    fi
    
    # Verify S3 backup bucket exists and is accessible
    if ! aws s3api head-bucket --bucket "$S3_BACKUP_BUCKET" --region "$AWS_REGION" &> /dev/null; then
        log "ERROR" "S3 backup bucket '$S3_BACKUP_BUCKET' does not exist or is not accessible."
        return 1
    fi
    
    # For database restores, check if target RDS instance exists (if not creating a new one)
    if [[ "$RESTORE_TYPE" == "snapshot" || "$RESTORE_TYPE" == "point-in-time" || "$RESTORE_TYPE" == "logical" ]]; then
        if [[ "$TARGET_MODE" == "overwrite-existing" ]]; then
            if ! aws rds describe-db-instances --db-instance-identifier "$RDS_INSTANCE_IDENTIFIER" --region "$AWS_REGION" &> /dev/null; then
                log "ERROR" "Target RDS instance '$RDS_INSTANCE_IDENTIFIER' does not exist."
                return 1
            fi
        fi
    fi
    
    log "INFO" "All prerequisites check passed."
    return 0
}

# Function to parse command line arguments
parse_arguments() {
    local args=("$@")
    
    # Initialize variables with default values
    RESTORE_TYPE=""
    BACKUP_ID=""
    TIMESTAMP=""
    TARGET_MODE="new-instance"  # or "overwrite-existing"
    TARGET_IDENTIFIER=""
    TARGET_BUCKET=""
    VERIFY=false
    DECRYPT=false
    RECOVERY_POINT="latest"  # or "specific"
    UPDATE_CONFIG=false
    RESTART_SERVICES=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --environment|-e)
                ENVIRONMENT="$2"
                shift 2
                ;;
            --type|-t)
                RESTORE_TYPE="$2"
                shift 2
                ;;
            --snapshot-id)
                BACKUP_ID="$2"
                shift 2
                ;;
            --backup-file)
                BACKUP_ID="$2"
                shift 2
                ;;
            --backup-path)
                BACKUP_ID="$2"
                shift 2
                ;;
            --timestamp)
                TIMESTAMP="$2"
                RECOVERY_POINT="specific"
                shift 2
                ;;
            --target)
                TARGET_MODE="$2"
                shift 2
                ;;
            --target-identifier)
                TARGET_IDENTIFIER="$2"
                shift 2
                ;;
            --target-bucket)
                TARGET_BUCKET="$2"
                shift 2
                ;;
            --verify)
                VERIFY=true
                shift
                ;;
            --decrypt)
                DECRYPT=true
                shift
                ;;
            --update-config)
                UPDATE_CONFIG=true
                shift
                ;;
            --restart-services)
                RESTART_SERVICES=true
                shift
                ;;
            --help|-h)
                show_usage
                exit 0
                ;;
            *)
                log "ERROR" "Unknown option: $1"
                show_usage
                return 1
                ;;
        esac
    done
    
    # Validate required arguments
    if [[ -z "$ENVIRONMENT" ]]; then
        log "ERROR" "Environment must be specified with --environment"
        return 1
    fi
    
    if [[ -z "$RESTORE_TYPE" ]]; then
        log "ERROR" "Restore type must be specified with --type"
        return 1
    fi
    
    # Check if restore type is valid
    local valid_type=false
    for type in "${RESTORE_TYPES[@]}"; do
        if [[ "$RESTORE_TYPE" == "$type" ]]; then
            valid_type=true
            break
        fi
    done
    
    if [[ "$valid_type" == false ]]; then
        log "ERROR" "Invalid restore type: $RESTORE_TYPE. Valid types are: ${RESTORE_TYPES[*]}"
        return 1
    fi
    
    # Update environment-specific variables
    BACKUP_PREFIX="metronomics-${ENVIRONMENT}"
    RDS_INSTANCE_IDENTIFIER="metronomics-${ENVIRONMENT}-db"
    
    # Set default target identifier if not provided
    if [[ -z "$TARGET_IDENTIFIER" ]]; then
        if [[ "$TARGET_MODE" == "new-instance" ]]; then
            TARGET_IDENTIFIER="${RDS_INSTANCE_IDENTIFIER}-restored-$(date +%Y%m%d-%H%M%S)"
        else
            TARGET_IDENTIFIER="$RDS_INSTANCE_IDENTIFIER"
        fi
    fi
    
    # Set default target bucket if not provided
    if [[ -z "$TARGET_BUCKET" && "$RESTORE_TYPE" == "s3-files" ]]; then
        TARGET_BUCKET="metronomics-${ENVIRONMENT}-restored-$(date +%Y%m%d-%H%M%S)"
    fi
    
    # Log the parsed arguments
    log "INFO" "Environment: $ENVIRONMENT"
    log "INFO" "Restore type: $RESTORE_TYPE"
    log "INFO" "Backup ID: $BACKUP_ID"
    log "INFO" "Recovery point: $RECOVERY_POINT"
    if [[ "$RECOVERY_POINT" == "specific" ]]; then
        log "INFO" "Timestamp: $TIMESTAMP"
    fi
    log "INFO" "Target mode: $TARGET_MODE"
    log "INFO" "Target identifier: $TARGET_IDENTIFIER"
    if [[ "$RESTORE_TYPE" == "s3-files" ]]; then
        log "INFO" "Target bucket: $TARGET_BUCKET"
    fi
    log "INFO" "Verify: $VERIFY"
    log "INFO" "Decrypt: $DECRYPT"
    log "INFO" "Update config: $UPDATE_CONFIG"
    log "INFO" "Restart services: $RESTART_SERVICES"
    
    return 0
}

# Function to list available backups
list_available_backups() {
    local backup_type="$1"
    local time_range="$2"
    
    log "INFO" "Listing available $backup_type backups..."
    
    case "$backup_type" in
        snapshot)
            # List RDS snapshots
            local snapshots
            snapshots=$(aws rds describe-db-snapshots \
                --db-instance-identifier "$RDS_INSTANCE_IDENTIFIER" \
                --region "$AWS_REGION" \
                --query 'sort_by(DBSnapshots, &SnapshotCreateTime)[].[DBSnapshotIdentifier, SnapshotCreateTime, Status, DBInstanceIdentifier]' \
                --output json)
            
            if [[ -z "$snapshots" || "$snapshots" == "[]" ]]; then
                log "ERROR" "No snapshots found for DB instance $RDS_INSTANCE_IDENTIFIER"
                return 1
            fi
            
            log "INFO" "Available snapshots:"
            echo "$snapshots" | jq -r '.[] | "\(.[0]) | \(.[1]) | \(.[2]) | \(.[3])"' | \
                awk -F'|' '{ printf "%-50s | %-25s | %-10s | %-30s\n", $1, $2, $3, $4 }'
            ;;
            
        point-in-time)
            # Get the earliest and latest restorable time for the DB instance
            local restore_window
            restore_window=$(aws rds describe-db-instances \
                --db-instance-identifier "$RDS_INSTANCE_IDENTIFIER" \
                --region "$AWS_REGION" \
                --query 'DBInstances[0].[EarliestRestorableTime, LatestRestorableTime]' \
                --output json)
            
            if [[ -z "$restore_window" || "$restore_window" == "[]" ]]; then
                log "ERROR" "Could not retrieve restore window for DB instance $RDS_INSTANCE_IDENTIFIER"
                return 1
            fi
            
            log "INFO" "Point-in-time recovery window:"
            echo "$restore_window" | jq -r '.[] | "\(.[0]) to \(.[1])"'
            ;;
            
        logical)
            # List logical backup files in S3
            local backups
            backups=$(aws s3 ls "s3://${S3_BACKUP_BUCKET}/logical/${BACKUP_PREFIX}/" --region "$AWS_REGION" | grep -E '\.sql|\.dump|\.gz|\.tar|\.bz2')
            
            if [[ -z "$backups" ]]; then
                log "ERROR" "No logical backups found in s3://${S3_BACKUP_BUCKET}/logical/${BACKUP_PREFIX}/"
                return 1
            fi
            
            log "INFO" "Available logical backups:"
            echo "$backups" | awk '{ printf "%-25s | %-12s | %s\n", $1, $2, $4 }'
            ;;
            
        s3-files)
            # List S3 file backup sets
            local backup_sets
            backup_sets=$(aws s3 ls "s3://${S3_BACKUP_BUCKET}/files/${BACKUP_PREFIX}/" --region "$AWS_REGION")
            
            if [[ -z "$backup_sets" ]]; then
                log "ERROR" "No file backups found in s3://${S3_BACKUP_BUCKET}/files/${BACKUP_PREFIX}/"
                return 1
            fi
            
            log "INFO" "Available file backup sets:"
            echo "$backup_sets" | awk '{ printf "%-25s | %-12s | %s\n", $1, $2, $3 }'
            ;;
            
        *)
            log "ERROR" "Invalid backup type: $backup_type"
            return 1
            ;;
    esac
    
    return 0
}

# Function to restore from RDS snapshot
restore_from_snapshot() {
    local snapshot_identifier="$1"
    local target_instance_identifier="$2"
    local options="$3"
    
    log "INFO" "Starting restore from snapshot $snapshot_identifier to $target_instance_identifier..."
    
    # Validate snapshot exists
    if ! aws rds describe-db-snapshots \
        --db-snapshot-identifier "$snapshot_identifier" \
        --region "$AWS_REGION" &> /dev/null; then
        log "ERROR" "Snapshot $snapshot_identifier does not exist or is not accessible."
        return 1
    fi
    
    # Extract DB instance class and other parameters from original instance or use defaults
    local db_params
    local db_instance_class="db.r6g.xlarge"  # Default
    local db_subnet_group=""
    local vpc_security_group_ids=""
    
    # Try to get parameters from the source instance
    if [[ "$TARGET_MODE" == "new-instance" ]]; then
        db_params=$(aws rds describe-db-instances \
            --db-instance-identifier "$RDS_INSTANCE_IDENTIFIER" \
            --region "$AWS_REGION" \
            --query 'DBInstances[0].[DBInstanceClass, DBSubnetGroup.DBSubnetGroupName, VpcSecurityGroups[].VpcSecurityGroupId]' \
            --output json 2>/dev/null)
        
        if [[ -n "$db_params" && "$db_params" != "null" ]]; then
            db_instance_class=$(echo "$db_params" | jq -r '.[0]')
            db_subnet_group=$(echo "$db_params" | jq -r '.[1]')
            vpc_security_group_ids=$(echo "$db_params" | jq -r '.[2] | join(",")')
        else
            log "WARNING" "Could not retrieve parameters from source instance. Using defaults."
        fi
    fi
    
    local restore_start_time=$(date +%s)
    local restore_status=""
    
    if [[ "$TARGET_MODE" == "new-instance" ]]; then
        # Create new DB instance from snapshot
        log "INFO" "Creating new DB instance $target_instance_identifier from snapshot $snapshot_identifier..."
        
        aws rds restore-db-instance-from-db-snapshot \
            --db-instance-identifier "$target_instance_identifier" \
            --db-snapshot-identifier "$snapshot_identifier" \
            --db-instance-class "$db_instance_class" \
            --db-subnet-group-name "$db_subnet_group" \
            --vpc-security-group-ids "$vpc_security_group_ids" \
            --region "$AWS_REGION" \
            --no-publicly-accessible > /dev/null
        
        restore_status=$?
        
        if [[ $restore_status -ne 0 ]]; then
            log "ERROR" "Failed to create DB instance from snapshot."
            return 1
        fi
        
        # Wait for the instance to become available
        log "INFO" "Waiting for DB instance $target_instance_identifier to become available..."
        aws rds wait db-instance-available \
            --db-instance-identifier "$target_instance_identifier" \
            --region "$AWS_REGION"
        
    else  # TARGET_MODE == "overwrite-existing"
        log "ERROR" "Overwrite-existing mode is not implemented for snapshot restores."
        log "INFO" "Please use new-instance mode instead and update your application configuration."
        return 1
    fi
    
    local restore_end_time=$(date +%s)
    local restore_duration=$((restore_end_time - restore_start_time))
    
    log "INFO" "Restore from snapshot completed in $restore_duration seconds."
    
    # Get endpoint information
    local endpoint_info
    endpoint_info=$(aws rds describe-db-instances \
        --db-instance-identifier "$target_instance_identifier" \
        --region "$AWS_REGION" \
        --query 'DBInstances[0].[Endpoint.Address, Endpoint.Port, Engine, EngineVersion]' \
        --output json)
    
    local endpoint_address=$(echo "$endpoint_info" | jq -r '.[0]')
    local endpoint_port=$(echo "$endpoint_info" | jq -r '.[1]')
    local engine=$(echo "$endpoint_info" | jq -r '.[2]')
    local engine_version=$(echo "$endpoint_info" | jq -r '.[3]')
    
    log "INFO" "Restored database is available at $endpoint_address:$endpoint_port"
    log "INFO" "Database engine: $engine $engine_version"
    
    echo "$target_instance_identifier"
    return 0
}

# Function to perform point-in-time recovery
restore_point_in_time() {
    local timestamp="$1"
    local target_instance_identifier="$2"
    local options="$3"
    
    log "INFO" "Starting point-in-time recovery to $timestamp for $target_instance_identifier..."
    
    # Validate timestamp is within available recovery window
    local restore_window
    restore_window=$(aws rds describe-db-instances \
        --db-instance-identifier "$RDS_INSTANCE_IDENTIFIER" \
        --region "$AWS_REGION" \
        --query 'DBInstances[0].[EarliestRestorableTime, LatestRestorableTime]' \
        --output json)
    
    if [[ -z "$restore_window" || "$restore_window" == "null" ]]; then
        log "ERROR" "Could not retrieve restore window for DB instance $RDS_INSTANCE_IDENTIFIER"
        return 1
    fi
    
    local earliest_time=$(echo "$restore_window" | jq -r '.[0]')
    local latest_time=$(echo "$restore_window" | jq -r '.[1]')
    
    # Convert all timestamps to seconds since epoch for comparison
    local timestamp_epoch
    local earliest_epoch
    local latest_epoch
    
    timestamp_epoch=$(date -d "$timestamp" +%s 2>/dev/null)
    earliest_epoch=$(date -d "$earliest_time" +%s 2>/dev/null)
    latest_epoch=$(date -d "$latest_time" +%s 2>/dev/null)
    
    if [[ $? -ne 0 || -z "$timestamp_epoch" ]]; then
        log "ERROR" "Invalid timestamp format: $timestamp. Use format 'YYYY-MM-DD HH:MM:SS'"
        return 1
    fi
    
    if [[ "$timestamp_epoch" -lt "$earliest_epoch" || "$timestamp_epoch" -gt "$latest_epoch" ]]; then
        log "ERROR" "Timestamp $timestamp is outside the available recovery window ($earliest_time to $latest_time)"
        return 1
    fi
    
    # Extract DB instance class and other parameters from original instance or use defaults
    local db_params
    local db_instance_class="db.r6g.xlarge"  # Default
    local db_subnet_group=""
    local vpc_security_group_ids=""
    
    # Try to get parameters from the source instance
    db_params=$(aws rds describe-db-instances \
        --db-instance-identifier "$RDS_INSTANCE_IDENTIFIER" \
        --region "$AWS_REGION" \
        --query 'DBInstances[0].[DBInstanceClass, DBSubnetGroup.DBSubnetGroupName, VpcSecurityGroups[].VpcSecurityGroupId]' \
        --output json 2>/dev/null)
    
    if [[ -n "$db_params" && "$db_params" != "null" ]]; then
        db_instance_class=$(echo "$db_params" | jq -r '.[0]')
        db_subnet_group=$(echo "$db_params" | jq -r '.[1]')
        vpc_security_group_ids=$(echo "$db_params" | jq -r '.[2] | join(",")')
    else
        log "WARNING" "Could not retrieve parameters from source instance. Using defaults."
    fi
    
    local restore_start_time=$(date +%s)
    local restore_status=""
    
    if [[ "$TARGET_MODE" == "new-instance" ]]; then
        # Create new DB instance with point-in-time recovery
        log "INFO" "Creating new DB instance $target_instance_identifier with point-in-time recovery to $timestamp..."
        
        aws rds restore-db-instance-to-point-in-time \
            --source-db-instance-identifier "$RDS_INSTANCE_IDENTIFIER" \
            --target-db-instance-identifier "$target_instance_identifier" \
            --restore-time "$timestamp" \
            --db-instance-class "$db_instance_class" \
            --db-subnet-group-name "$db_subnet_group" \
            --vpc-security-group-ids "$vpc_security_group_ids" \
            --region "$AWS_REGION" \
            --no-publicly-accessible > /dev/null
        
        restore_status=$?
        
        if [[ $restore_status -ne 0 ]]; then
            log "ERROR" "Failed to create DB instance with point-in-time recovery."
            return 1
        fi
        
        # Wait for the instance to become available
        log "INFO" "Waiting for DB instance $target_instance_identifier to become available..."
        aws rds wait db-instance-available \
            --db-instance-identifier "$target_instance_identifier" \
            --region "$AWS_REGION"
        
    else  # TARGET_MODE == "overwrite-existing"
        log "ERROR" "Overwrite-existing mode is not implemented for point-in-time recovery."
        log "INFO" "Please use new-instance mode instead and update your application configuration."
        return 1
    fi
    
    local restore_end_time=$(date +%s)
    local restore_duration=$((restore_end_time - restore_start_time))
    
    log "INFO" "Point-in-time recovery completed in $restore_duration seconds."
    
    # Get endpoint information
    local endpoint_info
    endpoint_info=$(aws rds describe-db-instances \
        --db-instance-identifier "$target_instance_identifier" \
        --region "$AWS_REGION" \
        --query 'DBInstances[0].[Endpoint.Address, Endpoint.Port, Engine, EngineVersion]' \
        --output json)
    
    local endpoint_address=$(echo "$endpoint_info" | jq -r '.[0]')
    local endpoint_port=$(echo "$endpoint_info" | jq -r '.[1]')
    local engine=$(echo "$endpoint_info" | jq -r '.[2]')
    local engine_version=$(echo "$endpoint_info" | jq -r '.[3]')
    
    log "INFO" "Restored database is available at $endpoint_address:$endpoint_port"
    log "INFO" "Database engine: $engine $engine_version"
    
    echo "$target_instance_identifier"
    return 0
}

# Function to restore from a logical backup file
restore_logical_backup() {
    local backup_file_path="$1"
    local target_database="$2"
    local options="$3"
    
    log "INFO" "Starting logical database restore from $backup_file_path to $target_database..."
    
    # Create restore temp directory if it doesn't exist
    mkdir -p "$RESTORE_TEMP_DIR"
    
    local local_backup_file=""
    local is_s3_path=false
    
    # Check if backup file is in S3
    if [[ "$backup_file_path" == s3://* ]]; then
        is_s3_path=true
        local backup_file_name=$(basename "$backup_file_path")
        local_backup_file="${RESTORE_TEMP_DIR}/${backup_file_name}"
        
        log "INFO" "Downloading backup file from S3..."
        aws s3 cp "$backup_file_path" "$local_backup_file" --region "$AWS_REGION"
        
        if [[ $? -ne 0 ]]; then
            log "ERROR" "Failed to download backup file from S3."
            return 1
        fi
    else
        local_backup_file="$backup_file_path"
        
        # Check if local file exists
        if [[ ! -f "$local_backup_file" ]]; then
            log "ERROR" "Backup file $local_backup_file does not exist."
            return 1
        fi
    fi
    
    # Decrypt backup file if needed
    if [[ "$DECRYPT" == true ]]; then
        log "INFO" "Decrypting backup file..."
        local decrypted_file="${local_backup_file}.decrypted"
        
        if ! decrypt_backup "$local_backup_file" "$decrypted_file" ""; then
            log "ERROR" "Failed to decrypt backup file."
            return 1
        fi
        
        local_backup_file="$decrypted_file"
    fi
    
    # Decompress backup file if needed
    local decompressed_file=""
    
    if [[ "$local_backup_file" == *.gz ]]; then
        log "INFO" "Decompressing gzip backup file..."
        decompressed_file="${local_backup_file%.gz}"
        gunzip -c "$local_backup_file" > "$decompressed_file"
        
        if [[ $? -ne 0 ]]; then
            log "ERROR" "Failed to decompress backup file."
            return 1
        fi
        
        local_backup_file="$decompressed_file"
    elif [[ "$local_backup_file" == *.bz2 ]]; then
        log "INFO" "Decompressing bzip2 backup file..."
        decompressed_file="${local_backup_file%.bz2}"
        bunzip2 -c "$local_backup_file" > "$decompressed_file"
        
        if [[ $? -ne 0 ]]; then
            log "ERROR" "Failed to decompress backup file."
            return 1
        fi
        
        local_backup_file="$decompressed_file"
    fi
    
    # Get database connection parameters
    local db_instance_info
    db_instance_info=$(aws rds describe-db-instances \
        --db-instance-identifier "$RDS_INSTANCE_IDENTIFIER" \
        --region "$AWS_REGION" \
        --query 'DBInstances[0].[Endpoint.Address, Endpoint.Port, MasterUsername, DBName]' \
        --output json)
    
    if [[ -z "$db_instance_info" || "$db_instance_info" == "null" ]]; then
        log "ERROR" "Could not retrieve connection parameters for DB instance $RDS_INSTANCE_IDENTIFIER"
        return 1
    fi
    
    local db_host=$(echo "$db_instance_info" | jq -r '.[0]')
    local db_port=$(echo "$db_instance_info" | jq -r '.[1]')
    local db_user=$(echo "$db_instance_info" | jq -r '.[2]')
    local db_name=$(echo "$db_instance_info" | jq -r '.[3]')
    
    # Use the specified target database if provided
    if [[ -n "$target_database" ]]; then
        db_name="$target_database"
    fi
    
    # Prompt for database password
    log "INFO" "Please enter the database password for user $db_user:"
    read -s db_password
    echo
    
    # Export password for psql/pg_restore
    export PGPASSWORD="$db_password"
    
    local restore_start_time=$(date +%s)
    local restore_status=0
    
    # Check if the backup is a SQL dump or a custom format
    if [[ "$local_backup_file" == *.sql ]]; then
        # SQL dump - use psql
        log "INFO" "Restoring SQL dump to database $db_name..."
        
        # Check if target database exists
        if psql -h "$db_host" -p "$db_port" -U "$db_user" -lqt | cut -d \| -f 1 | grep -qw "$db_name"; then
            # Database exists - recreate it if in overwrite mode
            if [[ "$TARGET_MODE" == "overwrite-existing" ]]; then
                log "INFO" "Database $db_name exists. Dropping and recreating..."
                
                # Close existing connections to the database
                psql -h "$db_host" -p "$db_port" -U "$db_user" -c "
                    SELECT pg_terminate_backend(pg_stat_activity.pid)
                    FROM pg_stat_activity
                    WHERE pg_stat_activity.datname = '$db_name'
                    AND pid <> pg_backend_pid();" postgres
                
                # Drop and recreate the database
                psql -h "$db_host" -p "$db_port" -U "$db_user" -c "DROP DATABASE \"$db_name\";" postgres
                psql -h "$db_host" -p "$db_port" -U "$db_user" -c "CREATE DATABASE \"$db_name\";" postgres
            fi
        else
            # Database doesn't exist - create it
            log "INFO" "Creating database $db_name..."
            psql -h "$db_host" -p "$db_port" -U "$db_user" -c "CREATE DATABASE \"$db_name\";" postgres
        fi
        
        # Restore the database
        psql -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" -f "$local_backup_file"
        restore_status=$?
        
    else
        # Assume custom format - use pg_restore
        log "INFO" "Restoring custom format backup to database $db_name..."
        
        # Check if target database exists
        if psql -h "$db_host" -p "$db_port" -U "$db_user" -lqt | cut -d \| -f 1 | grep -qw "$db_name"; then
            # Database exists - recreate it if in overwrite mode
            if [[ "$TARGET_MODE" == "overwrite-existing" ]]; then
                log "INFO" "Database $db_name exists. Dropping and recreating..."
                
                # Close existing connections to the database
                psql -h "$db_host" -p "$db_port" -U "$db_user" -c "
                    SELECT pg_terminate_backend(pg_stat_activity.pid)
                    FROM pg_stat_activity
                    WHERE pg_stat_activity.datname = '$db_name'
                    AND pid <> pg_backend_pid();" postgres
                
                # Drop and recreate the database
                psql -h "$db_host" -p "$db_port" -U "$db_user" -c "DROP DATABASE \"$db_name\";" postgres
                psql -h "$db_host" -p "$db_port" -U "$db_user" -c "CREATE DATABASE \"$db_name\";" postgres
            fi
        else
            # Database doesn't exist - create it
            log "INFO" "Creating database $db_name..."
            psql -h "$db_host" -p "$db_port" -U "$db_user" -c "CREATE DATABASE \"$db_name\";" postgres
        fi
        
        # Restore the database
        pg_restore -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" -v "$local_backup_file"
        restore_status=$?
    fi
    
    # Clear the password from environment
    unset PGPASSWORD
    
    if [[ $restore_status -ne 0 ]]; then
        log "ERROR" "Database restore failed with status $restore_status"
        return 1
    fi
    
    local restore_end_time=$(date +%s)
    local restore_duration=$((restore_end_time - restore_start_time))
    
    log "INFO" "Logical database restore completed in $restore_duration seconds."
    
    # Clean up temporary files
    if [[ "$is_s3_path" == true || -n "$decompressed_file" ]]; then
        log "INFO" "Cleaning up temporary files..."
        rm -f "${RESTORE_TEMP_DIR}/$(basename "$backup_file_path")"
        [[ -n "$decompressed_file" ]] && rm -f "$decompressed_file"
        [[ "$DECRYPT" == true ]] && rm -f "${local_backup_file}.decrypted"
    fi
    
    return 0
}

# Function to restore files from S3 backup
restore_s3_files() {
    local backup_path="$1"
    local destination_bucket="$2"
    local options="$3"
    
    log "INFO" "Starting file restore from $backup_path to $destination_bucket..."
    
    # Validate backup path exists in S3
    if ! aws s3 ls "$backup_path" --region "$AWS_REGION" &> /dev/null; then
        log "ERROR" "Backup path $backup_path does not exist or is not accessible."
        return 1
    fi
    
    # Check for manifest file
    local manifest_path="${backup_path%/}/manifest.json"
    local manifest_exists=false
    
    if aws s3 ls "$manifest_path" --region "$AWS_REGION" &> /dev/null; then
        manifest_exists=true
        log "INFO" "Found manifest file at $manifest_path"
        
        # Download manifest file to temp directory
        mkdir -p "$RESTORE_TEMP_DIR"
        aws s3 cp "$manifest_path" "${RESTORE_TEMP_DIR}/manifest.json" --region "$AWS_REGION"
        
        # Verify manifest
        local manifest_valid=true
        if ! jq . "${RESTORE_TEMP_DIR}/manifest.json" &> /dev/null; then
            log "WARNING" "Manifest file is not valid JSON. Proceeding without manifest validation."
            manifest_exists=false
        fi
    else
        log "WARNING" "No manifest file found at $manifest_path. Proceeding without manifest validation."
    fi
    
    # Ensure destination bucket exists
    if ! aws s3api head-bucket --bucket "$destination_bucket" --region "$AWS_REGION" 2>/dev/null; then
        log "INFO" "Destination bucket $destination_bucket does not exist. Creating..."
        
        aws s3api create-bucket \
            --bucket "$destination_bucket" \
            --region "$AWS_REGION" \
            --create-bucket-configuration LocationConstraint="$AWS_REGION" > /dev/null
        
        if [[ $? -ne 0 ]]; then
            log "ERROR" "Failed to create destination bucket $destination_bucket"
            return 1
        fi
    fi
    
    # If overwrite mode and destination is not empty, backup current files
    if [[ "$TARGET_MODE" == "overwrite-existing" ]]; then
        local dest_contents
        dest_contents=$(aws s3 ls "s3://${destination_bucket}/" --region "$AWS_REGION")
        
        if [[ -n "$dest_contents" ]]; then
            log "INFO" "Destination bucket is not empty. Creating backup before overwriting..."
            
            local backup_timestamp=$(date +%Y%m%d-%H%M%S)
            local backup_destination="s3://${destination_bucket}-backup-${backup_timestamp}/"
            
            # Create backup bucket
            aws s3api create-bucket \
                --bucket "${destination_bucket}-backup-${backup_timestamp}" \
                --region "$AWS_REGION" \
                --create-bucket-configuration LocationConstraint="$AWS_REGION" > /dev/null
            
            # Copy all files to backup bucket
            log "INFO" "Backing up existing files to $backup_destination..."
            aws s3 sync "s3://${destination_bucket}/" "$backup_destination" --region "$AWS_REGION"
            
            if [[ $? -ne 0 ]]; then
                log "ERROR" "Failed to backup existing files."
                return 1
            fi
            
            log "INFO" "Backup completed to $backup_destination"
        fi
    fi
    
    # Perform the restore
    log "INFO" "Restoring files from $backup_path to s3://${destination_bucket}/..."
    
    local restore_start_time=$(date +%s)
    
    aws s3 sync "$backup_path" "s3://${destination_bucket}/" \
        --region "$AWS_REGION" \
        --exclude "manifest.json" \
        --exclude "*.md5" \
        --exclude "*.sha256"
    
    if [[ $? -ne 0 ]]; then
        log "ERROR" "Failed to restore files from $backup_path"
        return 1
    fi
    
    local restore_end_time=$(date +%s)
    local restore_duration=$((restore_end_time - restore_start_time))
    
    log "INFO" "File restore completed in $restore_duration seconds."
    
    # Verify restore if manifest exists
    if [[ "$manifest_exists" == true && "$VERIFY" == true ]]; then
        log "INFO" "Verifying restore against manifest..."
        
        local object_count=$(jq '.object_count' "${RESTORE_TEMP_DIR}/manifest.json")
        local total_size=$(jq '.total_size' "${RESTORE_TEMP_DIR}/manifest.json")
        
        # Count objects in destination bucket
        local dest_object_count
        dest_object_count=$(aws s3 ls --recursive "s3://${destination_bucket}/" --region "$AWS_REGION" | wc -l)
        
        log "INFO" "Manifest shows $object_count objects, destination has $dest_object_count objects."
        
        if [[ "$object_count" -ne "$dest_object_count" ]]; then
            log "WARNING" "Object count mismatch: expected $object_count, found $dest_object_count"
        else
            log "INFO" "Object count verified successfully."
        fi
        
        # Verify checksums for a sample of files if manifest includes checksums
        if jq -e '.file_checksums' "${RESTORE_TEMP_DIR}/manifest.json" &> /dev/null; then
            log "INFO" "Verifying checksums for sample files..."
            
            # Get a sample of up to 10 files with checksums
            local sample_files
            sample_files=$(jq -r '.file_checksums | keys | .[0:10] | .[]' "${RESTORE_TEMP_DIR}/manifest.json")
            
            local failed_checksums=0
            
            for file in $sample_files; do
                local expected_checksum
                expected_checksum=$(jq -r ".file_checksums[\"$file\"]" "${RESTORE_TEMP_DIR}/manifest.json")
                
                # Download file to verify checksum
                mkdir -p "${RESTORE_TEMP_DIR}/verify"
                aws s3 cp "s3://${destination_bucket}/${file}" "${RESTORE_TEMP_DIR}/verify/" --region "$AWS_REGION" > /dev/null
                
                if [[ $? -ne 0 ]]; then
                    log "WARNING" "Could not download file $file for checksum verification."
                    ((failed_checksums++))
                    continue
                fi
                
                local actual_checksum
                actual_checksum=$(sha256sum "${RESTORE_TEMP_DIR}/verify/$(basename "$file")" | awk '{print $1}')
                
                if [[ "$expected_checksum" != "$actual_checksum" ]]; then
                    log "WARNING" "Checksum mismatch for file $file"
                    ((failed_checksums++))
                else
                    log "INFO" "Checksum verified for file $file"
                fi
                
                # Clean up
                rm -f "${RESTORE_TEMP_DIR}/verify/$(basename "$file")"
            done
            
            if [[ "$failed_checksums" -gt 0 ]]; then
                log "WARNING" "$failed_checksums files failed checksum verification."
            else
                log "INFO" "All sample files verified successfully."
            fi
            
            # Clean up verify directory
            rm -rf "${RESTORE_TEMP_DIR}/verify"
        fi
    fi
    
    # Clean up
    rm -f "${RESTORE_TEMP_DIR}/manifest.json"
    
    return 0
}

# Function to decrypt a backup file
decrypt_backup() {
    local encrypted_file_path="$1"
    local output_file_path="$2"
    local kms_key_id="$3"
    
    log "INFO" "Decrypting backup file $encrypted_file_path..."
    
    # Validate encrypted file exists
    if [[ ! -f "$encrypted_file_path" ]]; then
        log "ERROR" "Encrypted file $encrypted_file_path does not exist."
        return 1
    fi
    
    # If output path is not provided, use encrypted path with .decrypted extension
    if [[ -z "$output_file_path" ]]; then
        output_file_path="${encrypted_file_path}.decrypted"
    fi
    
    # If KMS key ID is not provided, get the default one for the environment
    if [[ -z "$kms_key_id" ]]; then
        # Try to get KMS key from SSM parameter store
        kms_key_id=$(aws ssm get-parameter \
            --name "/metronomics/${ENVIRONMENT}/kms_key_id" \
            --region "$AWS_REGION" \
            --query 'Parameter.Value' \
            --output text 2>/dev/null)
        
        if [[ -z "$kms_key_id" || "$kms_key_id" == "null" ]]; then
            log "ERROR" "Could not determine KMS key ID for decryption."
            return 1
        fi
    fi
    
    # Decrypt the file using AWS KMS
    aws kms decrypt \
        --ciphertext-blob fileb://"$encrypted_file_path" \
        --key-id "$kms_key_id" \
        --output text \
        --query Plaintext \
        --region "$AWS_REGION" | base64 --decode > "$output_file_path"
    
    if [[ $? -ne 0 ]]; then
        log "ERROR" "Failed to decrypt file."
        return 1
    fi
    
    log "INFO" "File decrypted successfully to $output_file_path"
    
    echo "$output_file_path"
    return 0
}

# Function to verify the restore operation
verify_restore() {
    local restore_type="$1"
    local target_identifier="$2"
    
    log "INFO" "Verifying $restore_type restore for $target_identifier..."
    
    case "$restore_type" in
        snapshot|point-in-time)
            # Verify RDS instance
            log "INFO" "Verifying database instance status..."
            
            local instance_status
            instance_status=$(aws rds describe-db-instances \
                --db-instance-identifier "$target_identifier" \
                --region "$AWS_REGION" \
                --query 'DBInstances[0].DBInstanceStatus' \
                --output text)
            
            if [[ "$instance_status" != "available" ]]; then
                log "ERROR" "Database instance is not available. Status: $instance_status"
                return 1
            fi
            
            log "INFO" "Database instance is available."
            
            # Verify database connectivity
            log "INFO" "Verifying database connectivity..."
            
            local db_instance_info
            db_instance_info=$(aws rds describe-db-instances \
                --db-instance-identifier "$target_identifier" \
                --region "$AWS_REGION" \
                --query 'DBInstances[0].[Endpoint.Address, Endpoint.Port, MasterUsername, DBName]' \
                --output json)
            
            local db_host=$(echo "$db_instance_info" | jq -r '.[0]')
            local db_port=$(echo "$db_instance_info" | jq -r '.[1]')
            local db_user=$(echo "$db_instance_info" | jq -r '.[2]')
            local db_name=$(echo "$db_instance_info" | jq -r '.[3]')
            
            log "INFO" "Please enter the database password for user $db_user:"
            read -s db_password
            echo
            
            export PGPASSWORD="$db_password"
            
            # Check if we can connect to the database
            if ! psql -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" -c "SELECT 1" > /dev/null 2>&1; then
                log "ERROR" "Could not connect to database."
                unset PGPASSWORD
                return 1
            fi
            
            log "INFO" "Database connectivity verified."
            
            # Run a few validation queries to check database content
            log "INFO" "Checking database content..."
            
            # Get table count
            local table_count
            table_count=$(psql -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" -t -c "
                SELECT COUNT(*)
                FROM information_schema.tables
                WHERE table_schema = 'public';" | tr -d ' ')
            
            log "INFO" "Database contains $table_count tables."
            
            if [[ "$table_count" -eq 0 ]]; then
                log "WARNING" "Database appears to be empty. Verify this is expected."
            fi
            
            # Run a sample query to check data existence
            # This should be customized based on the application's schema
            log "INFO" "Running sample data validation queries..."
            
            # Example: Check if users table exists and has data
            if psql -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" -t -c "
                SELECT to_regclass('public.users');" | grep -q "users"; then
                
                local user_count
                user_count=$(psql -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" -t -c "
                    SELECT COUNT(*) FROM users;" | tr -d ' ')
                
                log "INFO" "Users table contains $user_count records."
            else
                log "INFO" "Users table not found. This may be expected depending on the application schema."
            fi
            
            # Example: Check if organizations table exists and has data
            if psql -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" -t -c "
                SELECT to_regclass('public.organizations');" | grep -q "organizations"; then
                
                local org_count
                org_count=$(psql -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" -t -c "
                    SELECT COUNT(*) FROM organizations;" | tr -d ' ')
                
                log "INFO" "Organizations table contains $org_count records."
            else
                log "INFO" "Organizations table not found. This may be expected depending on the application schema."
            fi
            
            unset PGPASSWORD
            ;;
            
        logical)
            # Verify database connectivity
            log "INFO" "Verifying database connectivity..."
            
            local db_instance_info
            db_instance_info=$(aws rds describe-db-instances \
                --db-instance-identifier "$RDS_INSTANCE_IDENTIFIER" \
                --region "$AWS_REGION" \
                --query 'DBInstances[0].[Endpoint.Address, Endpoint.Port, MasterUsername]' \
                --output json)
            
            local db_host=$(echo "$db_instance_info" | jq -r '.[0]')
            local db_port=$(echo "$db_instance_info" | jq -r '.[1]')
            local db_user=$(echo "$db_instance_info" | jq -r '.[2]')
            
            log "INFO" "Please enter the database password for user $db_user:"
            read -s db_password
            echo
            
            export PGPASSWORD="$db_password"
            
            # Check if we can connect to the database
            if ! psql -h "$db_host" -p "$db_port" -U "$db_user" -d "$target_identifier" -c "SELECT 1" > /dev/null 2>&1; then
                log "ERROR" "Could not connect to database."
                unset PGPASSWORD
                return 1
            fi
            
            log "INFO" "Database connectivity verified."
            
            # Run a few validation queries to check database content
            log "INFO" "Checking database content..."
            
            # Get table count
            local table_count
            table_count=$(psql -h "$db_host" -p "$db_port" -U "$db_user" -d "$target_identifier" -t -c "
                SELECT COUNT(*)
                FROM information_schema.tables
                WHERE table_schema = 'public';" | tr -d ' ')
            
            log "INFO" "Database contains $table_count tables."
            
            if [[ "$table_count" -eq 0 ]]; then
                log "WARNING" "Database appears to be empty. Verify this is expected."
            fi
            
            # Similar validation queries as for snapshot/point-in-time
            
            unset PGPASSWORD
            ;;
            
        s3-files)
            # Count objects in bucket
            log "INFO" "Counting objects in bucket $target_identifier..."
            
            local object_count
            object_count=$(aws s3 ls --recursive "s3://${target_identifier}/" --region "$AWS_REGION" | wc -l)
            
            log "INFO" "Bucket contains $object_count objects."
            
            if [[ "$object_count" -eq 0 ]]; then
                log "WARNING" "Bucket appears to be empty. Verify this is expected."
                return 1
            fi
            
            # Sample a few objects to verify they exist and are accessible
            log "INFO" "Sampling objects to verify accessibility..."
            
            local sample_objects
            sample_objects=$(aws s3 ls "s3://${target_identifier}/" --region "$AWS_REGION" | head -5 | awk '{print $NF}')
            
            if [[ -z "$sample_objects" ]]; then
                log "WARNING" "Could not list objects in bucket."
            else
                for obj in $sample_objects; do
                    if aws s3 ls "s3://${target_identifier}/${obj}" --region "$AWS_REGION" &> /dev/null; then
                        log "INFO" "Object $obj is accessible."
                    else
                        log "WARNING" "Object $obj is not accessible."
                    fi
                done
            fi
            ;;
            
        *)
            log "ERROR" "Invalid restore type for verification: $restore_type"
            return 1
            ;;
    esac
    
    log "INFO" "Verification completed successfully."
    return 0
}

# Function to update application configuration
update_application_config() {
    local restore_type="$1"
    local target_identifier="$2"
    
    log "INFO" "Updating application configuration for $restore_type restore ($target_identifier)..."
    
    case "$restore_type" in
        snapshot|point-in-time)
            # Update database connection parameters in environment configuration
            
            # Get endpoint information for the restored database
            local endpoint_info
            endpoint_info=$(aws rds describe-db-instances \
                --db-instance-identifier "$target_identifier" \
                --region "$AWS_REGION" \
                --query 'DBInstances[0].[Endpoint.Address, Endpoint.Port]' \
                --output json)
            
            local endpoint_address=$(echo "$endpoint_info" | jq -r '.[0]')
            local endpoint_port=$(echo "$endpoint_info" | jq -r '.[1]')
            
            # Update SSM parameters with new connection details
            log "INFO" "Updating database connection parameters in SSM Parameter Store..."
            
            aws ssm put-parameter \
                --name "/metronomics/${ENVIRONMENT}/database/host" \
                --value "$endpoint_address" \
                --type "String" \
                --overwrite \
                --region "$AWS_REGION" > /dev/null
            
            aws ssm put-parameter \
                --name "/metronomics/${ENVIRONMENT}/database/port" \
                --value "$endpoint_port" \
                --type "String" \
                --overwrite \
                --region "$AWS_REGION" > /dev/null
            
            # Update ECS task definitions if needed
            if [[ "$RESTART_SERVICES" == true ]]; then
                log "INFO" "Updating ECS task definitions with new database connection parameters..."
                
                # Get list of services for the environment
                local services
                services=$(aws ecs list-services \
                    --cluster "metronomics-${ENVIRONMENT}" \
                    --region "$AWS_REGION" \
                    --query 'serviceArns[]' \
                    --output text)
                
                if [[ -n "$services" ]]; then
                    for service in $services; do
                        local service_name=$(basename "$service")
                        
                        log "INFO" "Updating service $service_name..."
                        
                        # Force new deployment to pick up the updated SSM parameters
                        aws ecs update-service \
                            --cluster "metronomics-${ENVIRONMENT}" \
                            --service "$service_name" \
                            --force-new-deployment \
                            --region "$AWS_REGION" > /dev/null
                    done
                else
                    log "WARNING" "No ECS services found for environment $ENVIRONMENT"
                fi
            fi
            ;;
            
        logical)
            # Similar to snapshot/point-in-time, but we might need to update only the database name
            # in the connection string, not the host/port
            
            # Update SSM parameters with new database name
            log "INFO" "Updating database name in SSM Parameter Store..."
            
            aws ssm put-parameter \
                --name "/metronomics/${ENVIRONMENT}/database/name" \
                --value "$target_identifier" \
                --type "String" \
                --overwrite \
                --region "$AWS_REGION" > /dev/null
            
            # Similar service updates as for snapshot/point-in-time
            if [[ "$RESTART_SERVICES" == true ]]; then
                log "INFO" "Updating ECS task definitions with new database name..."
                
                # Get list of services for the environment
                local services
                services=$(aws ecs list-services \
                    --cluster "metronomics-${ENVIRONMENT}" \
                    --region "$AWS_REGION" \
                    --query 'serviceArns[]' \
                    --output text)
                
                if [[ -n "$services" ]]; then
                    for service in $services; do
                        local service_name=$(basename "$service")
                        
                        log "INFO" "Updating service $service_name..."
                        
                        # Force new deployment to pick up the updated SSM parameters
                        aws ecs update-service \
                            --cluster "metronomics-${ENVIRONMENT}" \
                            --service "$service_name" \
                            --force-new-deployment \
                            --region "$AWS_REGION" > /dev/null
                    done
                else
                    log "WARNING" "No ECS services found for environment $ENVIRONMENT"
                fi
            fi
            ;;
            
        s3-files)
            # Update S3 bucket references in the application configuration
            
            # Update SSM parameters with new bucket name
            log "INFO" "Updating S3 bucket name in SSM Parameter Store..."
            
            aws ssm put-parameter \
                --name "/metronomics/${ENVIRONMENT}/storage/bucket" \
                --value "$target_identifier" \
                --type "String" \
                --overwrite \
                --region "$AWS_REGION" > /dev/null
            
            # Similar service updates as for database restores
            if [[ "$RESTART_SERVICES" == true ]]; then
                log "INFO" "Updating ECS task definitions with new S3 bucket..."
                
                # Get list of services for the environment
                local services
                services=$(aws ecs list-services \
                    --cluster "metronomics-${ENVIRONMENT}" \
                    --region "$AWS_REGION" \
                    --query 'serviceArns[]' \
                    --output text)
                
                if [[ -n "$services" ]]; then
                    for service in $services; do
                        local service_name=$(basename "$service")
                        
                        log "INFO" "Updating service $service_name..."
                        
                        # Force new deployment to pick up the updated SSM parameters
                        aws ecs update-service \
                            --cluster "metronomics-${ENVIRONMENT}" \
                            --service "$service_name" \
                            --force-new-deployment \
                            --region "$AWS_REGION" > /dev/null
                    done
                else
                    log "WARNING" "No ECS services found for environment $ENVIRONMENT"
                fi
            fi
            ;;
            
        *)
            log "ERROR" "Invalid restore type for configuration update: $restore_type"
            return 1
            ;;
    esac
    
    log "INFO" "Application configuration updated successfully."
    return 0
}

# Function to send restore notification
send_restore_notification() {
    local status="$1"
    local message="$2"
    
    log "INFO" "Sending restore $status notification..."
    
    # Check if SNS topic ARN is set
    if [[ -z "$SNS_TOPIC_ARN" ]]; then
        log "WARNING" "SNS topic ARN not set. Skipping notification."
        return 0
    fi
    
    # Format notification message
    local subject="Metronomics Restore ${status^^}: ${ENVIRONMENT} - ${RESTORE_TYPE}"
    local notification_message="
Restore Operation Details:
--------------------------
Status: $status
Environment: $ENVIRONMENT
Restore Type: $RESTORE_TYPE
Target: $TARGET_IDENTIFIER
Timestamp: $(date "+%Y-%m-%d %H:%M:%S")

$message
"
    
    # Send SNS notification
    aws sns publish \
        --topic-arn "$SNS_TOPIC_ARN" \
        --subject "$subject" \
        --message "$notification_message" \
        --region "$AWS_REGION" > /dev/null
    
    if [[ $? -ne 0 ]]; then
        log "WARNING" "Failed to send notification."
        return 1
    fi
    
    log "INFO" "Notification sent successfully."
    return 0
}

# Function to log restore metrics to CloudWatch
log_restore_metrics() {
    local restore_type="$1"
    local status="$2"
    local duration="$3"
    local size="$4"
    
    log "INFO" "Logging restore metrics to CloudWatch..."
    
    # Send custom metrics to CloudWatch
    aws cloudwatch put-metric-data \
        --namespace "Metronomics/Restore" \
        --metric-data "[
            {
                \"MetricName\": \"RestoreDuration\",
                \"Dimensions\": [
                    {\"Name\": \"Environment\", \"Value\": \"${ENVIRONMENT}\"},
                    {\"Name\": \"RestoreType\", \"Value\": \"${restore_type}\"},
                    {\"Name\": \"Status\", \"Value\": \"${status}\"}
                ],
                \"Value\": ${duration},
                \"Unit\": \"Seconds\"
            },
            {
                \"MetricName\": \"RestoreSize\",
                \"Dimensions\": [
                    {\"Name\": \"Environment\", \"Value\": \"${ENVIRONMENT}\"},
                    {\"Name\": \"RestoreType\", \"Value\": \"${restore_type}\"}
                ],
                \"Value\": ${size},
                \"Unit\": \"Bytes\"
            }
        ]" \
        --region "$AWS_REGION" > /dev/null
    
    if [[ $? -ne 0 ]]; then
        log "WARNING" "Failed to log metrics to CloudWatch."
        return 1
    fi
    
    # Update restore history log in S3
    local timestamp=$(date +%Y%m%d-%H%M%S)
    local history_log="${RESTORE_TEMP_DIR}/restore-history-${timestamp}.json"
    
    cat > "$history_log" <<EOF
{
    "timestamp": "$(date "+%Y-%m-%d %H:%M:%S")",
    "environment": "$ENVIRONMENT",
    "restore_type": "$restore_type",
    "status": "$status",
    "target_identifier": "$TARGET_IDENTIFIER",
    "backup_id": "$BACKUP_ID",
    "duration_seconds": $duration,
    "size_bytes": $size
}
EOF
    
    # Upload history log to S3
    aws s3 cp "$history_log" "s3://${S3_BACKUP_BUCKET}/restore-history/${ENVIRONMENT}/${timestamp}.json" \
        --region "$AWS_REGION" > /dev/null
    
    if [[ $? -ne 0 ]]; then
        log "WARNING" "Failed to upload restore history to S3."
        rm -f "$history_log"
        return 1
    fi
    
    rm -f "$history_log"
    
    log "INFO" "Restore metrics logged successfully."
    return 0
}

# Function to clean up temporary files and resources
cleanup() {
    log "INFO" "Cleaning up temporary files and resources..."
    
    # Remove temporary directory if it exists
    if [[ -d "$RESTORE_TEMP_DIR" ]]; then
        rm -rf "$RESTORE_TEMP_DIR"
    fi
    
    log "INFO" "Cleanup completed."
}

# Main function
main() {
    local args=("$@")
    local start_time=$(date +%s)
    local result=0
    local restore_size=0
    
    # Parse command line arguments
    if ! parse_arguments "${args[@]}"; then
        return 1
    fi
    
    # Create restore temp directory
    mkdir -p "$RESTORE_TEMP_DIR"
    
    # Check prerequisites
    if ! check_prerequisites; then
        return 1
    fi
    
    # If no specific backup identifier is provided, list available backups
    if [[ -z "$BACKUP_ID" && "$RESTORE_TYPE" != "point-in-time" ]]; then
        if ! list_available_backups "$RESTORE_TYPE" ""; then
            return 1
        fi
        
        log "INFO" "Please specify a backup ID using the appropriate option and run the script again."
        return 0
    fi
    
    # Perform the restore based on the restore type
    case "$RESTORE_TYPE" in
        snapshot)
            TARGET_IDENTIFIER=$(restore_from_snapshot "$BACKUP_ID" "$TARGET_IDENTIFIER" "")
            result=$?
            ;;
            
        point-in-time)
            if [[ "$RECOVERY_POINT" == "latest" ]]; then
                # Use the latest restorable time
                TIMESTAMP=$(aws rds describe-db-instances \
                    --db-instance-identifier "$RDS_INSTANCE_IDENTIFIER" \
                    --region "$AWS_REGION" \
                    --query 'DBInstances[0].LatestRestorableTime' \
                    --output text)
                
                log "INFO" "Using latest restorable time: $TIMESTAMP"
            fi
            
            TARGET_IDENTIFIER=$(restore_point_in_time "$TIMESTAMP" "$TARGET_IDENTIFIER" "")
            result=$?
            ;;
            
        logical)
            result=$(restore_logical_backup "$BACKUP_ID" "$TARGET_IDENTIFIER" "")
            ;;
            
        s3-files)
            result=$(restore_s3_files "$BACKUP_ID" "$TARGET_IDENTIFIER" "")
            ;;
            
        *)
            log "ERROR" "Invalid restore type: $RESTORE_TYPE"
            return 1
            ;;
    esac
    
    if [[ $result -ne 0 ]]; then
        log "ERROR" "Restore failed with status $result"
        
        # Send failure notification
        send_restore_notification "FAILED" "Restore operation failed with status $result"
        
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        # Log metrics even for failed restore
        log_restore_metrics "$RESTORE_TYPE" "FAILED" "$duration" "$restore_size"
        
        # Cleanup
        cleanup
        
        return 1
    fi
    
    # Get estimated size of restored data (this is approximate)
    case "$RESTORE_TYPE" in
        snapshot|point-in-time)
            # Get allocated storage for the database
            restore_size=$(aws rds describe-db-instances \
                --db-instance-identifier "$TARGET_IDENTIFIER" \
                --region "$AWS_REGION" \
                --query 'DBInstances[0].AllocatedStorage' \
                --output text)
            
            # Convert from GB to bytes
            restore_size=$((restore_size * 1024 * 1024 * 1024))
            ;;
            
        logical)
            # Get size of backup file
            if [[ "$BACKUP_ID" == s3://* ]]; then
                local s3_size
                s3_size=$(aws s3api head-object \
                    --bucket "$(echo "$BACKUP_ID" | cut -d '/' -f 3)" \
                    --key "$(echo "$BACKUP_ID" | cut -d '/' -f 4-)" \
                    --region "$AWS_REGION" \
                    --query 'ContentLength' \
                    --output text)
                
                restore_size=$s3_size
            else
                restore_size=$(stat -c%s "$BACKUP_ID")
            fi
            ;;
            
        s3-files)
            # Get total size of objects in bucket
            local s3_total_size
            s3_total_size=$(aws s3 ls --recursive "$BACKUP_ID" --region "$AWS_REGION" --summarize | grep "Total Size" | awk '{print $3}')
            
            if [[ -n "$s3_total_size" ]]; then
                restore_size=$s3_total_size
            else
                restore_size=0
            fi
            ;;
    esac
    
    # Verify restore if requested
    if [[ "$VERIFY" == true ]]; then
        log "INFO" "Verifying restore..."
        
        if ! verify_restore "$RESTORE_TYPE" "$TARGET_IDENTIFIER"; then
            log "ERROR" "Restore verification failed."
            
            # Send verification failure notification
            send_restore_notification "VERIFICATION_FAILED" "Restore operation succeeded but verification failed."
            
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            
            # Log metrics
            log_restore_metrics "$RESTORE_TYPE" "VERIFICATION_FAILED" "$duration" "$restore_size"
            
            # Cleanup
            cleanup
            
            return 1
        fi
        
        log "INFO" "Restore verification successful."
    fi
    
    # Update application configuration if requested
    if [[ "$UPDATE_CONFIG" == true ]]; then
        log "INFO" "Updating application configuration..."
        
        if ! update_application_config "$RESTORE_TYPE" "$TARGET_IDENTIFIER"; then
            log "ERROR" "Failed to update application configuration."
            
            # Send config update failure notification
            send_restore_notification "CONFIG_UPDATE_FAILED" "Restore operation and verification succeeded but configuration update failed."
            
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            
            # Log metrics
            log_restore_metrics "$RESTORE_TYPE" "CONFIG_UPDATE_FAILED" "$duration" "$restore_size"
            
            # Cleanup
            cleanup
            
            return 1
        fi
        
        log "INFO" "Application configuration updated successfully."
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log "INFO" "Restore completed successfully in $duration seconds."
    
    # Send success notification
    send_restore_notification "SUCCESS" "Restore operation completed successfully in $duration seconds."
    
    # Log metrics
    log_restore_metrics "$RESTORE_TYPE" "SUCCESS" "$duration" "$restore_size"
    
    # Cleanup
    cleanup
    
    return 0
}

# Execute main function with all script arguments
main "$@"
exit $?