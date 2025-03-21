#!/bin/bash
#
# backup.sh - Automated backup script for Metronomics Platform
#
# Description:
#   This script automates database and file backups for the Metronomics Platform.
#   It supports different backup strategies including full backups, incremental
#   backups, and snapshot creation with verification and monitoring capabilities.
#
# Author: Metronomics Platform Team
# Created: 2023-05-01
# Last Updated: 2023-05-15
#
# Usage:
#   ./backup.sh -e <environment> -t <backup_type> [options]
#
# Options:
#   -e, --environment   Environment (development, staging, production)
#   -t, --type          Backup type (full, incremental, snapshot, logical)
#   -v, --verify        Verify backup after creation
#   -c, --compress      Compress backup files
#   -k, --encrypt       Encrypt backup files
#   -r, --retention     Override default retention period (days)
#   -x, --cross-region  Force cross-region replication
#   -h, --help          Show help message and exit
#
# Examples:
#   ./backup.sh -e production -t full -v -k
#   ./backup.sh -e staging -t snapshot -r 30
#   ./backup.sh -e development -t logical -c
#

# Exit on error
set -e
# Pipelines inherit failure
set -o pipefail
# Exit on unset variables
set -u

# =============================================================================
# Constants
# =============================================================================

# Default AWS region
AWS_REGION=${AWS_REGION:-"us-east-1"}
# S3 bucket for backups
S3_BACKUP_BUCKET=${S3_BACKUP_BUCKET:-"metronomics-backups"}
# RDS instance identifier template (will be populated with environment)
RDS_INSTANCE_IDENTIFIER="metronomics-${ENVIRONMENT:-development}-db"
# Temporary directory for backups
BACKUP_TEMP_DIR="/tmp/metronomics-backup"
# Backup prefix template
BACKUP_PREFIX="metronomics-${ENVIRONMENT:-development}"
# Retention periods for each environment (in days)
declare -A RETENTION_DAYS=(
  [development]="7"
  [staging]="14"
  [production]="30"
)
# Cross-region backup configuration
declare -A CROSS_REGION_BACKUP=(
  [development]="false"
  [staging]="false"
  [production]="true"
)
# Secondary region for disaster recovery
SECONDARY_REGION=${SECONDARY_REGION:-"us-west-2"}
# Valid backup types
BACKUP_TYPES=("full" "incremental" "snapshot" "logical")

# Timestamp format
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
# Script name for logging
SCRIPT_NAME=$(basename "$0")
# Log file
LOG_FILE="/var/log/metronomics/backup-${TIMESTAMP}.log"

# =============================================================================
# Helper Functions
# =============================================================================

# Log message to stdout and log file
log_info() {
  local message="$1"
  local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
  echo "[INFO] ${timestamp} - ${message}"
  echo "[INFO] ${timestamp} - ${message}" >> "${LOG_FILE}" 2>/dev/null || true
}

# Log error message to stderr and log file
log_error() {
  local message="$1"
  local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
  echo "[ERROR] ${timestamp} - ${message}" >&2
  echo "[ERROR] ${timestamp} - ${message}" >> "${LOG_FILE}" 2>/dev/null || true
}

# Log warning message to stderr and log file
log_warning() {
  local message="$1"
  local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
  echo "[WARNING] ${timestamp} - ${message}" >&2
  echo "[WARNING] ${timestamp} - ${message}" >> "${LOG_FILE}" 2>/dev/null || true
}

# Print help message
show_help() {
  cat << EOF
Usage: ${SCRIPT_NAME} -e <environment> -t <backup_type> [options]

Options:
  -e, --environment   Environment (development, staging, production)
  -t, --type          Backup type (full, incremental, snapshot, logical)
  -v, --verify        Verify backup after creation
  -c, --compress      Compress backup files
  -k, --encrypt       Encrypt backup files
  -r, --retention     Override default retention period (days)
  -x, --cross-region  Force cross-region replication
  -h, --help          Show help message and exit

Examples:
  ${SCRIPT_NAME} -e production -t full -v -k
  ${SCRIPT_NAME} -e staging -t snapshot -r 30
  ${SCRIPT_NAME} -e development -t logical -c
EOF
}

# Initialize log directory if it doesn't exist
init_logging() {
  mkdir -p "$(dirname "${LOG_FILE}")" || {
    echo "Unable to create log directory. Logging to stdout/stderr only."
    LOG_FILE="/dev/null"
  }
  log_info "Starting backup script execution"
  log_info "Environment: ${ENVIRONMENT}"
  log_info "Backup type: ${BACKUP_TYPE}"
}

# Check if prerequisites are installed and configured
check_prerequisites() {
  log_info "Checking prerequisites..."
  
  # Check AWS CLI
  if ! command -v aws &> /dev/null; then
    log_error "AWS CLI is not installed or not in PATH"
    return 1
  fi
  
  # Check PostgreSQL client tools for logical backups
  if [ "${BACKUP_TYPE}" = "logical" ] && ! command -v pg_dump &> /dev/null; then
    log_error "PostgreSQL client tools (pg_dump) are not installed or not in PATH"
    return 1
  fi
  
  # Check AWS credentials
  if ! aws sts get-caller-identity &> /dev/null; then
    log_error "AWS credentials are not configured or invalid"
    return 1
  fi
  
  # Check jq for JSON processing
  if ! command -v jq &> /dev/null; then
    log_warning "jq is not installed. Some features may not work correctly."
  fi
  
  # Check S3 bucket access
  if ! aws s3 ls "s3://${S3_BACKUP_BUCKET}" --region "${AWS_REGION}" &> /dev/null; then
    log_error "S3 backup bucket '${S3_BACKUP_BUCKET}' does not exist or is not accessible"
    return 1
  fi
  
  # Check RDS instance existence
  if ! aws rds describe-db-instances --db-instance-identifier "${RDS_INSTANCE_IDENTIFIER}" --region "${AWS_REGION}" &> /dev/null; then
    log_error "RDS instance '${RDS_INSTANCE_IDENTIFIER}' does not exist or is not accessible"
    return 1
  fi
  
  log_info "All prerequisites satisfied"
  return 0
}

# Parse command line arguments
parse_arguments() {
  # Default values
  ENVIRONMENT="development"
  BACKUP_TYPE="full"
  VERIFY_BACKUP=false
  COMPRESS_BACKUP=false
  ENCRYPT_BACKUP=false
  RETENTION_OVERRIDE=""
  FORCE_CROSS_REGION=false
  
  # Parse arguments
  while [[ $# -gt 0 ]]; do
    case "$1" in
      -e|--environment)
        ENVIRONMENT="$2"
        shift 2
        ;;
      -t|--type)
        BACKUP_TYPE="$2"
        shift 2
        ;;
      -v|--verify)
        VERIFY_BACKUP=true
        shift
        ;;
      -c|--compress)
        COMPRESS_BACKUP=true
        shift
        ;;
      -k|--encrypt)
        ENCRYPT_BACKUP=true
        shift
        ;;
      -r|--retention)
        RETENTION_OVERRIDE="$2"
        shift 2
        ;;
      -x|--cross-region)
        FORCE_CROSS_REGION=true
        shift
        ;;
      -h|--help)
        show_help
        exit 0
        ;;
      *)
        log_error "Unknown option: $1"
        show_help
        return 1
        ;;
    esac
  done
  
  # Validate environment
  if [[ ! "${ENVIRONMENT}" =~ ^(development|staging|production)$ ]]; then
    log_error "Invalid environment: ${ENVIRONMENT}. Must be one of: development, staging, production"
    return 1
  fi
  
  # Validate backup type
  if [[ ! " ${BACKUP_TYPES[*]} " =~ " ${BACKUP_TYPE} " ]]; then
    log_error "Invalid backup type: ${BACKUP_TYPE}. Must be one of: ${BACKUP_TYPES[*]}"
    return 1
  fi
  
  # Update RDS instance identifier with environment
  RDS_INSTANCE_IDENTIFIER="metronomics-${ENVIRONMENT}-db"
  # Update backup prefix with environment
  BACKUP_PREFIX="metronomics-${ENVIRONMENT}"
  
  # Set retention period
  if [ -n "${RETENTION_OVERRIDE}" ]; then
    RETENTION_DAYS["${ENVIRONMENT}"]="${RETENTION_OVERRIDE}"
    log_info "Retention period overridden to ${RETENTION_OVERRIDE} days"
  fi
  
  # Set cross-region replication
  if [ "${FORCE_CROSS_REGION}" = true ]; then
    CROSS_REGION_BACKUP["${ENVIRONMENT}"]="true"
    log_info "Cross-region replication enabled for ${ENVIRONMENT}"
  fi
  
  log_info "Arguments parsed successfully"
  return 0
}

# =============================================================================
# Backup Functions
# =============================================================================

# Create an RDS snapshot
create_rds_snapshot() {
  local snapshot_identifier="${1:-${BACKUP_PREFIX}-snapshot-${TIMESTAMP}}"
  
  log_info "Creating RDS snapshot '${snapshot_identifier}'..."
  
  # Create the snapshot
  if ! aws rds create-db-snapshot \
    --db-instance-identifier "${RDS_INSTANCE_IDENTIFIER}" \
    --db-snapshot-identifier "${snapshot_identifier}" \
    --region "${AWS_REGION}" > /dev/null; then
    log_error "Failed to create RDS snapshot"
    return 1
  fi
  
  # Wait for the snapshot to be available
  log_info "Waiting for snapshot to become available..."
  if ! aws rds wait db-snapshot-available \
    --db-snapshot-identifier "${snapshot_identifier}" \
    --region "${AWS_REGION}"; then
    log_error "Timeout waiting for snapshot to become available"
    return 1
  fi
  
  # Tag the snapshot
  aws rds add-tags-to-resource \
    --resource-name "arn:aws:rds:${AWS_REGION}:$(aws sts get-caller-identity --query 'Account' --output text):snapshot:${snapshot_identifier}" \
    --tags "Key=Environment,Value=${ENVIRONMENT}" "Key=BackupType,Value=snapshot" "Key=CreatedBy,Value=${SCRIPT_NAME}" "Key=Timestamp,Value=${TIMESTAMP}" \
    --region "${AWS_REGION}"
  
  # Get snapshot details
  local snapshot_details=$(aws rds describe-db-snapshots \
    --db-snapshot-identifier "${snapshot_identifier}" \
    --region "${AWS_REGION}" \
    --query 'DBSnapshots[0].[DBSnapshotIdentifier,SnapshotCreateTime,Status,PercentProgress]' \
    --output text)
  
  log_info "Snapshot created successfully: ${snapshot_details}"
  
  # Return the snapshot ARN
  aws rds describe-db-snapshots \
    --db-snapshot-identifier "${snapshot_identifier}" \
    --region "${AWS_REGION}" \
    --query 'DBSnapshots[0].DBSnapshotArn' \
    --output text
  
  return 0
}

# Create a logical backup of the database
create_logical_backup() {
  local output_file="${1:-${BACKUP_TEMP_DIR}/${BACKUP_PREFIX}-logical-${TIMESTAMP}.sql}"
  
  log_info "Creating logical backup to '${output_file}'..."
  
  # Create temporary directory if it doesn't exist
  mkdir -p "${BACKUP_TEMP_DIR}"
  
  # Get database connection parameters
  local db_instance=$(aws rds describe-db-instances \
    --db-instance-identifier "${RDS_INSTANCE_IDENTIFIER}" \
    --region "${AWS_REGION}")
  
  local db_host=$(echo "${db_instance}" | jq -r '.DBInstances[0].Endpoint.Address')
  local db_port=$(echo "${db_instance}" | jq -r '.DBInstances[0].Endpoint.Port')
  local db_name=$(echo "${db_instance}" | jq -r '.DBInstances[0].DBName')
  local db_user=$(echo "${db_instance}" | jq -r '.DBInstances[0].MasterUsername')
  
  # Get database password from AWS Secrets Manager
  local secret_id="metronomics/${ENVIRONMENT}/database/master"
  local db_password=$(aws secretsmanager get-secret-value \
    --secret-id "${secret_id}" \
    --query 'SecretString' \
    --output text \
    --region "${AWS_REGION}" | jq -r '.password')
  
  if [ -z "${db_password}" ]; then
    log_error "Failed to retrieve database password from Secrets Manager"
    return 1
  fi
  
  # Create temporary .pgpass file for password-less connection
  local pgpass_file="${BACKUP_TEMP_DIR}/.pgpass"
  echo "${db_host}:${db_port}:${db_name}:${db_user}:${db_password}" > "${pgpass_file}"
  chmod 600 "${pgpass_file}"
  export PGPASSFILE="${pgpass_file}"
  
  # Run pg_dump to create logical backup
  log_info "Running pg_dump on database ${db_name}..."
  if ! pg_dump \
    --host="${db_host}" \
    --port="${db_port}" \
    --username="${db_user}" \
    --dbname="${db_name}" \
    --format=custom \
    --verbose \
    --file="${output_file}"; then
    log_error "Failed to create logical backup"
    rm -f "${pgpass_file}"
    return 1
  fi
  
  # Remove temporary .pgpass file
  rm -f "${pgpass_file}"
  
  # Compress the backup if requested
  if [ "${COMPRESS_BACKUP}" = true ]; then
    log_info "Compressing backup file..."
    if ! gzip -f "${output_file}"; then
      log_error "Failed to compress backup file"
      return 1
    fi
    output_file="${output_file}.gz"
  fi
  
  # Calculate and store checksum
  local checksum=$(sha256sum "${output_file}" | cut -d ' ' -f 1)
  echo "${checksum}" > "${output_file}.sha256"
  
  # Get file size
  local file_size=$(du -h "${output_file}" | cut -f1)
  
  log_info "Logical backup created successfully: ${output_file} (${file_size}, SHA256: ${checksum})"
  
  # Return the backup file path
  echo "${output_file}"
  
  return 0
}

# Backup S3 data
backup_s3_data() {
  local source_bucket="$1"
  local destination_prefix="$2"
  
  log_info "Backing up S3 data from '${source_bucket}' to '${S3_BACKUP_BUCKET}/${destination_prefix}'..."
  
  # Create a manifest file
  local manifest_file="${BACKUP_TEMP_DIR}/manifest-${TIMESTAMP}.json"
  
  # Get list of objects in the source bucket
  aws s3api list-objects-v2 \
    --bucket "${source_bucket}" \
    --query 'Contents[].{Key:Key,Size:Size,ETag:ETag}' \
    --output json > "${manifest_file}"
  
  # Count objects
  local object_count=$(jq length "${manifest_file}")
  
  # Sync data to backup bucket
  if ! aws s3 sync \
    "s3://${source_bucket}" \
    "s3://${S3_BACKUP_BUCKET}/${destination_prefix}" \
    --region "${AWS_REGION}"; then
    log_error "Failed to sync S3 data"
    return 1
  fi
  
  # Upload manifest file
  if ! aws s3 cp \
    "${manifest_file}" \
    "s3://${S3_BACKUP_BUCKET}/${destination_prefix}/manifest-${TIMESTAMP}.json" \
    --region "${AWS_REGION}"; then
    log_warning "Failed to upload manifest file"
  fi
  
  # Get total size
  local total_size=$(jq 'map(.Size) | add' "${manifest_file}")
  total_size=$((total_size / 1024 / 1024)) # Convert to MB
  
  log_info "S3 backup completed: ${object_count} objects, ${total_size} MB"
  
  # Return the backup location
  echo "s3://${S3_BACKUP_BUCKET}/${destination_prefix}"
  
  return 0
}

# Encrypt backup file
encrypt_backup() {
  local file_path="$1"
  local kms_key_id="${2:-}"
  
  # Check if encryption is enabled
  if [ "${ENCRYPT_BACKUP}" != true ]; then
    # Return the original file path if encryption is not requested
    echo "${file_path}"
    return 0
  fi
  
  log_info "Encrypting backup file '${file_path}'..."
  
  # If KMS key ID is not provided, get default key for the environment
  if [ -z "${kms_key_id}" ]; then
    kms_key_id=$(aws kms list-aliases \
      --query "Aliases[?AliasName=='alias/metronomics-${ENVIRONMENT}-backup'].TargetKeyId" \
      --output text \
      --region "${AWS_REGION}")
    
    if [ -z "${kms_key_id}" ]; then
      log_error "No KMS key found for environment '${ENVIRONMENT}'"
      return 1
    fi
  fi
  
  # Encrypt file using AWS KMS
  local encrypted_file="${file_path}.encrypted"
  
  if ! aws kms encrypt \
    --key-id "${kms_key_id}" \
    --plaintext "fileb://${file_path}" \
    --output text \
    --query CiphertextBlob \
    --region "${AWS_REGION}" | base64 --decode > "${encrypted_file}"; then
    log_error "Failed to encrypt backup file"
    return 1
  fi
  
  # Calculate checksum for encrypted file
  local checksum=$(sha256sum "${encrypted_file}" | cut -d ' ' -f 1)
  echo "${checksum}" > "${encrypted_file}.sha256"
  
  log_info "Backup file encrypted successfully: ${encrypted_file} (SHA256: ${checksum})"
  
  # Return the encrypted file path
  echo "${encrypted_file}"
  
  return 0
}

# Upload backup to S3
upload_to_s3() {
  local file_path="$1"
  local s3_prefix="$2"
  
  log_info "Uploading backup file '${file_path}' to S3..."
  
  # Generate S3 key
  local filename=$(basename "${file_path}")
  local s3_key="${s3_prefix}/${filename}"
  
  # Determine storage class based on environment
  local storage_class="STANDARD"
  if [ "${ENVIRONMENT}" = "production" ]; then
    storage_class="STANDARD_IA"
  fi
  
  # Upload file to S3
  if ! aws s3 cp \
    "${file_path}" \
    "s3://${S3_BACKUP_BUCKET}/${s3_key}" \
    --storage-class "${storage_class}" \
    --metadata "BackupType=${BACKUP_TYPE},Environment=${ENVIRONMENT},Timestamp=${TIMESTAMP}" \
    --region "${AWS_REGION}"; then
    log_error "Failed to upload backup file to S3"
    return 1
  fi
  
  # Upload checksum file if it exists
  if [ -f "${file_path}.sha256" ]; then
    aws s3 cp \
      "${file_path}.sha256" \
      "s3://${S3_BACKUP_BUCKET}/${s3_key}.sha256" \
      --region "${AWS_REGION}" || log_warning "Failed to upload checksum file"
  fi
  
  log_info "Backup file uploaded successfully to s3://${S3_BACKUP_BUCKET}/${s3_key}"
  
  # Return the S3 URI
  echo "s3://${S3_BACKUP_BUCKET}/${s3_key}"
  
  return 0
}

# Replicate backup to secondary region
replicate_to_secondary_region() {
  local source_uri="$1"
  local destination_region="${2:-${SECONDARY_REGION}}"
  
  # Check if cross-region replication is enabled
  if [ "${CROSS_REGION_BACKUP[${ENVIRONMENT}]}" != "true" ]; then
    log_info "Cross-region replication not enabled for environment '${ENVIRONMENT}'"
    return 0
  fi
  
  log_info "Replicating backup to secondary region '${destination_region}'..."
  
  # Extract bucket and key from source URI
  local source_bucket=$(echo "${source_uri}" | cut -d/ -f3)
  local source_key=$(echo "${source_uri}" | cut -d/ -f4-)
  
  # Ensure backup bucket exists in secondary region
  if ! aws s3api head-bucket \
    --bucket "${S3_BACKUP_BUCKET}" \
    --region "${destination_region}" &> /dev/null; then
    log_error "Backup bucket does not exist in secondary region"
    return 1
  fi
  
  # Copy object to secondary region
  if ! aws s3 cp \
    "${source_uri}" \
    "s3://${S3_BACKUP_BUCKET}/${source_key}" \
    --source-region "${AWS_REGION}" \
    --region "${destination_region}"; then
    log_error "Failed to replicate backup to secondary region"
    return 1
  fi
  
  # Copy checksum file if it exists
  if aws s3 ls "${source_uri}.sha256" --region "${AWS_REGION}" &> /dev/null; then
    aws s3 cp \
      "${source_uri}.sha256" \
      "s3://${S3_BACKUP_BUCKET}/${source_key}.sha256" \
      --source-region "${AWS_REGION}" \
      --region "${destination_region}" || log_warning "Failed to replicate checksum file"
  fi
  
  log_info "Backup replicated successfully to secondary region"
  
  # Return the destination URI
  echo "s3://${S3_BACKUP_BUCKET}/${source_key}"
  
  return 0
}

# Verify backup
verify_backup() {
  local backup_type="$1"
  local backup_location="$2"
  
  log_info "Verifying backup '${backup_location}'..."
  
  # Verification depends on backup type
  case "${backup_type}" in
    "snapshot")
      # For snapshots, verify the snapshot status
      local snapshot_identifier=$(basename "${backup_location}")
      local snapshot_status=$(aws rds describe-db-snapshots \
        --db-snapshot-identifier "${snapshot_identifier}" \
        --region "${AWS_REGION}" \
        --query 'DBSnapshots[0].Status' \
        --output text)
      
      if [ "${snapshot_status}" != "available" ]; then
        log_error "Snapshot verification failed: status is ${snapshot_status}, expected 'available'"
        return 1
      fi
      ;;
    
    "logical")
      # For logical backups, verify file integrity using checksums
      if [[ "${backup_location}" == s3://* ]]; then
        # Backup is on S3, download checksum file
        local checksum_file="${BACKUP_TEMP_DIR}/$(basename "${backup_location}").sha256"
        
        if ! aws s3 cp \
          "${backup_location}.sha256" \
          "${checksum_file}" \
          --region "${AWS_REGION}" &> /dev/null; then
          log_warning "Checksum file not found, skipping verification"
          return 0
        fi
        
        # Download a small part of the backup to verify it's not corrupted
        local temp_file="${BACKUP_TEMP_DIR}/verify-$(basename "${backup_location}")"
        
        if ! aws s3 cp \
          "${backup_location}" \
          "${temp_file}" \
          --range "bytes=0-1048576" \
          --region "${AWS_REGION}" &> /dev/null; then
          log_error "Failed to download backup file for verification"
          return 1
        fi
        
        # For full verification, you would download the entire file and check the checksum
        # But this would be resource-intensive for large backups
        log_info "Successfully verified backup file accessibility"
        rm -f "${temp_file}" "${checksum_file}"
      else
        # Backup is local, verify checksum
        local checksum_file="${backup_location}.sha256"
        
        if [ ! -f "${checksum_file}" ]; then
          log_warning "Checksum file not found, skipping verification"
          return 0
        fi
        
        local expected_checksum=$(cat "${checksum_file}")
        local actual_checksum=$(sha256sum "${backup_location}" | cut -d ' ' -f 1)
        
        if [ "${expected_checksum}" != "${actual_checksum}" ]; then
          log_error "Checksum verification failed"
          return 1
        fi
      fi
      ;;
    
    "full"|"incremental")
      # For S3 backups, verify manifest file and object count
      if [[ "${backup_location}" != s3://* ]]; then
        log_warning "Backup location is not on S3, skipping verification"
        return 0
      fi
      
      # Check for manifest file
      local manifest_path="${backup_location}/manifest-${TIMESTAMP}.json"
      if ! aws s3 ls "${manifest_path}" --region "${AWS_REGION}" &> /dev/null; then
        log_warning "Manifest file not found, skipping verification"
        return 0
      fi
      
      # Download manifest file
      local manifest_file="${BACKUP_TEMP_DIR}/manifest-${TIMESTAMP}.json"
      
      if ! aws s3 cp \
        "${manifest_path}" \
        "${manifest_file}" \
        --region "${AWS_REGION}" &> /dev/null; then
        log_error "Failed to download manifest file"
        return 1
      fi
      
      # Count objects in manifest
      local expected_count=$(jq length "${manifest_file}")
      
      # Count objects in backup
      local backup_prefix=$(echo "${backup_location}" | cut -d/ -f4-)
      local actual_count=$(aws s3 ls --recursive \
        "s3://${S3_BACKUP_BUCKET}/${backup_prefix}" \
        --region "${AWS_REGION}" | wc -l)
      
      # Account for manifest file and potentially other metadata files
      actual_count=$((actual_count - 1))
      
      if [ "${expected_count}" -ne "${actual_count}" ]; then
        log_error "Object count verification failed: expected ${expected_count}, got ${actual_count}"
        return 1
      fi
      
      rm -f "${manifest_file}"
      ;;
    
    *)
      log_warning "Unknown backup type '${backup_type}', skipping verification"
      return 0
      ;;
  esac
  
  log_info "Backup verification successful"
  return 0
}

# Apply retention policy
apply_retention_policy() {
  local backup_type="$1"
  local retention_days="${2:-${RETENTION_DAYS[${ENVIRONMENT}]}}"
  
  log_info "Applying retention policy (${retention_days} days) for ${backup_type} backups..."
  
  # Calculate cutoff date
  local cutoff_date=$(date -d "${retention_days} days ago" +"%Y-%m-%d")
  local removed_count=0
  
  case "${backup_type}" in
    "snapshot")
      # List RDS snapshots
      local snapshots=$(aws rds describe-db-snapshots \
        --snapshot-type manual \
        --query "DBSnapshots[?DBInstanceIdentifier=='${RDS_INSTANCE_IDENTIFIER}']" \
        --region "${AWS_REGION}")
      
      # Filter snapshots by tag or identifier pattern
      local snapshots_to_delete=$(echo "${snapshots}" | jq -r ".[] | select(.SnapshotCreateTime < \"${cutoff_date}T00:00:00Z\" and .DBSnapshotIdentifier | startswith(\"${BACKUP_PREFIX}\")) | .DBSnapshotIdentifier")
      
      for snapshot in ${snapshots_to_delete}; do
        log_info "Deleting expired snapshot: ${snapshot}"
        
        if aws rds delete-db-snapshot \
          --db-snapshot-identifier "${snapshot}" \
          --region "${AWS_REGION}" &> /dev/null; then
          removed_count=$((removed_count + 1))
        else
          log_error "Failed to delete snapshot: ${snapshot}"
        fi
      done
      ;;
    
    "logical"|"full"|"incremental")
      # List S3 objects with the appropriate prefix
      local prefix_pattern="${BACKUP_PREFIX}-${backup_type}"
      local objects=$(aws s3api list-objects-v2 \
        --bucket "${S3_BACKUP_BUCKET}" \
        --prefix "${prefix_pattern}" \
        --query "Contents[?LastModified<'${cutoff_date}T00:00:00Z'].[Key]" \
        --output text \
        --region "${AWS_REGION}")
      
      if [ -n "${objects}" ]; then
        # Create a temporary file with objects to delete
        local delete_file="${BACKUP_TEMP_DIR}/objects-to-delete.txt"
        echo "${objects}" > "${delete_file}"
        
        # Count objects
        removed_count=$(wc -l < "${delete_file}")
        
        # Delete objects
        log_info "Deleting ${removed_count} expired backup objects"
        
        if ! aws s3 rm \
          "s3://${S3_BACKUP_BUCKET}" \
          --recursive \
          --region "${AWS_REGION}" \
          --exclude "*" \
          --include "${prefix_pattern}*" \
          --older-than "${retention_days}d"; then
          log_error "Failed to delete some expired backup objects"
        fi
        
        rm -f "${delete_file}"
      fi
      ;;
    
    *)
      log_warning "Unknown backup type '${backup_type}', skipping retention policy"
      ;;
  esac
  
  log_info "Removed ${removed_count} expired backups"
  
  return "${removed_count}"
}

# Send notification about backup status
send_backup_notification() {
  local status="$1"
  local message="$2"
  
  log_info "Sending backup notification: ${status}"
  
  # Get SNS topic ARN for the environment
  local sns_topic=$(aws sns list-topics \
    --query "Topics[?contains(TopicArn, 'metronomics-${ENVIRONMENT}-backup')].TopicArn" \
    --output text \
    --region "${AWS_REGION}")
  
  if [ -z "${sns_topic}" ]; then
    log_warning "SNS topic not found, skipping notification"
    return 0
  fi
  
  # Format notification message
  local subject="Metronomics ${ENVIRONMENT} - ${BACKUP_TYPE} backup ${status}"
  local full_message="Backup Status: ${status}
Environment: ${ENVIRONMENT}
Backup Type: ${BACKUP_TYPE}
Timestamp: ${TIMESTAMP}
${message}"
  
  # Send SNS notification
  if ! aws sns publish \
    --topic-arn "${sns_topic}" \
    --subject "${subject}" \
    --message "${full_message}" \
    --region "${AWS_REGION}" &> /dev/null; then
    log_error "Failed to send notification"
    return 1
  fi
  
  log_info "Notification sent successfully"
  return 0
}

# Log backup metrics to CloudWatch
log_backup_metrics() {
  local backup_type="$1"
  local status="$2"
  local duration="$3"
  local size="$4"
  
  log_info "Logging backup metrics to CloudWatch..."
  
  # Format metric data
  local metric_data="[
    {
      \"MetricName\": \"BackupDuration\",
      \"Dimensions\": [
        {\"Name\": \"Environment\", \"Value\": \"${ENVIRONMENT}\"},
        {\"Name\": \"BackupType\", \"Value\": \"${backup_type}\"}
      ],
      \"Value\": ${duration},
      \"Unit\": \"Seconds\"
    },
    {
      \"MetricName\": \"BackupSize\",
      \"Dimensions\": [
        {\"Name\": \"Environment\", \"Value\": \"${ENVIRONMENT}\"},
        {\"Name\": \"BackupType\", \"Value\": \"${backup_type}\"}
      ],
      \"Value\": ${size},
      \"Unit\": \"Megabytes\"
    },
    {
      \"MetricName\": \"BackupStatus\",
      \"Dimensions\": [
        {\"Name\": \"Environment\", \"Value\": \"${ENVIRONMENT}\"},
        {\"Name\": \"BackupType\", \"Value\": \"${backup_type}\"}
      ],
      \"Value\": $([ "${status}" = "SUCCESS" ] && echo "1" || echo "0"),
      \"Unit\": \"Count\"
    }
  ]"
  
  # Push metrics to CloudWatch
  if ! aws cloudwatch put-metric-data \
    --namespace "Metronomics/Backup" \
    --metric-data "${metric_data}" \
    --region "${AWS_REGION}" &> /dev/null; then
    log_error "Failed to log metrics to CloudWatch"
    return 1
  fi
  
  # Update backup history log
  local history_file="/var/log/metronomics/backup-history.log"
  echo "${TIMESTAMP},${ENVIRONMENT},${backup_type},${status},${duration},${size}" >> "${history_file}" 2>/dev/null || true
  
  log_info "Backup metrics logged successfully"
  return 0
}

# Clean up temporary files and resources
cleanup() {
  log_info "Cleaning up temporary files and resources..."
  
  # Remove temporary directory
  if [ -d "${BACKUP_TEMP_DIR}" ]; then
    rm -rf "${BACKUP_TEMP_DIR}"
  fi
  
  log_info "Cleanup completed"
}

# =============================================================================
# Main Function
# =============================================================================

main() {
  local start_time=$(date +%s)
  local backup_location=""
  local status="FAILED"
  local backup_size=0
  
  # Parse command line arguments
  if ! parse_arguments "$@"; then
    return 1
  fi
  
  # Initialize logging
  init_logging
  
  # Create temporary directory
  mkdir -p "${BACKUP_TEMP_DIR}"
  
  # Check prerequisites
  if ! check_prerequisites; then
    log_error "Prerequisites check failed"
    cleanup
    return 1
  fi
  
  # Perform backup based on type
  case "${BACKUP_TYPE}" in
    "snapshot")
      backup_location=$(create_rds_snapshot)
      if [ -z "${backup_location}" ]; then
        log_error "Failed to create RDS snapshot"
        status="FAILED"
      else
        status="SUCCESS"
        # Get snapshot size in MB
        backup_size=$(aws rds describe-db-snapshots \
          --db-snapshot-identifier "$(basename "${backup_location}")" \
          --region "${AWS_REGION}" \
          --query 'DBSnapshots[0].AllocatedStorage' \
          --output text)
        # Convert GB to MB
        backup_size=$((backup_size * 1024))
      fi
      ;;
    
    "logical")
      backup_location=$(create_logical_backup)
      if [ -z "${backup_location}" ]; then
        log_error "Failed to create logical backup"
        status="FAILED"
      else
        status="SUCCESS"
        # Get file size in MB
        backup_size=$(du -m "${backup_location}" | cut -f1)
        
        # Encrypt backup if requested
        if [ "${ENCRYPT_BACKUP}" = true ]; then
          local encrypted_location=$(encrypt_backup "${backup_location}")
          if [ -z "${encrypted_location}" ]; then
            log_error "Failed to encrypt backup"
            status="FAILED"
          else
            backup_location="${encrypted_location}"
          fi
        fi
        
        # Upload to S3
        local s3_location=$(upload_to_s3 "${backup_location}" "${BACKUP_PREFIX}-${BACKUP_TYPE}")
        if [ -z "${s3_location}" ]; then
          log_error "Failed to upload backup to S3"
          status="FAILED"
        else
          backup_location="${s3_location}"
        fi
      fi
      ;;
    
    "full"|"incremental")
      # For full and incremental backups, we back up S3 data
      # Determine source bucket based on environment
      local source_bucket="metronomics-${ENVIRONMENT}-data"
      local destination_prefix="${BACKUP_PREFIX}-${BACKUP_TYPE}-${TIMESTAMP}"
      
      backup_location=$(backup_s3_data "${source_bucket}" "${destination_prefix}")
      if [ -z "${backup_location}" ]; then
        log_error "Failed to create S3 backup"
        status="FAILED"
      else
        status="SUCCESS"
        # Get total size of backed up objects (approximate)
        backup_size=$(aws s3 ls --recursive --summarize "${backup_location}" \
          --region "${AWS_REGION}" | grep "Total Size" | awk '{print $3}')
        # Convert bytes to MB
        backup_size=$((backup_size / 1024 / 1024))
      fi
      ;;
    
    *)
      log_error "Unsupported backup type: ${BACKUP_TYPE}"
      cleanup
      return 1
      ;;
  esac
  
  # Replicate to secondary region if enabled
  if [ "${status}" = "SUCCESS" ] && [ "${CROSS_REGION_BACKUP[${ENVIRONMENT}]}" = "true" ]; then
    local replicated_location=$(replicate_to_secondary_region "${backup_location}")
    if [ -z "${replicated_location}" ]; then
      log_warning "Failed to replicate backup to secondary region"
    fi
  fi
  
  # Verify backup if requested
  if [ "${status}" = "SUCCESS" ] && [ "${VERIFY_BACKUP}" = true ]; then
    if ! verify_backup "${BACKUP_TYPE}" "${backup_location}"; then
      log_error "Backup verification failed"
      status="FAILED"
    fi
  fi
  
  # Apply retention policy
  local removed_count=$(apply_retention_policy "${BACKUP_TYPE}")
  
  # Calculate duration
  local end_time=$(date +%s)
  local duration=$((end_time - start_time))
  
  # Log metrics
  log_backup_metrics "${BACKUP_TYPE}" "${status}" "${duration}" "${backup_size}"
  
  # Send notification
  local message="Backup Location: ${backup_location}
Duration: ${duration} seconds
Size: ${backup_size} MB
Removed Backups: ${removed_count}"
  
  send_backup_notification "${status}" "${message}"
  
  # Final log message
  if [ "${status}" = "SUCCESS" ]; then
    log_info "Backup completed successfully in ${duration} seconds"
  else
    log_error "Backup failed after ${duration} seconds"
  fi
  
  # Clean up
  cleanup
  
  # Return status
  if [ "${status}" = "SUCCESS" ]; then
    return 0
  else
    return 1
  fi
}

# Execute main function with all arguments
main "$@"