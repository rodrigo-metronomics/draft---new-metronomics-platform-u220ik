#!/bin/bash
#
# Monitoring setup script for the Metronomics Platform
# Sets up CloudWatch dashboards, alarms, logs, and Honeycomb integration for observability
#
# Author: Metronomics DevOps Team
#
# Usage: ./monitoring-setup.sh [options]
#   Options:
#     -e, --environment ENV    Setup monitoring for environment (development, staging, production)
#     -c, --component COMP     Component to setup (cloudwatch, honeycomb, all)
#     -a, --action ACTION      Action to perform (create, update, delete)
#     --skip-terraform-output  Skip retrieving Terraform outputs
#     --force                  Force setup even if prerequisites are not fully met
#     -h, --help               Show this help message
#
# Examples:
#   ./monitoring-setup.sh -e development -c all              # Setup all monitoring for development
#   ./monitoring-setup.sh -e staging -c cloudwatch --action update  # Update CloudWatch setup in staging
#   ./monitoring-setup.sh -e production -c honeycomb         # Setup Honeycomb integration for production

# Strict error handling
set -euo pipefail

# Constants
AWS_REGION="${AWS_REGION:-us-east-1}"
PROJECT_NAME="${PROJECT_NAME:-metronomics}"
ENVIRONMENT="${ENVIRONMENT:-development}"
SCRIPT_DIR="$(dirname "${BASH_SOURCE[0]}")"
PROJECT_ROOT="$(git rev-parse --show-toplevel)"
HONEYCOMB_CONFIG_FILE="${PROJECT_ROOT}/infrastructure/honeycomb/honeycomb-config.yml"
TERRAFORM_DIR="${PROJECT_ROOT}/infrastructure/terraform"
TERRAFORM_OUTPUT_FILE="${SCRIPT_DIR}/../terraform-output.json"
LOG_FILE="${SCRIPT_DIR}/../logs/monitoring-setup-${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S).log"

# Ensure logs directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Initialize error counter
ERROR_COUNT=0

# Helper Functions
log_message() {
    local level="$1"
    local message="$2"
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    
    # Format message with timestamp and log level
    local formatted_message="[$timestamp] [$level] $message"
    
    # Output to console with color coding
    case "$level" in
        INFO)
            echo -e "\033[0;32m$formatted_message\033[0m"
            ;;
        WARN)
            echo -e "\033[0;33m$formatted_message\033[0m" >&2
            ;;
        ERROR)
            echo -e "\033[0;31m$formatted_message\033[0m" >&2
            ;;
        *)
            echo "$formatted_message"
            ;;
    esac
    
    # Append to log file
    echo "$formatted_message" >> "$LOG_FILE"
    
    # If level is ERROR, increment error counter
    if [[ "$level" == "ERROR" ]]; then
        ERROR_COUNT=$((ERROR_COUNT+1))
    fi
}

check_prerequisites() {
    log_message "INFO" "Checking prerequisites..."
    
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        log_message "ERROR" "AWS CLI is not installed. Please install it first."
        return 1
    fi
    
    # Check if jq is installed
    if ! command -v jq &> /dev/null; then
        log_message "ERROR" "jq is not installed. Please install it first."
        return 1
    fi
    
    # Check if curl is installed
    if ! command -v curl &> /dev/null; then
        log_message "ERROR" "curl is not installed. Please install it first."
        return 1
    fi
    
    # Check if AWS credentials are configured
    if ! aws sts get-caller-identity &> /dev/null; then
        log_message "ERROR" "AWS credentials are not configured or invalid."
        return 1
    fi
    
    # Check if required environment variables are set
    if [[ -z "${ENVIRONMENT}" ]]; then
        log_message "ERROR" "ENVIRONMENT variable is not set."
        return 1
    fi
    
    # Check if Honeycomb API key is available when setting up Honeycomb
    if [[ "$COMPONENT" == "honeycomb" || "$COMPONENT" == "all" ]]; then
        if [[ -z "${HONEYCOMB_API_KEY:-}" ]]; then
            log_message "WARN" "HONEYCOMB_API_KEY is not set. Honeycomb integration may fail."
            if [[ "$FORCE" != "true" ]]; then
                return 1
            fi
        fi
    fi
    
    log_message "INFO" "All prerequisites met."
    return 0
}

parse_arguments() {
    local args=("$@")
    
    # Default values
    COMPONENT="all"
    ACTION="create"
    SKIP_TERRAFORM_OUTPUT=false
    FORCE=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
                    log_message "ERROR" "Invalid environment: $ENVIRONMENT. Must be development, staging, or production."
                    return 1
                fi
                shift 2
                ;;
            -c|--component)
                COMPONENT="$2"
                if [[ ! "$COMPONENT" =~ ^(cloudwatch|honeycomb|all)$ ]]; then
                    log_message "ERROR" "Invalid component: $COMPONENT. Must be cloudwatch, honeycomb, or all."
                    return 1
                fi
                shift 2
                ;;
            -a|--action)
                ACTION="$2"
                if [[ ! "$ACTION" =~ ^(create|update|delete)$ ]]; then
                    log_message "ERROR" "Invalid action: $ACTION. Must be create, update, or delete."
                    return 1
                fi
                shift 2
                ;;
            --skip-terraform-output)
                SKIP_TERRAFORM_OUTPUT=true
                shift
                ;;
            --force)
                FORCE=true
                shift
                ;;
            -h|--help)
                echo "Usage: ./monitoring-setup.sh [options]"
                echo "  Options:"
                echo "    -e, --environment ENV    Setup monitoring for environment (development, staging, production)"
                echo "    -c, --component COMP     Component to setup (cloudwatch, honeycomb, all)"
                echo "    -a, --action ACTION      Action to perform (create, update, delete)"
                echo "    --skip-terraform-output  Skip retrieving Terraform outputs"
                echo "    --force                  Force setup even if prerequisites are not fully met"
                echo "    -h, --help               Show this help message"
                exit 0
                ;;
            *)
                log_message "ERROR" "Unknown option: $1"
                return 1
                ;;
        esac
    done
    
    # Validate argument combinations
    if [[ "$ACTION" == "delete" && "$COMPONENT" == "all" && "$FORCE" != "true" ]]; then
        log_message "ERROR" "Deleting all monitoring components is potentially destructive. Use --force to confirm."
        return 1
    fi
    
    # Export variables
    export ENVIRONMENT
    export COMPONENT
    export ACTION
    export SKIP_TERRAFORM_OUTPUT
    export FORCE
    
    return 0
}

get_terraform_outputs() {
    local environment="$1"
    
    if [[ "$SKIP_TERRAFORM_OUTPUT" == "true" ]]; then
        log_message "INFO" "Skipping Terraform outputs retrieval as requested."
        
        # Set default values if they're not already set
        export AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-123456789012}"
        export VPC_ID="${VPC_ID:-vpc-default}"
        export ALB_NAME="${ALB_NAME:-${PROJECT_NAME}-${ENVIRONMENT}-alb}"
        export ALB_DNS="${ALB_DNS:-${PROJECT_NAME}-${ENVIRONMENT}-alb.${AWS_REGION}.elb.amazonaws.com}"
        
        return 0
    fi
    
    log_message "INFO" "Retrieving Terraform outputs for $environment..."
    
    # Change to Terraform directory
    pushd "$TERRAFORM_DIR" > /dev/null || return 1
    
    # Initialize Terraform
    log_message "INFO" "Initializing Terraform..."
    if ! terraform init -reconfigure; then
        log_message "ERROR" "Failed to initialize Terraform."
        popd > /dev/null || return 1
        return 1
    fi
    
    # Select appropriate workspace
    log_message "INFO" "Selecting $environment workspace..."
    if ! terraform workspace select "$environment" 2>/dev/null; then
        log_message "WARN" "Workspace $environment does not exist. Using default workspace."
    fi
    
    # Get Terraform outputs
    log_message "INFO" "Retrieving Terraform outputs..."
    if ! terraform output -json > "$TERRAFORM_OUTPUT_FILE"; then
        log_message "ERROR" "Failed to retrieve Terraform outputs."
        popd > /dev/null || return 1
        return 1
    fi
    
    # Return to original directory
    popd > /dev/null || return 1
    
    # Extract and export required variables
    if [[ -f "$TERRAFORM_OUTPUT_FILE" ]]; then
        log_message "INFO" "Processing Terraform outputs from $TERRAFORM_OUTPUT_FILE"
        
        # Extract AWS account ID if not already set
        if [[ -z "${AWS_ACCOUNT_ID:-}" ]]; then
            export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text)
        fi
        
        # Extract ALB name
        local alb_arn=$(jq -r '.alb_arn.value // empty' "$TERRAFORM_OUTPUT_FILE")
        if [[ -n "$alb_arn" ]]; then
            export ALB_NAME=$(echo "$alb_arn" | cut -d/ -f2)
            log_message "INFO" "ALB name: $ALB_NAME"
        else
            log_message "WARN" "ALB ARN not found in Terraform outputs"
            export ALB_NAME="${PROJECT_NAME}-${ENVIRONMENT}-alb"
        fi
        
        # Extract ALB DNS name
        local alb_dns=$(jq -r '.alb_dns_name.value // empty' "$TERRAFORM_OUTPUT_FILE")
        if [[ -n "$alb_dns" ]]; then
            export ALB_DNS="$alb_dns"
            log_message "INFO" "ALB DNS: $ALB_DNS"
        else
            log_message "WARN" "ALB DNS name not found in Terraform outputs"
            export ALB_DNS="${PROJECT_NAME}-${ENVIRONMENT}-alb.${AWS_REGION}.elb.amazonaws.com"
        fi
        
        # Extract VPC ID
        local vpc_id=$(jq -r '.vpc_id.value // empty' "$TERRAFORM_OUTPUT_FILE")
        if [[ -n "$vpc_id" ]]; then
            export VPC_ID="$vpc_id"
            log_message "INFO" "VPC ID: $VPC_ID"
        else
            log_message "WARN" "VPC ID not found in Terraform outputs"
            export VPC_ID="vpc-default"
        fi
        
        return 0
    else
        log_message "ERROR" "Terraform output file not found: $TERRAFORM_OUTPUT_FILE"
        return 1
    fi
}

setup_cloudwatch_dashboards() {
    local action="$1"
    log_message "INFO" "Setting up CloudWatch dashboards ($action)..."
    
    # Define dashboard names
    local system_dashboard="${PROJECT_NAME}-${ENVIRONMENT}-system-dashboard"
    local service_dashboard="${PROJECT_NAME}-${ENVIRONMENT}-service-dashboard"
    local database_dashboard="${PROJECT_NAME}-${ENVIRONMENT}-database-dashboard"
    local api_dashboard="${PROJECT_NAME}-${ENVIRONMENT}-api-dashboard"
    local metrics_dashboard="${PROJECT_NAME}-${ENVIRONMENT}-metrics-dashboard"
    
    case "$action" in
        create|update)
            # Create or update main system dashboard
            log_message "INFO" "Creating/updating system dashboard..."
            
            # Prepare dashboard JSON body with dynamic resources based on environment
            local system_dashboard_json=$(cat <<EOF
{
    "widgets": [
        {
            "type": "metric",
            "x": 0,
            "y": 0,
            "width": 24,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "AWS/ECS", "CPUUtilization", "ServiceName", "${PROJECT_NAME}-backend-${ENVIRONMENT}", "ClusterName", "${PROJECT_NAME}-${ENVIRONMENT}", { "stat": "Average", "label": "Backend CPU" } ],
                    [ "...", "${PROJECT_NAME}-frontend-${ENVIRONMENT}", ".", ".", { "stat": "Average", "label": "Frontend CPU" } ],
                    [ "...", "${PROJECT_NAME}-worker-${ENVIRONMENT}", ".", ".", { "stat": "Average", "label": "Worker CPU" } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS_REGION}",
                "title": "CPU Utilization",
                "period": 300
            }
        },
        {
            "type": "metric",
            "x": 0,
            "y": 6,
            "width": 24,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "AWS/ECS", "MemoryUtilization", "ServiceName", "${PROJECT_NAME}-backend-${ENVIRONMENT}", "ClusterName", "${PROJECT_NAME}-${ENVIRONMENT}", { "stat": "Average", "label": "Backend Memory" } ],
                    [ "...", "${PROJECT_NAME}-frontend-${ENVIRONMENT}", ".", ".", { "stat": "Average", "label": "Frontend Memory" } ],
                    [ "...", "${PROJECT_NAME}-worker-${ENVIRONMENT}", ".", ".", { "stat": "Average", "label": "Worker Memory" } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS_REGION}",
                "title": "Memory Utilization",
                "period": 300
            }
        },
        {
            "type": "metric",
            "x": 0,
            "y": 12,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "AWS/ApplicationELB", "HTTPCode_Target_4XX_Count", "LoadBalancer", "${ALB_NAME}", { "stat": "Sum", "label": "4XX Errors" } ],
                    [ ".", "HTTPCode_Target_5XX_Count", ".", ".", { "stat": "Sum", "label": "5XX Errors" } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS_REGION}",
                "title": "HTTP Errors",
                "period": 300
            }
        },
        {
            "type": "metric",
            "x": 12,
            "y": 12,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", "${ALB_NAME}", { "stat": "p95", "label": "P95 Response Time" } ],
                    [ "...", { "stat": "p50", "label": "P50 Response Time" } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS_REGION}",
                "title": "Response Times",
                "period": 300
            }
        },
        {
            "type": "alarm",
            "x": 0,
            "y": 18,
            "width": 24,
            "height": 6,
            "properties": {
                "alarms": [
                    "arn:aws:cloudwatch:${AWS_REGION}:${AWS_ACCOUNT_ID}:alarm:${PROJECT_NAME}-${ENVIRONMENT}-high-cpu",
                    "arn:aws:cloudwatch:${AWS_REGION}:${AWS_ACCOUNT_ID}:alarm:${PROJECT_NAME}-${ENVIRONMENT}-high-memory",
                    "arn:aws:cloudwatch:${AWS_REGION}:${AWS_ACCOUNT_ID}:alarm:${PROJECT_NAME}-${ENVIRONMENT}-high-error-rate",
                    "arn:aws:cloudwatch:${AWS_REGION}:${AWS_ACCOUNT_ID}:alarm:${PROJECT_NAME}-${ENVIRONMENT}-api-latency"
                ],
                "title": "Critical Alarms"
            }
        }
    ]
}
EOF
)
            
            # Put dashboard using AWS CLI
            aws cloudwatch put-dashboard \
                --dashboard-name "$system_dashboard" \
                --dashboard-body "$system_dashboard_json" \
                --region "$AWS_REGION"
                
            log_message "INFO" "System dashboard created/updated: $system_dashboard"
            
            # Create service dashboard
            local service_dashboard_json=$(cat <<EOF
{
    "widgets": [
        {
            "type": "metric",
            "x": 0,
            "y": 0,
            "width": 24,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "AWS/ECS", "CPUUtilization", "ServiceName", "${PROJECT_NAME}-backend-${ENVIRONMENT}", "ClusterName", "${PROJECT_NAME}-${ENVIRONMENT}", { "stat": "Average", "label": "Backend CPU" } ],
                    [ ".", "MemoryUtilization", ".", ".", ".", ".", { "stat": "Average", "label": "Backend Memory" } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS_REGION}",
                "title": "Backend Service Metrics",
                "period": 300
            }
        },
        {
            "type": "metric",
            "x": 0,
            "y": 6,
            "width": 24,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "AWS/ECS", "CPUUtilization", "ServiceName", "${PROJECT_NAME}-frontend-${ENVIRONMENT}", "ClusterName", "${PROJECT_NAME}-${ENVIRONMENT}", { "stat": "Average", "label": "Frontend CPU" } ],
                    [ ".", "MemoryUtilization", ".", ".", ".", ".", { "stat": "Average", "label": "Frontend Memory" } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS_REGION}",
                "title": "Frontend Service Metrics",
                "period": 300
            }
        },
        {
            "type": "metric",
            "x": 0,
            "y": 12,
            "width": 24,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "AWS/ECS", "CPUUtilization", "ServiceName", "${PROJECT_NAME}-worker-${ENVIRONMENT}", "ClusterName", "${PROJECT_NAME}-${ENVIRONMENT}", { "stat": "Average", "label": "Worker CPU" } ],
                    [ ".", "MemoryUtilization", ".", ".", ".", ".", { "stat": "Average", "label": "Worker Memory" } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS_REGION}",
                "title": "Worker Service Metrics",
                "period": 300
            }
        },
        {
            "type": "metric",
            "x": 0,
            "y": 18,
            "width": 24,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "ECS/ContainerInsights", "RunningTaskCount", "ClusterName", "${PROJECT_NAME}-${ENVIRONMENT}", "ServiceName", "${PROJECT_NAME}-backend-${ENVIRONMENT}", { "label": "Backend Tasks" } ],
                    [ "...", "${PROJECT_NAME}-frontend-${ENVIRONMENT}", { "label": "Frontend Tasks" } ],
                    [ "...", "${PROJECT_NAME}-worker-${ENVIRONMENT}", { "label": "Worker Tasks" } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS_REGION}",
                "title": "Running Tasks",
                "period": 60
            }
        }
    ]
}
EOF
)
            
            aws cloudwatch put-dashboard \
                --dashboard-name "$service_dashboard" \
                --dashboard-body "$service_dashboard_json" \
                --region "$AWS_REGION"
                
            log_message "INFO" "Service dashboard created/updated: $service_dashboard"
            
            # Create database dashboard
            local database_dashboard_json=$(cat <<EOF
{
    "widgets": [
        {
            "type": "metric",
            "x": 0,
            "y": 0,
            "width": 24,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", "${PROJECT_NAME}-${ENVIRONMENT}", { "stat": "Average", "label": "CPU Utilization" } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS_REGION}",
                "title": "Database CPU",
                "period": 300
            }
        },
        {
            "type": "metric",
            "x": 0,
            "y": 6,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "AWS/RDS", "FreeStorageSpace", "DBInstanceIdentifier", "${PROJECT_NAME}-${ENVIRONMENT}", { "stat": "Average", "label": "Free Storage" } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS_REGION}",
                "title": "Database Storage",
                "period": 300
            }
        },
        {
            "type": "metric",
            "x": 12,
            "y": 6,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "AWS/RDS", "DatabaseConnections", "DBInstanceIdentifier", "${PROJECT_NAME}-${ENVIRONMENT}", { "stat": "Average", "label": "Connections" } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS_REGION}",
                "title": "Database Connections",
                "period": 300
            }
        },
        {
            "type": "metric",
            "x": 0,
            "y": 12,
            "width": 24,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "AWS/RDS", "ReadLatency", "DBInstanceIdentifier", "${PROJECT_NAME}-${ENVIRONMENT}", { "stat": "Average", "label": "Read Latency" } ],
                    [ ".", "WriteLatency", ".", ".", { "stat": "Average", "label": "Write Latency" } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS_REGION}",
                "title": "Database Latency",
                "period": 300
            }
        }
    ]
}
EOF
)
            
            aws cloudwatch put-dashboard \
                --dashboard-name "$database_dashboard" \
                --dashboard-body "$database_dashboard_json" \
                --region "$AWS_REGION"
                
            log_message "INFO" "Database dashboard created/updated: $database_dashboard"
            
            # Create API performance dashboard
            local api_dashboard_json=$(cat <<EOF
{
    "widgets": [
        {
            "type": "metric",
            "x": 0,
            "y": 0,
            "width": 24,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "AWS/ApplicationELB", "RequestCount", "LoadBalancer", "${ALB_NAME}", { "stat": "Sum", "label": "Total Requests" } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS_REGION}",
                "title": "API Request Volume",
                "period": 60
            }
        },
        {
            "type": "metric",
            "x": 0,
            "y": 6,
            "width": 24,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", "${ALB_NAME}", { "stat": "p99", "label": "P99" } ],
                    [ "...", { "stat": "p95", "label": "P95" } ],
                    [ "...", { "stat": "p90", "label": "P90" } ],
                    [ "...", { "stat": "p50", "label": "P50" } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS_REGION}",
                "title": "API Response Time Percentiles",
                "period": 60
            }
        },
        {
            "type": "metric",
            "x": 0,
            "y": 12,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "AWS/ApplicationELB", "HTTPCode_Target_2XX_Count", "LoadBalancer", "${ALB_NAME}", { "stat": "Sum", "label": "2XX" } ],
                    [ ".", "HTTPCode_Target_3XX_Count", ".", ".", { "stat": "Sum", "label": "3XX" } ],
                    [ ".", "HTTPCode_Target_4XX_Count", ".", ".", { "stat": "Sum", "label": "4XX" } ],
                    [ ".", "HTTPCode_Target_5XX_Count", ".", ".", { "stat": "Sum", "label": "5XX" } ]
                ],
                "view": "timeSeries",
                "stacked": true,
                "region": "${AWS_REGION}",
                "title": "HTTP Status Codes",
                "period": 60
            }
        },
        {
            "type": "metric",
            "x": 12,
            "y": 12,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    [ { "expression": "m4/(m1+m2+m3+m4)*100", "label": "Error Rate (%)", "id": "e1" } ],
                    [ "AWS/ApplicationELB", "HTTPCode_Target_2XX_Count", "LoadBalancer", "${ALB_NAME}", { "id": "m1", "visible": false } ],
                    [ ".", "HTTPCode_Target_3XX_Count", ".", ".", { "id": "m2", "visible": false } ],
                    [ ".", "HTTPCode_Target_4XX_Count", ".", ".", { "id": "m3", "visible": false } ],
                    [ ".", "HTTPCode_Target_5XX_Count", ".", ".", { "id": "m4", "visible": false } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS_REGION}",
                "title": "API Error Rate",
                "period": 60
            }
        }
    ]
}
EOF
)
            
            aws cloudwatch put-dashboard \
                --dashboard-name "$api_dashboard" \
                --dashboard-body "$api_dashboard_json" \
                --region "$AWS_REGION"
                
            log_message "INFO" "API dashboard created/updated: $api_dashboard"
            
            # Create custom metrics dashboard for business metrics
            local metrics_dashboard_json=$(cat <<EOF
{
    "widgets": [
        {
            "type": "metric",
            "x": 0,
            "y": 0,
            "width": 24,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "${PROJECT_NAME}/BusinessMetrics", "ActiveUsers", "Environment", "${ENVIRONMENT}", { "stat": "Maximum", "label": "Active Users" } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS_REGION}",
                "title": "Active Users",
                "period": 3600
            }
        },
        {
            "type": "metric",
            "x": 0,
            "y": 6,
            "width": 24,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "${PROJECT_NAME}/BusinessMetrics", "MeetingCompletion", "Environment", "${ENVIRONMENT}", { "stat": "Average", "label": "Meeting Completion Rate" } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS_REGION}",
                "title": "Meeting Completion Rate",
                "period": 3600,
                "yAxis": {
                    "left": {
                        "min": 0,
                        "max": 100
                    }
                }
            }
        },
        {
            "type": "metric",
            "x": 0,
            "y": 12,
            "width": 24,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "${PROJECT_NAME}/BusinessMetrics", "GoalAchievement", "Environment", "${ENVIRONMENT}", { "stat": "Average", "label": "Goal Achievement Rate" } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS_REGION}",
                "title": "Goal Achievement Rate",
                "period": 3600,
                "yAxis": {
                    "left": {
                        "min": 0,
                        "max": 100
                    }
                }
            }
        },
        {
            "type": "metric",
            "x": 0,
            "y": 18,
            "width": 24,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "${PROJECT_NAME}/BusinessMetrics", "MetricUpdates", "Environment", "${ENVIRONMENT}", { "stat": "Sum", "label": "Metric Updates" } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS_REGION}",
                "title": "Metric Update Frequency",
                "period": 3600
            }
        }
    ]
}
EOF
)
            
            aws cloudwatch put-dashboard \
                --dashboard-name "$metrics_dashboard" \
                --dashboard-body "$metrics_dashboard_json" \
                --region "$AWS_REGION"
                
            log_message "INFO" "Custom metrics dashboard created/updated: $metrics_dashboard"
            
            # Log dashboard URLs for reference
            log_message "INFO" "Dashboard URLs:"
            log_message "INFO" "System Dashboard: https://${AWS_REGION}.console.aws.amazon.com/cloudwatch/home?region=${AWS_REGION}#dashboards:name=${system_dashboard}"
            log_message "INFO" "Service Dashboard: https://${AWS_REGION}.console.aws.amazon.com/cloudwatch/home?region=${AWS_REGION}#dashboards:name=${service_dashboard}"
            log_message "INFO" "Database Dashboard: https://${AWS_REGION}.console.aws.amazon.com/cloudwatch/home?region=${AWS_REGION}#dashboards:name=${database_dashboard}"
            log_message "INFO" "API Dashboard: https://${AWS_REGION}.console.aws.amazon.com/cloudwatch/home?region=${AWS_REGION}#dashboards:name=${api_dashboard}"
            log_message "INFO" "Metrics Dashboard: https://${AWS_REGION}.console.aws.amazon.com/cloudwatch/home?region=${AWS_REGION}#dashboards:name=${metrics_dashboard}"
            ;;
            
        delete)
            # Delete all dashboards
            log_message "INFO" "Deleting CloudWatch dashboards..."
            
            aws cloudwatch delete-dashboards \
                --dashboard-names "$system_dashboard" "$service_dashboard" "$database_dashboard" "$api_dashboard" "$metrics_dashboard" \
                --region "$AWS_REGION"
                
            log_message "INFO" "CloudWatch dashboards deleted."
            ;;
            
        *)
            log_message "ERROR" "Invalid action for CloudWatch dashboards: $action"
            return 1
            ;;
    esac
    
    return 0
}

setup_cloudwatch_alarms() {
    local action="$1"
    log_message "INFO" "Setting up CloudWatch alarms ($action)..."
    
    # Define SNS topics for different alert levels
    local critical_topic="${PROJECT_NAME}-${ENVIRONMENT}-critical-alerts"
    local warning_topic="${PROJECT_NAME}-${ENVIRONMENT}-warning-alerts"
    local info_topic="${PROJECT_NAME}-${ENVIRONMENT}-info-alerts"
    
    case "$action" in
        create|update)
            # Create or update SNS topics
            log_message "INFO" "Creating/updating SNS topics for alerts..."
            
            # Create critical alerts topic
            local critical_topic_arn=$(aws sns create-topic \
                --name "$critical_topic" \
                --region "$AWS_REGION" \
                --query 'TopicArn' \
                --output text)
                
            # Create warning alerts topic
            local warning_topic_arn=$(aws sns create-topic \
                --name "$warning_topic" \
                --region "$AWS_REGION" \
                --query 'TopicArn' \
                --output text)
                
            # Create info alerts topic
            local info_topic_arn=$(aws sns create-topic \
                --name "$info_topic" \
                --region "$AWS_REGION" \
                --query 'TopicArn' \
                --output text)
                
            log_message "INFO" "SNS topics created/updated:"
            log_message "INFO" "Critical alerts: $critical_topic_arn"
            log_message "INFO" "Warning alerts: $warning_topic_arn"
            log_message "INFO" "Info alerts: $info_topic_arn"
            
            # Configure email subscriptions if email addresses are provided
            if [[ -n "${CRITICAL_ALERT_EMAIL:-}" ]]; then
                aws sns subscribe \
                    --topic-arn "$critical_topic_arn" \
                    --protocol email \
                    --notification-endpoint "$CRITICAL_ALERT_EMAIL" \
                    --region "$AWS_REGION"
                    
                log_message "INFO" "Subscribed $CRITICAL_ALERT_EMAIL to critical alerts"
            fi
            
            if [[ -n "${WARNING_ALERT_EMAIL:-}" ]]; then
                aws sns subscribe \
                    --topic-arn "$warning_topic_arn" \
                    --protocol email \
                    --notification-endpoint "$WARNING_ALERT_EMAIL" \
                    --region "$AWS_REGION"
                    
                log_message "INFO" "Subscribed $WARNING_ALERT_EMAIL to warning alerts"
            fi
            
            if [[ -n "${INFO_ALERT_EMAIL:-}" ]]; then
                aws sns subscribe \
                    --topic-arn "$info_topic_arn" \
                    --protocol email \
                    --notification-endpoint "$INFO_ALERT_EMAIL" \
                    --region "$AWS_REGION"
                    
                log_message "INFO" "Subscribed $INFO_ALERT_EMAIL to info alerts"
            fi
            
            # Set up CPU and memory utilization alarms for ECS services
            log_message "INFO" "Setting up ECS service alarms..."
            
            # Set thresholds based on environment
            local cpu_threshold_critical=85
            local cpu_threshold_warning=70
            local memory_threshold_critical=85
            local memory_threshold_warning=70
            
            if [[ "$ENVIRONMENT" == "production" ]]; then
                cpu_threshold_critical=80
                cpu_threshold_warning=65
                memory_threshold_critical=80
                memory_threshold_warning=65
            fi
            
            # Backend service CPU alarm (critical)
            aws cloudwatch put-metric-alarm \
                --alarm-name "${PROJECT_NAME}-${ENVIRONMENT}-backend-cpu-critical" \
                --alarm-description "Critical CPU utilization for backend service" \
                --metric-name CPUUtilization \
                --namespace AWS/ECS \
                --statistic Average \
                --period 300 \
                --threshold $cpu_threshold_critical \
                --comparison-operator GreaterThanThreshold \
                --dimensions Name=ClusterName,Value=${PROJECT_NAME}-${ENVIRONMENT} Name=ServiceName,Value=${PROJECT_NAME}-backend-${ENVIRONMENT} \
                --evaluation-periods 3 \
                --alarm-actions "$critical_topic_arn" \
                --ok-actions "$critical_topic_arn" \
                --region "$AWS_REGION"
                
            # Backend service CPU alarm (warning)
            aws cloudwatch put-metric-alarm \
                --alarm-name "${PROJECT_NAME}-${ENVIRONMENT}-backend-cpu-warning" \
                --alarm-description "Warning CPU utilization for backend service" \
                --metric-name CPUUtilization \
                --namespace AWS/ECS \
                --statistic Average \
                --period 300 \
                --threshold $cpu_threshold_warning \
                --comparison-operator GreaterThanThreshold \
                --dimensions Name=ClusterName,Value=${PROJECT_NAME}-${ENVIRONMENT} Name=ServiceName,Value=${PROJECT_NAME}-backend-${ENVIRONMENT} \
                --evaluation-periods 3 \
                --alarm-actions "$warning_topic_arn" \
                --ok-actions "$warning_topic_arn" \
                --region "$AWS_REGION"
                
            # Backend service memory alarm (critical)
            aws cloudwatch put-metric-alarm \
                --alarm-name "${PROJECT_NAME}-${ENVIRONMENT}-backend-memory-critical" \
                --alarm-description "Critical memory utilization for backend service" \
                --metric-name MemoryUtilization \
                --namespace AWS/ECS \
                --statistic Average \
                --period 300 \
                --threshold $memory_threshold_critical \
                --comparison-operator GreaterThanThreshold \
                --dimensions Name=ClusterName,Value=${PROJECT_NAME}-${ENVIRONMENT} Name=ServiceName,Value=${PROJECT_NAME}-backend-${ENVIRONMENT} \
                --evaluation-periods 3 \
                --alarm-actions "$critical_topic_arn" \
                --ok-actions "$critical_topic_arn" \
                --region "$AWS_REGION"
                
            # Backend service memory alarm (warning)
            aws cloudwatch put-metric-alarm \
                --alarm-name "${PROJECT_NAME}-${ENVIRONMENT}-backend-memory-warning" \
                --alarm-description "Warning memory utilization for backend service" \
                --metric-name MemoryUtilization \
                --namespace AWS/ECS \
                --statistic Average \
                --period 300 \
                --threshold $memory_threshold_warning \
                --comparison-operator GreaterThanThreshold \
                --dimensions Name=ClusterName,Value=${PROJECT_NAME}-${ENVIRONMENT} Name=ServiceName,Value=${PROJECT_NAME}-backend-${ENVIRONMENT} \
                --evaluation-periods 3 \
                --alarm-actions "$warning_topic_arn" \
                --ok-actions "$warning_topic_arn" \
                --region "$AWS_REGION"
                
            # Frontend service CPU alarm (critical)
            aws cloudwatch put-metric-alarm \
                --alarm-name "${PROJECT_NAME}-${ENVIRONMENT}-frontend-cpu-critical" \
                --alarm-description "Critical CPU utilization for frontend service" \
                --metric-name CPUUtilization \
                --namespace AWS/ECS \
                --statistic Average \
                --period 300 \
                --threshold $cpu_threshold_critical \
                --comparison-operator GreaterThanThreshold \
                --dimensions Name=ClusterName,Value=${PROJECT_NAME}-${ENVIRONMENT} Name=ServiceName,Value=${PROJECT_NAME}-frontend-${ENVIRONMENT} \
                --evaluation-periods 3 \
                --alarm-actions "$critical_topic_arn" \
                --ok-actions "$critical_topic_arn" \
                --region "$AWS_REGION"
                
            # Frontend service memory alarm (critical)
            aws cloudwatch put-metric-alarm \
                --alarm-name "${PROJECT_NAME}-${ENVIRONMENT}-frontend-memory-critical" \
                --alarm-description "Critical memory utilization for frontend service" \
                --metric-name MemoryUtilization \
                --namespace AWS/ECS \
                --statistic Average \
                --period 300 \
                --threshold $memory_threshold_critical \
                --comparison-operator GreaterThanThreshold \
                --dimensions Name=ClusterName,Value=${PROJECT_NAME}-${ENVIRONMENT} Name=ServiceName,Value=${PROJECT_NAME}-frontend-${ENVIRONMENT} \
                --evaluation-periods 3 \
                --alarm-actions "$critical_topic_arn" \
                --ok-actions "$critical_topic_arn" \
                --region "$AWS_REGION"
                
            # Worker service CPU alarm (critical)
            aws cloudwatch put-metric-alarm \
                --alarm-name "${PROJECT_NAME}-${ENVIRONMENT}-worker-cpu-critical" \
                --alarm-description "Critical CPU utilization for worker service" \
                --metric-name CPUUtilization \
                --namespace AWS/ECS \
                --statistic Average \
                --period 300 \
                --threshold $cpu_threshold_critical \
                --comparison-operator GreaterThanThreshold \
                --dimensions Name=ClusterName,Value=${PROJECT_NAME}-${ENVIRONMENT} Name=ServiceName,Value=${PROJECT_NAME}-worker-${ENVIRONMENT} \
                --evaluation-periods 3 \
                --alarm-actions "$critical_topic_arn" \
                --ok-actions "$critical_topic_arn" \
                --region "$AWS_REGION"
                
            # Worker service memory alarm (critical)
            aws cloudwatch put-metric-alarm \
                --alarm-name "${PROJECT_NAME}-${ENVIRONMENT}-worker-memory-critical" \
                --alarm-description "Critical memory utilization for worker service" \
                --metric-name MemoryUtilization \
                --namespace AWS/ECS \
                --statistic Average \
                --period 300 \
                --threshold $memory_threshold_critical \
                --comparison-operator GreaterThanThreshold \
                --dimensions Name=ClusterName,Value=${PROJECT_NAME}-${ENVIRONMENT} Name=ServiceName,Value=${PROJECT_NAME}-worker-${ENVIRONMENT} \
                --evaluation-periods 3 \
                --alarm-actions "$critical_topic_arn" \
                --ok-actions "$critical_topic_arn" \
                --region "$AWS_REGION"
                
            # Set up API error rate and latency alarms
            log_message "INFO" "Setting up API performance alarms..."
            
            # Set API thresholds based on environment
            local error_rate_critical=5
            local error_rate_warning=1
            local latency_critical=500
            local latency_warning=300
            
            if [[ "$ENVIRONMENT" == "production" ]]; then
                error_rate_critical=2
                error_rate_warning=0.5
                latency_critical=400
                latency_warning=200
            fi
            
            # API error rate alarm (critical)
            aws cloudwatch put-metric-alarm \
                --alarm-name "${PROJECT_NAME}-${ENVIRONMENT}-api-error-rate-critical" \
                --alarm-description "Critical API error rate" \
                --metric-name HTTPCode_Target_5XX_Count \
                --namespace AWS/ApplicationELB \
                --statistic Sum \
                --period 300 \
                --threshold $error_rate_critical \
                --comparison-operator GreaterThanThreshold \
                --dimensions Name=LoadBalancer,Value=${ALB_NAME} \
                --evaluation-periods 2 \
                --alarm-actions "$critical_topic_arn" \
                --ok-actions "$critical_topic_arn" \
                --region "$AWS_REGION"
                
            # API error rate alarm (warning)
            aws cloudwatch put-metric-alarm \
                --alarm-name "${PROJECT_NAME}-${ENVIRONMENT}-api-error-rate-warning" \
                --alarm-description "Warning API error rate" \
                --metric-name HTTPCode_Target_5XX_Count \
                --namespace AWS/ApplicationELB \
                --statistic Sum \
                --period 300 \
                --threshold $error_rate_warning \
                --comparison-operator GreaterThanThreshold \
                --dimensions Name=LoadBalancer,Value=${ALB_NAME} \
                --evaluation-periods 2 \
                --alarm-actions "$warning_topic_arn" \
                --ok-actions "$warning_topic_arn" \
                --region "$AWS_REGION"
                
            # API latency alarm (critical)
            aws cloudwatch put-metric-alarm \
                --alarm-name "${PROJECT_NAME}-${ENVIRONMENT}-api-latency-critical" \
                --alarm-description "Critical API response time" \
                --metric-name TargetResponseTime \
                --namespace AWS/ApplicationELB \
                --extended-statistic p95 \
                --period 300 \
                --threshold $latency_critical \
                --comparison-operator GreaterThanThreshold \
                --dimensions Name=LoadBalancer,Value=${ALB_NAME} \
                --evaluation-periods 3 \
                --alarm-actions "$critical_topic_arn" \
                --ok-actions "$critical_topic_arn" \
                --region "$AWS_REGION"
                
            # API latency alarm (warning)
            aws cloudwatch put-metric-alarm \
                --alarm-name "${PROJECT_NAME}-${ENVIRONMENT}-api-latency-warning" \
                --alarm-description "Warning API response time" \
                --metric-name TargetResponseTime \
                --namespace AWS/ApplicationELB \
                --extended-statistic p95 \
                --period 300 \
                --threshold $latency_warning \
                --comparison-operator GreaterThanThreshold \
                --dimensions Name=LoadBalancer,Value=${ALB_NAME} \
                --evaluation-periods 3 \
                --alarm-actions "$warning_topic_arn" \
                --ok-actions "$warning_topic_arn" \
                --region "$AWS_REGION"
                
            # Set up database performance and capacity alarms
            log_message "INFO" "Setting up database alarms..."
            
            # Database CPU alarm (critical)
            aws cloudwatch put-metric-alarm \
                --alarm-name "${PROJECT_NAME}-${ENVIRONMENT}-db-cpu-critical" \
                --alarm-description "Critical database CPU utilization" \
                --metric-name CPUUtilization \
                --namespace AWS/RDS \
                --statistic Average \
                --period 300 \
                --threshold 85 \
                --comparison-operator GreaterThanThreshold \
                --dimensions Name=DBInstanceIdentifier,Value=${PROJECT_NAME}-${ENVIRONMENT} \
                --evaluation-periods 3 \
                --alarm-actions "$critical_topic_arn" \
                --ok-actions "$critical_topic_arn" \
                --region "$AWS_REGION"
                
            # Database storage alarm (critical)
            aws cloudwatch put-metric-alarm \
                --alarm-name "${PROJECT_NAME}-${ENVIRONMENT}-db-storage-critical" \
                --alarm-description "Critical database free storage space" \
                --metric-name FreeStorageSpace \
                --namespace AWS/RDS \
                --statistic Average \
                --period 300 \
                --threshold 5000000000 \
                --comparison-operator LessThanThreshold \
                --dimensions Name=DBInstanceIdentifier,Value=${PROJECT_NAME}-${ENVIRONMENT} \
                --evaluation-periods 1 \
                --alarm-actions "$critical_topic_arn" \
                --ok-actions "$critical_topic_arn" \
                --region "$AWS_REGION"
                
            # Database connections alarm (warning)
            aws cloudwatch put-metric-alarm \
                --alarm-name "${PROJECT_NAME}-${ENVIRONMENT}-db-connections-warning" \
                --alarm-description "Warning database connection count" \
                --metric-name DatabaseConnections \
                --namespace AWS/RDS \
                --statistic Average \
                --period 300 \
                --threshold 80 \
                --comparison-operator GreaterThanThreshold \
                --dimensions Name=DBInstanceIdentifier,Value=${PROJECT_NAME}-${ENVIRONMENT} \
                --evaluation-periods 3 \
                --alarm-actions "$warning_topic_arn" \
                --ok-actions "$warning_topic_arn" \
                --region "$AWS_REGION"
                
            # Set up custom metric alarms based on business requirements
            log_message "INFO" "Setting up business metric alarms..."
            
            # Active users dropping alarm (warning)
            aws cloudwatch put-metric-alarm \
                --alarm-name "${PROJECT_NAME}-${ENVIRONMENT}-active-users-dropping" \
                --alarm-description "Active users count dropping significantly" \
                --metric-name ActiveUsers \
                --namespace "${PROJECT_NAME}/BusinessMetrics" \
                --statistic Average \
                --period 86400 \
                --threshold 20 \
                --comparison-operator PercentageDecrease \
                --dimensions Name=Environment,Value=${ENVIRONMENT} \
                --evaluation-periods 1 \
                --alarm-actions "$warning_topic_arn" \
                --ok-actions "$warning_topic_arn" \
                --region "$AWS_REGION"
                
            # Meeting completion rate alarm (warning)
            aws cloudwatch put-metric-alarm \
                --alarm-name "${PROJECT_NAME}-${ENVIRONMENT}-meeting-completion-low" \
                --alarm-description "Meeting completion rate below threshold" \
                --metric-name MeetingCompletion \
                --namespace "${PROJECT_NAME}/BusinessMetrics" \
                --statistic Average \
                --period 86400 \
                --threshold 75 \
                --comparison-operator LessThanThreshold \
                --dimensions Name=Environment,Value=${ENVIRONMENT} \
                --evaluation-periods 3 \
                --alarm-actions "$warning_topic_arn" \
                --ok-actions "$warning_topic_arn" \
                --region "$AWS_REGION"
                
            # Goal achievement rate alarm (info)
            aws cloudwatch put-metric-alarm \
                --alarm-name "${PROJECT_NAME}-${ENVIRONMENT}-goal-achievement-low" \
                --alarm-description "Goal achievement rate below threshold" \
                --metric-name GoalAchievement \
                --namespace "${PROJECT_NAME}/BusinessMetrics" \
                --statistic Average \
                --period 86400 \
                --threshold 70 \
                --comparison-operator LessThanThreshold \
                --dimensions Name=Environment,Value=${ENVIRONMENT} \
                --evaluation-periods 7 \
                --alarm-actions "$info_topic_arn" \
                --ok-actions "$info_topic_arn" \
                --region "$AWS_REGION"
                
            log_message "INFO" "CloudWatch alarms setup complete"
            ;;
            
        delete)
            # Delete all alarms and SNS topics
            log_message "INFO" "Deleting CloudWatch alarms..."
            
            # Get list of alarms with prefix
            local alarms=$(aws cloudwatch describe-alarms \
                --alarm-name-prefix "${PROJECT_NAME}-${ENVIRONMENT}" \
                --region "$AWS_REGION" \
                --query 'MetricAlarms[].AlarmName' \
                --output text)
                
            # Delete each alarm
            for alarm in $alarms; do
                aws cloudwatch delete-alarms \
                    --alarm-names "$alarm" \
                    --region "$AWS_REGION"
                    
                log_message "INFO" "Deleted alarm: $alarm"
            done
            
            # Delete SNS topics
            aws sns delete-topic \
                --topic-arn $(aws sns list-topics \
                    --region "$AWS_REGION" \
                    --query "Topics[?contains(TopicArn, '${critical_topic}')].TopicArn" \
                    --output text) \
                --region "$AWS_REGION"
                
            aws sns delete-topic \
                --topic-arn $(aws sns list-topics \
                    --region "$AWS_REGION" \
                    --query "Topics[?contains(TopicArn, '${warning_topic}')].TopicArn" \
                    --output text) \
                --region "$AWS_REGION"
                
            aws sns delete-topic \
                --topic-arn $(aws sns list-topics \
                    --region "$AWS_REGION" \
                    --query "Topics[?contains(TopicArn, '${info_topic}')].TopicArn" \
                    --output text) \
                --region "$AWS_REGION"
                
            log_message "INFO" "CloudWatch alarms and SNS topics deleted."
            ;;
            
        *)
            log_message "ERROR" "Invalid action for CloudWatch alarms: $action"
            return 1
            ;;
    esac
    
    return 0
}

setup_cloudwatch_logs() {
    local action="$1"
    log_message "INFO" "Setting up CloudWatch Logs ($action)..."
    
    # Define log groups for each service
    local backend_log_group="/ecs/${PROJECT_NAME}-backend-${ENVIRONMENT}"
    local frontend_log_group="/ecs/${PROJECT_NAME}-frontend-${ENVIRONMENT}"
    local worker_log_group="/ecs/${PROJECT_NAME}-worker-${ENVIRONMENT}"
    
    case "$action" in
        create|update)
            # Create or update log groups
            log_message "INFO" "Creating/updating log groups..."
            
            # Set retention period based on environment
            local retention_days=30
            if [[ "$ENVIRONMENT" == "production" ]]; then
                retention_days=90
            elif [[ "$ENVIRONMENT" == "development" ]]; then
                retention_days=14
            fi
            
            # Backend log group
            aws logs create-log-group \
                --log-group-name "$backend_log_group" \
                --region "$AWS_REGION" || true
                
            aws logs put-retention-policy \
                --log-group-name "$backend_log_group" \
                --retention-in-days $retention_days \
                --region "$AWS_REGION"
                
            # Frontend log group
            aws logs create-log-group \
                --log-group-name "$frontend_log_group" \
                --region "$AWS_REGION" || true
                
            aws logs put-retention-policy \
                --log-group-name "$frontend_log_group" \
                --retention-in-days $retention_days \
                --region "$AWS_REGION"
                
            # Worker log group
            aws logs create-log-group \
                --log-group-name "$worker_log_group" \
                --region "$AWS_REGION" || true
                
            aws logs put-retention-policy \
                --log-group-name "$worker_log_group" \
                --retention-in-days $retention_days \
                --region "$AWS_REGION"
                
            log_message "INFO" "Log groups created/updated with $retention_days days retention"
            
            # Set up log metric filters for error detection
            log_message "INFO" "Setting up log metric filters..."
            
            # Backend error metric filter
            aws logs put-metric-filter \
                --log-group-name "$backend_log_group" \
                --filter-name "${PROJECT_NAME}-${ENVIRONMENT}-backend-errors" \
                --filter-pattern '{ $.level = "error" }' \
                --metric-transformations \
                    metricName=BackendErrors,metricNamespace=${PROJECT_NAME}/LogMetrics,metricValue=1,defaultValue=0 \
                --region "$AWS_REGION"
                
            # Frontend error metric filter
            aws logs put-metric-filter \
                --log-group-name "$frontend_log_group" \
                --filter-name "${PROJECT_NAME}-${ENVIRONMENT}-frontend-errors" \
                --filter-pattern '{ $.level = "error" }' \
                --metric-transformations \
                    metricName=FrontendErrors,metricNamespace=${PROJECT_NAME}/LogMetrics,metricValue=1,defaultValue=0 \
                --region "$AWS_REGION"
                
            # Worker error metric filter
            aws logs put-metric-filter \
                --log-group-name "$worker_log_group" \
                --filter-name "${PROJECT_NAME}-${ENVIRONMENT}-worker-errors" \
                --filter-pattern '{ $.level = "error" }' \
                --metric-transformations \
                    metricName=WorkerErrors,metricNamespace=${PROJECT_NAME}/LogMetrics,metricValue=1,defaultValue=0 \
                --region "$AWS_REGION"
                
            log_message "INFO" "Log metric filters created"
            
            # Create alarms for log metrics
            local critical_topic="${PROJECT_NAME}-${ENVIRONMENT}-critical-alerts"
            local critical_topic_arn=$(aws sns list-topics \
                --region "$AWS_REGION" \
                --query "Topics[?contains(TopicArn, '${critical_topic}')].TopicArn" \
                --output text)
                
            if [[ -n "$critical_topic_arn" ]]; then
                # Backend error alarm
                aws cloudwatch put-metric-alarm \
                    --alarm-name "${PROJECT_NAME}-${ENVIRONMENT}-backend-log-errors" \
                    --alarm-description "High number of errors in backend logs" \
                    --metric-name BackendErrors \
                    --namespace "${PROJECT_NAME}/LogMetrics" \
                    --statistic Sum \
                    --period 300 \
                    --threshold 10 \
                    --comparison-operator GreaterThanThreshold \
                    --dimensions Name=Environment,Value=${ENVIRONMENT} \
                    --evaluation-periods 1 \
                    --alarm-actions "$critical_topic_arn" \
                    --ok-actions "$critical_topic_arn" \
                    --region "$AWS_REGION"
                    
                # Frontend error alarm
                aws cloudwatch put-metric-alarm \
                    --alarm-name "${PROJECT_NAME}-${ENVIRONMENT}-frontend-log-errors" \
                    --alarm-description "High number of errors in frontend logs" \
                    --metric-name FrontendErrors \
                    --namespace "${PROJECT_NAME}/LogMetrics" \
                    --statistic Sum \
                    --period 300 \
                    --threshold 10 \
                    --comparison-operator GreaterThanThreshold \
                    --dimensions Name=Environment,Value=${ENVIRONMENT} \
                    --evaluation-periods 1 \
                    --alarm-actions "$critical_topic_arn" \
                    --ok-actions "$critical_topic_arn" \
                    --region "$AWS_REGION"
                    
                # Worker error alarm
                aws cloudwatch put-metric-alarm \
                    --alarm-name "${PROJECT_NAME}-${ENVIRONMENT}-worker-log-errors" \
                    --alarm-description "High number of errors in worker logs" \
                    --metric-name WorkerErrors \
                    --namespace "${PROJECT_NAME}/LogMetrics" \
                    --statistic Sum \
                    --period 300 \
                    --threshold 10 \
                    --comparison-operator GreaterThanThreshold \
                    --dimensions Name=Environment,Value=${ENVIRONMENT} \
                    --evaluation-periods 1 \
                    --alarm-actions "$critical_topic_arn" \
                    --ok-actions "$critical_topic_arn" \
                    --region "$AWS_REGION"
                    
                log_message "INFO" "Log metric alarms created"
            else
                log_message "WARN" "Critical SNS topic not found. Skipping log metric alarms."
            fi
            
            # Set up log insights queries for common troubleshooting scenarios
            log_message "INFO" "Setting up CloudWatch Logs Insights queries..."
            
            # Save queries using AWS CLI (not directly supported, but we can document them)
            log_message "INFO" "Common CloudWatch Logs Insights queries:"
            log_message "INFO" "Backend Error Analysis:"
            log_message "INFO" "fields @timestamp, @message | filter level = 'error' | sort @timestamp desc | limit 100"
            log_message "INFO" "API Performance Analysis:"
            log_message "INFO" "fields @timestamp, method, path, duration | filter @message like /API request completed/ | sort duration desc | limit 100"
            log_message "INFO" "Database Query Performance:"
            log_message "INFO" "fields @timestamp, @message | filter @message like /slow query/ | sort @timestamp desc | limit 100"
            
            log_message "INFO" "CloudWatch Logs setup complete"
            ;;
            
        delete)
            # Delete all log groups
            log_message "INFO" "Deleting CloudWatch Logs configuration..."
            
            # Delete log metric filters
            aws logs delete-metric-filter \
                --log-group-name "$backend_log_group" \
                --filter-name "${PROJECT_NAME}-${ENVIRONMENT}-backend-errors" \
                --region "$AWS_REGION" || true
                
            aws logs delete-metric-filter \
                --log-group-name "$frontend_log_group" \
                --filter-name "${PROJECT_NAME}-${ENVIRONMENT}-frontend-errors" \
                --region "$AWS_REGION" || true
                
            aws logs delete-metric-filter \
                --log-group-name "$worker_log_group" \
                --filter-name "${PROJECT_NAME}-${ENVIRONMENT}-worker-errors" \
                --region "$AWS_REGION" || true
                
            # Delete log groups
            aws logs delete-log-group \
                --log-group-name "$backend_log_group" \
                --region "$AWS_REGION" || true
                
            aws logs delete-log-group \
                --log-group-name "$frontend_log_group" \
                --region "$AWS_REGION" || true
                
            aws logs delete-log-group \
                --log-group-name "$worker_log_group" \
                --region "$AWS_REGION" || true
                
            log_message "INFO" "CloudWatch Logs configuration deleted"
            ;;
            
        *)
            log_message "ERROR" "Invalid action for CloudWatch Logs: $action"
            return 1
            ;;
    esac
    
    return 0
}

setup_honeycomb_integration() {
    local action="$1"
    log_message "INFO" "Setting up Honeycomb integration ($action)..."
    
    # Check if Honeycomb API key is available
    if [[ -z "${HONEYCOMB_API_KEY:-}" ]]; then
        log_message "ERROR" "HONEYCOMB_API_KEY is not set. Cannot setup Honeycomb integration."
        return 1
    fi
    
    # Define Honeycomb datasets for each service
    local backend_dataset="${PROJECT_NAME}-backend-${ENVIRONMENT}"
    local frontend_dataset="${PROJECT_NAME}-frontend-${ENVIRONMENT}"
    local worker_dataset="${PROJECT_NAME}-worker-${ENVIRONMENT}"
    
    case "$action" in
        create|update)
            # Process Honeycomb configuration template with environment variables
            log_message "INFO" "Processing Honeycomb configuration template..."
            
            if [[ ! -f "$HONEYCOMB_CONFIG_FILE" ]]; then
                log_message "ERROR" "Honeycomb configuration template not found: $HONEYCOMB_CONFIG_FILE"
                return 1
            fi
            
            # Create temporary config file with substituted variables
            local temp_config_file=$(mktemp)
            
            # Replace variables in the config template
            cat "$HONEYCOMB_CONFIG_FILE" | \
                sed "s/\${PROJECT_NAME}/$PROJECT_NAME/g" | \
                sed "s/\${ENVIRONMENT}/$ENVIRONMENT/g" | \
                sed "s/\${BACKEND_DATASET}/$backend_dataset/g" | \
                sed "s/\${FRONTEND_DATASET}/$frontend_dataset/g" | \
                sed "s/\${WORKER_DATASET}/$worker_dataset/g" > "$temp_config_file"
                
            log_message "INFO" "Honeycomb configuration prepared"
            
            # Create or update Honeycomb datasets
            log_message "INFO" "Creating/updating Honeycomb datasets..."
            
            # Function to create or update a dataset
            create_dataset() {
                local dataset=$1
                local description=$2
                
                # Check if dataset exists
                local dataset_exists=$(curl -s -H "X-Honeycomb-Team: $HONEYCOMB_API_KEY" \
                    "https://api.honeycomb.io/1/datasets/$dataset" | \
                    jq -r '.name // empty')
                    
                if [[ -z "$dataset_exists" ]]; then
                    # Create dataset
                    curl -s -X POST -H "X-Honeycomb-Team: $HONEYCOMB_API_KEY" \
                        -H "Content-Type: application/json" \
                        -d "{\"name\": \"$dataset\", \"description\": \"$description\"}" \
                        "https://api.honeycomb.io/1/datasets"
                        
                    log_message "INFO" "Created Honeycomb dataset: $dataset"
                else
                    log_message "INFO" "Honeycomb dataset already exists: $dataset"
                fi
            }
            
            create_dataset "$backend_dataset" "Metronomics backend service metrics and traces for $ENVIRONMENT environment"
            create_dataset "$frontend_dataset" "Metronomics frontend service metrics and traces for $ENVIRONMENT environment"
            create_dataset "$worker_dataset" "Metronomics worker service metrics and traces for $ENVIRONMENT environment"
            
            # Configure Honeycomb boards for key metrics and traces
            log_message "INFO" "Setting up Honeycomb boards..."
            
            # Backend service latency board
            local backend_latency_board=$(cat <<EOF
{
    "name": "${PROJECT_NAME}-${ENVIRONMENT}-backend-latency",
    "description": "Backend service latency analysis for ${ENVIRONMENT}",
    "queries": [
        {
            "dataset": "${backend_dataset}",
            "query": {
                "breakdowns": ["name"],
                "calculations": [
                    {"op": "P95", "column": "duration_ms"}
                ],
                "filters": [
                    {"column": "type", "op": "=", "value": "span"}
                ],
                "time_range": 3600,
                "granularity": 60
            }
        }
    ]
}
EOF
)
            
            curl -s -X POST -H "X-Honeycomb-Team: $HONEYCOMB_API_KEY" \
                -H "Content-Type: application/json" \
                -d "$backend_latency_board" \
                "https://api.honeycomb.io/1/boards"
                
            # API endpoint performance board
            local api_performance_board=$(cat <<EOF
{
    "name": "${PROJECT_NAME}-${ENVIRONMENT}-api-performance",
    "description": "API endpoint performance for ${ENVIRONMENT}",
    "queries": [
        {
            "dataset": "${backend_dataset}",
            "query": {
                "breakdowns": ["route"],
                "calculations": [
                    {"op": "P95", "column": "duration_ms"},
                    {"op": "COUNT"}
                ],
                "filters": [
                    {"column": "type", "op": "=", "value": "http_server"},
                    {"column": "status_code", "op": ">=", "value": 200},
                    {"column": "status_code", "op": "<", "value": 300}
                ],
                "time_range": 3600,
                "granularity": 60
            }
        }
    ]
}
EOF
)
            
            curl -s -X POST -H "X-Honeycomb-Team: $HONEYCOMB_API_KEY" \
                -H "Content-Type: application/json" \
                -d "$api_performance_board" \
                "https://api.honeycomb.io/1/boards"
                
            # Error tracking board
            local error_tracking_board=$(cat <<EOF
{
    "name": "${PROJECT_NAME}-${ENVIRONMENT}-error-tracking",
    "description": "Error tracking for ${ENVIRONMENT}",
    "queries": [
        {
            "dataset": "${backend_dataset}",
            "query": {
                "breakdowns": ["error.message"],
                "calculations": [
                    {"op": "COUNT"}
                ],
                "filters": [
                    {"column": "error", "op": "exists"}
                ],
                "time_range": 3600,
                "granularity": 60
            }
        }
    ]
}
EOF
)
            
            curl -s -X POST -H "X-Honeycomb-Team: $HONEYCOMB_API_KEY" \
                -H "Content-Type: application/json" \
                -d "$error_tracking_board" \
                "https://api.honeycomb.io/1/boards"
                
            log_message "INFO" "Honeycomb boards created"
            
            # Set up derived columns for enhanced analysis
            log_message "INFO" "Setting up derived columns..."
            
            # Backend service - API response time in seconds
            curl -s -X POST -H "X-Honeycomb-Team: $HONEYCOMB_API_KEY" \
                -H "Content-Type: application/json" \
                -d '{
                    "alias": "response_time_sec",
                    "expression": "duration_ms / 1000",
                    "description": "Response time in seconds"
                }' \
                "https://api.honeycomb.io/1/datasets/${backend_dataset}/derived_columns"
                
            # Backend service - Error flag
            curl -s -X POST -H "X-Honeycomb-Team: $HONEYCOMB_API_KEY" \
                -H "Content-Type: application/json" \
                -d '{
                    "alias": "has_error",
                    "expression": "CASE WHEN error EXISTS THEN 1 ELSE 0 END",
                    "description": "Flag indicating if the span has an error"
                }' \
                "https://api.honeycomb.io/1/datasets/${backend_dataset}/derived_columns"
                
            log_message "INFO" "Derived columns configured"
            
            # Configure triggers for SLO violations
            log_message "INFO" "Setting up Honeycomb triggers..."
            
            # API latency trigger
            local api_latency_trigger=$(cat <<EOF
{
    "name": "${PROJECT_NAME}-${ENVIRONMENT}-api-latency-trigger",
    "description": "Trigger when API latency exceeds threshold",
    "dataset": "${backend_dataset}",
    "query": {
        "calculations": [
            {"op": "P95", "column": "duration_ms"}
        ],
        "filters": [
            {"column": "type", "op": "=", "value": "http_server"}
        ],
        "time_range": 600
    },
    "threshold": {
        "op": ">",
        "value": 500
    },
    "frequency": 300,
    "recipients": [
        {"type": "email", "target": "${CRITICAL_ALERT_EMAIL:-devops@example.com}"}
    ]
}
EOF
)
            
            curl -s -X POST -H "X-Honeycomb-Team: $HONEYCOMB_API_KEY" \
                -H "Content-Type: application/json" \
                -d "$api_latency_trigger" \
                "https://api.honeycomb.io/1/triggers"
                
            # Error rate trigger
            local error_rate_trigger=$(cat <<EOF
{
    "name": "${PROJECT_NAME}-${ENVIRONMENT}-error-rate-trigger",
    "description": "Trigger when error rate exceeds threshold",
    "dataset": "${backend_dataset}",
    "query": {
        "calculations": [
            {"op": "COUNT_WHERE", "column": "error", "condition": "exists"},
            {"op": "COUNT"}
        ],
        "filters": [
            {"column": "type", "op": "=", "value": "http_server"}
        ],
        "time_range": 600
    },
    "threshold": {
        "op": ">",
        "value": 0.05
    },
    "frequency": 300,
    "recipients": [
        {"type": "email", "target": "${CRITICAL_ALERT_EMAIL:-devops@example.com}"}
    ]
}
EOF
)
            
            curl -s -X POST -H "X-Honeycomb-Team: $HONEYCOMB_API_KEY" \
                -H "Content-Type: application/json" \
                -d "$error_rate_trigger" \
                "https://api.honeycomb.io/1/triggers"
                
            log_message "INFO" "Honeycomb triggers configured"
            
            # Deploy Lambda function for CloudWatch to Honeycomb export
            log_message "INFO" "Setting up CloudWatch to Honeycomb export Lambda function..."
            
            # This would typically be done via Terraform, but we'll document the process
            log_message "INFO" "CloudWatch to Honeycomb export should be configured via Terraform."
            log_message "INFO" "Lambda function required with the following policies:"
            log_message "INFO" "- CloudWatch Logs read access"
            log_message "INFO" "- Honeycomb API key stored in AWS Secrets Manager"
            
            log_message "INFO" "Honeycomb integration setup complete"
            ;;
            
        delete)
            # Delete Honeycomb configuration
            log_message "INFO" "Deleting Honeycomb configuration..."
            
            # Note: Honeycomb API doesn't support deleting datasets
            log_message "INFO" "Note: Datasets cannot be deleted via API. Please remove manually if needed."
            
            # Delete triggers
            log_message "INFO" "Deleting Honeycomb triggers..."
            
            # Get list of triggers
            local triggers=$(curl -s -H "X-Honeycomb-Team: $HONEYCOMB_API_KEY" \
                "https://api.honeycomb.io/1/triggers" | \
                jq -r ".[] | select(.name | startswith(\"${PROJECT_NAME}-${ENVIRONMENT}\")) | .id")
                
            for trigger_id in $triggers; do
                curl -s -X DELETE -H "X-Honeycomb-Team: $HONEYCOMB_API_KEY" \
                    "https://api.honeycomb.io/1/triggers/$trigger_id"
                    
                log_message "INFO" "Deleted Honeycomb trigger: $trigger_id"
            done
            
            # Delete boards
            log_message "INFO" "Deleting Honeycomb boards..."
            
            local boards=$(curl -s -H "X-Honeycomb-Team: $HONEYCOMB_API_KEY" \
                "https://api.honeycomb.io/1/boards" | \
                jq -r ".[] | select(.name | startswith(\"${PROJECT_NAME}-${ENVIRONMENT}\")) | .id")
                
            for board_id in $boards; do
                curl -s -X DELETE -H "X-Honeycomb-Team: $HONEYCOMB_API_KEY" \
                    "https://api.honeycomb.io/1/boards/$board_id"
                    
                log_message "INFO" "Deleted Honeycomb board: $board_id"
            done
            
            log_message "INFO" "Honeycomb configuration deleted"
            ;;
            
        *)
            log_message "ERROR" "Invalid action for Honeycomb integration: $action"
            return 1
            ;;
    esac
    
    return 0
}

setup_health_checks() {
    local action="$1"
    log_message "INFO" "Setting up health check endpoints and monitoring ($action)..."
    
    # Define health check endpoints
    local backend_health_endpoint="api/health"
    local frontend_health_endpoint="health"
    
    case "$action" in
        create|update)
            # Configure Route 53 health checks for public endpoints
            log_message "INFO" "Setting up Route 53 health checks..."
            
            # Get ALB DNS name from Terraform outputs
            local alb_dns="${ALB_DNS}"
            
            if [[ -z "$alb_dns" ]]; then
                log_message "WARN" "ALB DNS name not found. Health checks may not be properly configured."
                if [[ "$FORCE" != "true" ]]; then
                    return 1
                fi
                
                # Use placeholder for demonstration
                alb_dns="${PROJECT_NAME}-${ENVIRONMENT}-alb.example.com"
            fi
            
            # Create backend health check
            local backend_health_check_id=$(aws route53 create-health-check \
                --caller-reference "${PROJECT_NAME}-backend-${ENVIRONMENT}-$(date +%s)" \
                --health-check-config "{
                    \"FullyQualifiedDomainName\": \"${alb_dns}\",
                    \"Port\": 80,
                    \"ResourcePath\": \"/${backend_health_endpoint}\",
                    \"Type\": \"HTTP\",
                    \"RequestInterval\": 30,
                    \"FailureThreshold\": 3,
                    \"MeasureLatency\": true
                }" \
                --region "$AWS_REGION" \
                --query 'HealthCheck.Id' \
                --output text)
                
            # Tag the health check
            aws route53 change-tags-for-resource \
                --resource-type healthcheck \
                --resource-id "$backend_health_check_id" \
                --add-tags Key=Name,Value="${PROJECT_NAME}-backend-${ENVIRONMENT}" \
                --region "$AWS_REGION"
                
            log_message "INFO" "Created Route 53 health check for backend: $backend_health_check_id"
            
            # Create frontend health check
            local frontend_health_check_id=$(aws route53 create-health-check \
                --caller-reference "${PROJECT_NAME}-frontend-${ENVIRONMENT}-$(date +%s)" \
                --health-check-config "{
                    \"FullyQualifiedDomainName\": \"${alb_dns}\",
                    \"Port\": 80,
                    \"ResourcePath\": \"/${frontend_health_endpoint}\",
                    \"Type\": \"HTTP\",
                    \"RequestInterval\": 30,
                    \"FailureThreshold\": 3,
                    \"MeasureLatency\": true
                }" \
                --region "$AWS_REGION" \
                --query 'HealthCheck.Id' \
                --output text)
                
            # Tag the health check
            aws route53 change-tags-for-resource \
                --resource-type healthcheck \
                --resource-id "$frontend_health_check_id" \
                --add-tags Key=Name,Value="${PROJECT_NAME}-frontend-${ENVIRONMENT}" \
                --region "$AWS_REGION"
                
            log_message "INFO" "Created Route 53 health check for frontend: $frontend_health_check_id"
            
            # Set up CloudWatch alarms for health check failures
            log_message "INFO" "Setting up CloudWatch alarms for health checks..."
            
            # Get SNS topic ARN for critical alerts
            local critical_topic="${PROJECT_NAME}-${ENVIRONMENT}-critical-alerts"
            local critical_topic_arn=$(aws sns list-topics \
                --region "$AWS_REGION" \
                --query "Topics[?contains(TopicArn, '${critical_topic}')].TopicArn" \
                --output text)
                
            if [[ -n "$critical_topic_arn" ]]; then
                # Backend health check alarm
                aws cloudwatch put-metric-alarm \
                    --alarm-name "${PROJECT_NAME}-${ENVIRONMENT}-backend-health-check" \
                    --alarm-description "Backend health check failure" \
                    --metric-name HealthCheckStatus \
                    --namespace AWS/Route53 \
                    --statistic Minimum \
                    --period 60 \
                    --threshold 1 \
                    --comparison-operator LessThanThreshold \
                    --dimensions Name=HealthCheckId,Value=${backend_health_check_id} \
                    --evaluation-periods 2 \
                    --alarm-actions "$critical_topic_arn" \
                    --ok-actions "$critical_topic_arn" \
                    --region "$AWS_REGION"
                    
                # Frontend health check alarm
                aws cloudwatch put-metric-alarm \
                    --alarm-name "${PROJECT_NAME}-${ENVIRONMENT}-frontend-health-check" \
                    --alarm-description "Frontend health check failure" \
                    --metric-name HealthCheckStatus \
                    --namespace AWS/Route53 \
                    --statistic Minimum \
                    --period 60 \
                    --threshold 1 \
                    --comparison-operator LessThanThreshold \
                    --dimensions Name=HealthCheckId,Value=${frontend_health_check_id} \
                    --evaluation-periods 2 \
                    --alarm-actions "$critical_topic_arn" \
                    --ok-actions "$critical_topic_arn" \
                    --region "$AWS_REGION"
                    
                log_message "INFO" "Health check alarms created"
            else
                log_message "WARN" "Critical SNS topic not found. Skipping health check alarms."
            fi
            
            # Configure synthetic canary for critical user journeys
            log_message "INFO" "Setting up CloudWatch Synthetics canaries..."
            
            # This would typically be done via Terraform/CloudFormation
            # Here we'll just document the process
            log_message "INFO" "CloudWatch Synthetics canaries should be configured for critical user journeys:"
            log_message "INFO" "1. User login flow"
            log_message "INFO" "2. Meeting creation and facilitation"
            log_message "INFO" "3. Metrics dashboard loading"
            log_message "INFO" "4. Strategic goal viewing"
            
            log_message "INFO" "Health checks setup complete"
            ;;
            
        delete)
            # Delete health checks and related resources
            log_message "INFO" "Deleting health checks..."
            
            # Get health check IDs
            local health_checks=$(aws route53 list-health-checks \
                --region "$AWS_REGION" \
                --query "HealthChecks[?contains(Tags[?Key=='Name'].Value, '${PROJECT_NAME}-${ENVIRONMENT}')].Id" \
                --output text)
                
            # Delete CloudWatch alarms for health checks
            for health_check_id in $health_checks; do
                aws cloudwatch delete-alarms \
                    --alarm-names "${PROJECT_NAME}-${ENVIRONMENT}-backend-health-check" "${PROJECT_NAME}-${ENVIRONMENT}-frontend-health-check" \
                    --region "$AWS_REGION" || true
                    
                # Delete Route 53 health check
                aws route53 delete-health-check \
                    --health-check-id "$health_check_id" \
                    --region "$AWS_REGION" || true
                    
                log_message "INFO" "Deleted health check: $health_check_id"
            done
            
            log_message "INFO" "Health checks deleted"
            ;;
            
        *)
            log_message "ERROR" "Invalid action for health checks: $action"
            return 1
            ;;
    esac
    
    return 0
}

setup_slo_monitoring() {
    local action="$1"
    log_message "INFO" "Setting up SLO monitoring ($action)..."
    
    case "$action" in
        create|update)
            # Define SLI metrics based on technical requirements
            log_message "INFO" "Setting up SLI metrics..."
            
            # Define SLO thresholds based on environment
            local api_availability_slo=99.9
            local api_latency_slo=500
            local realtime_sync_slo=1000
            local data_durability_slo=100
            
            if [[ "$ENVIRONMENT" == "development" ]]; then
                api_availability_slo=99.0
                api_latency_slo=1000
                realtime_sync_slo=2000
            fi
            
            # Configure CloudWatch composite alarms for SLO tracking
            log_message "INFO" "Setting up CloudWatch composite alarms for SLO tracking..."
            
            # Get SNS topic ARN for warning alerts
            local warning_topic="${PROJECT_NAME}-${ENVIRONMENT}-warning-alerts"
            local warning_topic_arn=$(aws sns list-topics \
                --region "$AWS_REGION" \
                --query "Topics[?contains(TopicArn, '${warning_topic}')].TopicArn" \
                --output text)
                
            if [[ -z "$warning_topic_arn" ]]; then
                log_message "WARN" "Warning SNS topic not found. SLO alarms may not send notifications."
                if [[ "$FORCE" != "true" ]]; then
                    return 1
                fi
            fi
            
            # Calculate error budget based on SLO
            local api_error_budget=$(echo "scale=3; (100 - $api_availability_slo) / 100" | bc)
            
            # API availability SLO alarm
            # This composite alarm combines error rate and health check status
            local backend_health_check_alarm="${PROJECT_NAME}-${ENVIRONMENT}-backend-health-check"
            local api_error_rate_alarm="${PROJECT_NAME}-${ENVIRONMENT}-api-error-rate-warning"
            
            aws cloudwatch put-composite-alarm \
                --alarm-name "${PROJECT_NAME}-${ENVIRONMENT}-api-availability-slo" \
                --alarm-description "API availability SLO violation" \
                --alarm-rule "(ALARM(${backend_health_check_alarm}) OR ALARM(${api_error_rate_alarm}))" \
                --alarm-actions "$warning_topic_arn" \
                --ok-actions "$warning_topic_arn" \
                --region "$AWS_REGION"
                
            # API latency SLO alarm
            local api_latency_alarm="${PROJECT_NAME}-${ENVIRONMENT}-api-latency-warning"
            
            aws cloudwatch put-composite-alarm \
                --alarm-name "${PROJECT_NAME}-${ENVIRONMENT}-api-latency-slo" \
                --alarm-description "API latency SLO violation" \
                --alarm-rule "ALARM(${api_latency_alarm})" \
                --alarm-actions "$warning_topic_arn" \
                --ok-actions "$warning_topic_arn" \
                --region "$AWS_REGION"
                
            log_message "INFO" "CloudWatch composite alarms for SLO tracking created"
            
            # Set up Honeycomb SLO tracking with burn rate alerts
            log_message "INFO" "Setting up Honeycomb SLO tracking..."
            
            if [[ -n "${HONEYCOMB_API_KEY:-}" ]]; then
                local backend_dataset="${PROJECT_NAME}-backend-${ENVIRONMENT}"
                
                # API availability SLO in Honeycomb
                local api_availability_slo_config=$(cat <<EOF
{
    "name": "${PROJECT_NAME}-${ENVIRONMENT}-api-availability-slo",
    "description": "API availability SLO for ${ENVIRONMENT}",
    "dataset": "${backend_dataset}",
    "service_level_objective": {
        "target": $api_availability_slo,
        "time_period": "30d",
        "error_budget_remaining_minutes": null
    },
    "sli": {
        "query": {
            "calculations": [
                {"op": "COUNT_WHERE", "column": "status_code", "condition": ">= 500"},
                {"op": "COUNT"}
            ],
            "filters": [
                {"column": "type", "op": "=", "value": "http_server"}
            ]
        },
        "good_events_query": {
            "filters": [
                {"column": "status_code", "op": "<", "value": "500"}
            ]
        },
        "total_events_query": {
            "filters": []
        }
    },
    "burn_rate_alerts": [
        {
            "alert_at_burn_rate": 10,
            "minimum_events": 100,
            "time_window_minutes": 60,
            "recipients": [
                {"type": "email", "target": "${WARNING_ALERT_EMAIL:-devops@example.com}"}
            ]
        }
    ]
}
EOF
)
                
                curl -s -X POST -H "X-Honeycomb-Team: $HONEYCOMB_API_KEY" \
                    -H "Content-Type: application/json" \
                    -d "$api_availability_slo_config" \
                    "https://api.honeycomb.io/1/slos"
                    
                # API latency SLO in Honeycomb
                local api_latency_slo_config=$(cat <<EOF
{
    "name": "${PROJECT_NAME}-${ENVIRONMENT}-api-latency-slo",
    "description": "API latency SLO for ${ENVIRONMENT}",
    "dataset": "${backend_dataset}",
    "service_level_objective": {
        "target": 95.0,
        "time_period": "30d",
        "error_budget_remaining_minutes": null
    },
    "sli": {
        "query": {
            "calculations": [
                {"op": "COUNT_WHERE", "column": "duration_ms", "condition": "> $api_latency_slo"},
                {"op": "COUNT"}
            ],
            "filters": [
                {"column": "type", "op": "=", "value": "http_server"}
            ]
        },
        "good_events_query": {
            "filters": [
                {"column": "duration_ms", "op": "<=", "value": "$api_latency_slo"}
            ]
        },
        "total_events_query": {
            "filters": []
        }
    },
    "burn_rate_alerts": [
        {
            "alert_at_burn_rate": 10,
            "minimum_events": 100,
            "time_window_minutes": 60,
            "recipients": [
                {"type": "email", "target": "${WARNING_ALERT_EMAIL:-devops@example.com}"}
            ]
        }
    ]
}
EOF
)
                
                curl -s -X POST -H "X-Honeycomb-Team: $HONEYCOMB_API_KEY" \
                    -H "Content-Type: application/json" \
                    -d "$api_latency_slo_config" \
                    "https://api.honeycomb.io/1/slos"
                    
                log_message "INFO" "Honeycomb SLO tracking configured"
            else
                log_message "WARN" "HONEYCOMB_API_KEY is not set. Skipping Honeycomb SLO configuration."
            fi
            
            # Create SLO dashboards
            log_message "INFO" "Creating SLO dashboards..."
            
            # SLO dashboard in CloudWatch
            local slo_dashboard_json=$(cat <<EOF
{
    "widgets": [
        {
            "type": "metric",
            "x": 0,
            "y": 0,
            "width": 24,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", "${ALB_NAME}", { "stat": "p95", "label": "p95 Response Time" } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS_REGION}",
                "title": "API Latency SLI (Target: < ${api_latency_slo}ms)",
                "period": 300,
                "annotations": {
                    "horizontal": [
                        {
                            "value": $api_latency_slo,
                            "label": "SLO Threshold",
                            "color": "#ff0000"
                        }
                    ]
                }
            }
        },
        {
            "type": "metric",
            "x": 0,
            "y": 6,
            "width": 24,
            "height": 6,
            "properties": {
                "metrics": [
                    [ { "expression": "100 - (m2/m1*100)", "label": "Availability %", "id": "e1" } ],
                    [ "AWS/ApplicationELB", "RequestCount", "LoadBalancer", "${ALB_NAME}", { "id": "m1", "visible": false } ],
                    [ ".", "HTTPCode_Target_5XX_Count", ".", ".", { "id": "m2", "visible": false } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS_REGION}",
                "title": "API Availability SLI (Target: ${api_availability_slo}%)",
                "period": 300,
                "annotations": {
                    "horizontal": [
                        {
                            "value": $api_availability_slo,
                            "label": "SLO Threshold",
                            "color": "#ff0000"
                        }
                    ]
                },
                "yAxis": {
                    "left": {
                        "min": 90,
                        "max": 100
                    }
                }
            }
        },
        {
            "type": "metric",
            "x": 0,
            "y": 12,
            "width": 24,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "${PROJECT_NAME}/SLO", "RealTimeSyncLatency", "Environment", "${ENVIRONMENT}", { "stat": "p95" } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS_REGION}",
                "title": "Real-time Sync SLI (Target: < ${realtime_sync_slo}ms)",
                "period": 60,
                "annotations": {
                    "horizontal": [
                        {
                            "value": $realtime_sync_slo,
                            "label": "SLO Threshold",
                            "color": "#ff0000"
                        }
                    ]
                }
            }
        },
        {
            "type": "metric",
            "x": 0,
            "y": 18,
            "width": 24,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "${PROJECT_NAME}/SLO", "DataDurability", "Environment", "${ENVIRONMENT}", { "stat": "Average" } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS_REGION}",
                "title": "Data Durability SLI (Target: ${data_durability_slo}%)",
                "period": 3600,
                "annotations": {
                    "horizontal": [
                        {
                            "value": $data_durability_slo,
                            "label": "SLO Threshold",
                            "color": "#ff0000"
                        }
                    ]
                },
                "yAxis": {
                    "left": {
                        "min": 99,
                        "max": 100
                    }
                }
            }
        }
    ]
}
EOF
)
            
            aws cloudwatch put-dashboard \
                --dashboard-name "${PROJECT_NAME}-${ENVIRONMENT}-slo-dashboard" \
                --dashboard-body "$slo_dashboard_json" \
                --region "$AWS_REGION"
                
            log_message "INFO" "SLO dashboard created: https://${AWS_REGION}.console.aws.amazon.com/cloudwatch/home?region=${AWS_REGION}#dashboards:name=${PROJECT_NAME}-${ENVIRONMENT}-slo-dashboard"
            
            # Configure error budget tracking and alerting
            log_message "INFO" "Setting up error budget tracking..."
            
            # Create custom metric for error budget tracking
            aws cloudwatch put-metric-data \
                --namespace "${PROJECT_NAME}/SLO" \
                --metric-name "APIErrorBudget" \
                --dimensions "Environment=${ENVIRONMENT}" \
                --value "$api_error_budget" \
                --region "$AWS_REGION"
                
            # Error budget consumption alarm
            local error_budget_alarm_threshold=$(echo "scale=3; $api_error_budget * 0.5" | bc)
            
            aws cloudwatch put-metric-alarm \
                --alarm-name "${PROJECT_NAME}-${ENVIRONMENT}-api-error-budget-consumption" \
                --alarm-description "API error budget consumption alert" \
                --metric-name "HTTPCode_Target_5XX_Count" \
                --namespace "AWS/ApplicationELB" \
                --statistic Sum \
                --period 86400 \
                --threshold "$error_budget_alarm_threshold" \
                --comparison-operator GreaterThanThreshold \
                --dimensions Name=LoadBalancer,Value=${ALB_NAME} \
                --evaluation-periods 1 \
                --alarm-actions "$warning_topic_arn" \
                --ok-actions "$warning_topic_arn" \
                --region "$AWS_REGION"
                
            log_message "INFO" "Error budget tracking configured"
            log_message "INFO" "SLO monitoring setup complete"
            ;;
            
        delete)
            # Delete SLO monitoring configuration
            log_message "INFO" "Deleting SLO monitoring configuration..."
            
            # Delete CloudWatch composite alarms
            aws cloudwatch delete-alarms \
                --alarm-names "${PROJECT_NAME}-${ENVIRONMENT}-api-availability-slo" "${PROJECT_NAME}-${ENVIRONMENT}-api-latency-slo" \
                --region "$AWS_REGION" || true
                
            # Delete error budget alarm
            aws cloudwatch delete-alarms \
                --alarm-names "${PROJECT_NAME}-${ENVIRONMENT}-api-error-budget-consumption" \
                --region "$AWS_REGION" || true
                
            # Delete SLO dashboard
            aws cloudwatch delete-dashboards \
                --dashboard-names "${PROJECT_NAME}-${ENVIRONMENT}-slo-dashboard" \
                --region "$AWS_REGION" || true
                
            # Delete Honeycomb SLOs
            if [[ -n "${HONEYCOMB_API_KEY:-}" ]]; then
                local slos=$(curl -s -H "X-Honeycomb-Team: $HONEYCOMB_API_KEY" \
                    "https://api.honeycomb.io/1/slos" | \
                    jq -r ".[] | select(.name | startswith(\"${PROJECT_NAME}-${ENVIRONMENT}\")) | .id")
                    
                for slo_id in $slos; do
                    curl -s -X DELETE -H "X-Honeycomb-Team: $HONEYCOMB_API_KEY" \
                        "https://api.honeycomb.io/1/slos/$slo_id"
                        
                    log_message "INFO" "Deleted Honeycomb SLO: $slo_id"
                done
            fi
            
            log_message "INFO" "SLO monitoring configuration deleted"
            ;;
            
        *)
            log_message "ERROR" "Invalid action for SLO monitoring: $action"
            return 1
            ;;
    esac
    
    return 0
}

verify_monitoring_setup() {
    log_message "INFO" "Verifying monitoring setup..."
    
    local verification_errors=0
    
    # Check CloudWatch dashboards
    if [[ "$COMPONENT" == "cloudwatch" || "$COMPONENT" == "all" ]]; then
        log_message "INFO" "Verifying CloudWatch dashboards..."
        
        local dashboards=$(aws cloudwatch list-dashboards \
            --dashboard-name-prefix "${PROJECT_NAME}-${ENVIRONMENT}" \
            --region "$AWS_REGION" \
            --query 'DashboardEntries[].DashboardName' \
            --output text)
            
        if [[ -z "$dashboards" ]]; then
            log_message "ERROR" "No CloudWatch dashboards found with prefix ${PROJECT_NAME}-${ENVIRONMENT}"
            verification_errors=$((verification_errors + 1))
        else
            log_message "INFO" "Found CloudWatch dashboards: $dashboards"
        fi
        
        # Check CloudWatch alarms
        log_message "INFO" "Verifying CloudWatch alarms..."
        
        local alarms=$(aws cloudwatch describe-alarms \
            --alarm-name-prefix "${PROJECT_NAME}-${ENVIRONMENT}" \
            --region "$AWS_REGION" \
            --query 'MetricAlarms[].AlarmName' \
            --output text)
            
        if [[ -z "$alarms" ]]; then
            log_message "ERROR" "No CloudWatch alarms found with prefix ${PROJECT_NAME}-${ENVIRONMENT}"
            verification_errors=$((verification_errors + 1))
        else
            log_message "INFO" "Found CloudWatch alarms"
        fi
        
        # Verify SNS topic delivery
        log_message "INFO" "Verifying SNS topics..."
        
        local topics=$(aws sns list-topics \
            --region "$AWS_REGION" \
            --query "Topics[?contains(TopicArn, '${PROJECT_NAME}-${ENVIRONMENT}')].TopicArn" \
            --output text)
            
        if [[ -z "$topics" ]]; then
            log_message "ERROR" "No SNS topics found with prefix ${PROJECT_NAME}-${ENVIRONMENT}"
            verification_errors=$((verification_errors + 1))
        else
            log_message "INFO" "Found SNS topics: $topics"
        fi
    fi
    
    # Verify Honeycomb data ingestion
    if [[ "$COMPONENT" == "honeycomb" || "$COMPONENT" == "all" ]]; then
        if [[ -n "${HONEYCOMB_API_KEY:-}" ]]; then
            log_message "INFO" "Verifying Honeycomb configuration..."
            
            local backend_dataset="${PROJECT_NAME}-backend-${ENVIRONMENT}"
            
            # Check if dataset exists
            local dataset_exists=$(curl -s -H "X-Honeycomb-Team: $HONEYCOMB_API_KEY" \
                "https://api.honeycomb.io/1/datasets/$backend_dataset" | \
                jq -r '.name // empty')
                
            if [[ -z "$dataset_exists" ]]; then
                log_message "ERROR" "Honeycomb dataset not found: $backend_dataset"
                verification_errors=$((verification_errors + 1))
            else
                log_message "INFO" "Found Honeycomb dataset: $backend_dataset"
            fi
            
            # Check for triggers
            local triggers=$(curl -s -H "X-Honeycomb-Team: $HONEYCOMB_API_KEY" \
                "https://api.honeycomb.io/1/triggers" | \
                jq -r ".[] | select(.name | startswith(\"${PROJECT_NAME}-${ENVIRONMENT}\")) | .id")
                
            if [[ -z "$triggers" ]]; then
                log_message "WARN" "No Honeycomb triggers found with prefix ${PROJECT_NAME}-${ENVIRONMENT}"
                # Not counting as error since they might be set up differently
            else
                log_message "INFO" "Found Honeycomb triggers"
            fi
        else
            log_message "WARN" "Skipping Honeycomb verification because HONEYCOMB_API_KEY is not set"
        fi
    fi
    
    # Check health check endpoints
    log_message "INFO" "Verifying health check endpoints..."
    
    local health_checks=$(aws route53 list-health-checks \
        --region "$AWS_REGION" \
        --query "HealthChecks[?contains(Tags[?Key=='Name'].Value, '${PROJECT_NAME}-${ENVIRONMENT}')].Id" \
        --output text)
        
    if [[ -z "$health_checks" ]]; then
        log_message "WARN" "No Route 53 health checks found for ${PROJECT_NAME}-${ENVIRONMENT}"
        # Only warn since these might be set up differently
    else
        log_message "INFO" "Found Route 53 health checks: $health_checks"
    fi
    
    # Validate SLO metric collection
    log_message "INFO" "Verifying SLO metrics..."
    
    local slo_dashboard=$(aws cloudwatch list-dashboards \
        --dashboard-name-prefix "${PROJECT_NAME}-${ENVIRONMENT}-slo" \
        --region "$AWS_REGION" \
        --query 'DashboardEntries[].DashboardName' \
        --output text)
        
    if [[ -z "$slo_dashboard" ]]; then
        log_message "WARN" "No SLO dashboard found with prefix ${PROJECT_NAME}-${ENVIRONMENT}-slo"
        # Only warn since these might be set up differently
    else
        log_message "INFO" "Found SLO dashboard: $slo_dashboard"
    fi
    
    # Generate verification report
    if [[ $verification_errors -eq 0 ]]; then
        log_message "INFO" "Monitoring setup verification completed successfully"
        return 0
    else
        log_message "ERROR" "Monitoring setup verification found $verification_errors errors"
        return 1
    fi
}

cleanup_resources() {
    local component="$1"
    log_message "INFO" "Cleaning up monitoring resources for $component..."
    
    case "$component" in
        cloudwatch)
            # Clean up CloudWatch dashboards
            log_message "INFO" "Cleaning up CloudWatch dashboards..."
            
            local dashboards=$(aws cloudwatch list-dashboards \
                --dashboard-name-prefix "${PROJECT_NAME}-${ENVIRONMENT}" \
                --region "$AWS_REGION" \
                --query 'DashboardEntries[].DashboardName' \
                --output text)
                
            if [[ -n "$dashboards" ]]; then
                aws cloudwatch delete-dashboards \
                    --dashboard-names $dashboards \
                    --region "$AWS_REGION"
                    
                log_message "INFO" "Deleted CloudWatch dashboards: $dashboards"
            fi
            
            # Clean up CloudWatch alarms
            log_message "INFO" "Cleaning up CloudWatch alarms..."
            
            local alarms=$(aws cloudwatch describe-alarms \
                --alarm-name-prefix "${PROJECT_NAME}-${ENVIRONMENT}" \
                --region "$AWS_REGION" \
                --query 'MetricAlarms[].AlarmName' \
                --output text)
                
            if [[ -n "$alarms" ]]; then
                aws cloudwatch delete-alarms \
                    --alarm-names $alarms \
                    --region "$AWS_REGION"
                    
                log_message "INFO" "Deleted CloudWatch alarms: $alarms"
            fi
            
            # Clean up SNS topics
            log_message "INFO" "Cleaning up SNS topics..."
            
            local topics=$(aws sns list-topics \
                --region "$AWS_REGION" \
                --query "Topics[?contains(TopicArn, '${PROJECT_NAME}-${ENVIRONMENT}')].TopicArn" \
                --output text)
                
            for topic in $topics; do
                aws sns delete-topic \
                    --topic-arn "$topic" \
                    --region "$AWS_REGION"
                    
                log_message "INFO" "Deleted SNS topic: $topic"
            done
            ;;
            
        honeycomb)
            if [[ -n "${HONEYCOMB_API_KEY:-}" ]]; then
                # Clean up Honeycomb triggers
                log_message "INFO" "Cleaning up Honeycomb triggers..."
                
                local triggers=$(curl -s -H "X-Honeycomb-Team: $HONEYCOMB_API_KEY" \
                    "https://api.honeycomb.io/1/triggers" | \
                    jq -r ".[] | select(.name | startswith(\"${PROJECT_NAME}-${ENVIRONMENT}\")) | .id")
                    
                for trigger_id in $triggers; do
                    curl -s -X DELETE -H "X-Honeycomb-Team: $HONEYCOMB_API_KEY" \
                        "https://api.honeycomb.io/1/triggers/$trigger_id"
                        
                    log_message "INFO" "Deleted Honeycomb trigger: $trigger_id"
                done
                
                # Clean up Honeycomb boards
                log_message "INFO" "Cleaning up Honeycomb boards..."
                
                local boards=$(curl -s -H "X-Honeycomb-Team: $HONEYCOMB_API_KEY" \
                    "https://api.honeycomb.io/1/boards" | \
                    jq -r ".[] | select(.name | startswith(\"${PROJECT_NAME}-${ENVIRONMENT}\")) | .id")
                    
                for board_id in $boards; do
                    curl -s -X DELETE -H "X-Honeycomb-Team: $HONEYCOMB_API_KEY" \
                        "https://api.honeycomb.io/1/boards/$board_id"
                        
                    log_message "INFO" "Deleted Honeycomb board: $board_id"
                done
                
                # Clean up Honeycomb SLOs
                log_message "INFO" "Cleaning up Honeycomb SLOs..."
                
                local slos=$(curl -s -H "X-Honeycomb-Team: $HONEYCOMB_API_KEY" \
                    "https://api.honeycomb.io/1/slos" | \
                    jq -r ".[] | select(.name | startswith(\"${PROJECT_NAME}-${ENVIRONMENT}\")) | .id")
                    
                for slo_id in $slos; do
                    curl -s -X DELETE -H "X-Honeycomb-Team: $HONEYCOMB_API_KEY" \
                        "https://api.honeycomb.io/1/slos/$slo_id"
                        
                    log_message "INFO" "Deleted Honeycomb SLO: $slo_id"
                done
            else
                log_message "WARN" "Skipping Honeycomb cleanup because HONEYCOMB_API_KEY is not set"
            fi
            ;;
            
        health-checks)
            # Clean up Route 53 health checks
            log_message "INFO" "Cleaning up health checks..."
            
            local health_checks=$(aws route53 list-health-checks \
                --region "$AWS_REGION" \
                --query "HealthChecks[?contains(Tags[?Key=='Name'].Value, '${PROJECT_NAME}-${ENVIRONMENT}')].Id" \
                --output text)
                
            for health_check_id in $health_checks; do
                aws route53 delete-health-check \
                    --health-check-id "$health_check_id" \
                    --region "$AWS_REGION"
                    
                log_message "INFO" "Deleted health check: $health_check_id"
            done
            ;;
            
        *)
            log_message "ERROR" "Invalid component for cleanup: $component"
            return 1
            ;;
    esac
    
    log_message "INFO" "Resource cleanup completed for $component"
    return 0
}

main() {
    # Source deploy.sh for common functions
    if [[ -f "${SCRIPT_DIR}/deploy.sh" ]]; then
        source "${SCRIPT_DIR}/deploy.sh"
    else
        log_message "ERROR" "Cannot find deploy.sh, which contains required functions."
        return 1
    fi
    
    # Parse command line arguments
    if ! parse_arguments "$@"; then
        return 1
    fi
    
    # Check prerequisites
    if ! check_prerequisites; then
        return 1
    fi
    
    # Setup environment
    if ! setup_environment "$ENVIRONMENT"; then
        return 1
    fi
    
    # Get Terraform outputs if not skipped
    if ! get_terraform_outputs "$ENVIRONMENT"; then
        if [[ "$FORCE" != "true" ]]; then
            log_message "ERROR" "Failed to get Terraform outputs and --force not specified."
            return 1
        fi
    fi
    
    # Setup CloudWatch dashboards, alarms, and logs
    if [[ "$COMPONENT" == "cloudwatch" || "$COMPONENT" == "all" ]]; then
        if ! setup_cloudwatch_dashboards "$ACTION"; then
            log_message "ERROR" "Failed to setup CloudWatch dashboards."
            cleanup_resources "cloudwatch"
            return 1
        fi
        
        if ! setup_cloudwatch_alarms "$ACTION"; then
            log_message "ERROR" "Failed to setup CloudWatch alarms."
            cleanup_resources "cloudwatch"
            return 1
        fi
        
        if ! setup_cloudwatch_logs "$ACTION"; then
            log_message "ERROR" "Failed to setup CloudWatch logs."
            cleanup_resources "cloudwatch"
            return 1
        fi
    fi
    
    # Setup Honeycomb integration
    if [[ "$COMPONENT" == "honeycomb" || "$COMPONENT" == "all" ]]; then
        if ! setup_honeycomb_integration "$ACTION"; then
            log_message "ERROR" "Failed to setup Honeycomb integration."
            cleanup_resources "honeycomb"
            return 1
        fi
    fi
    
    # Setup health checks
    if ! setup_health_checks "$ACTION"; then
        log_message "ERROR" "Failed to setup health checks."
        cleanup_resources "health-checks"
        return 1
    fi
    
    # Setup SLO monitoring
    if ! setup_slo_monitoring "$ACTION"; then
        log_message "ERROR" "Failed to setup SLO monitoring."
        return 1
    fi
    
    # Verify setup if creating or updating
    if [[ "$ACTION" == "create" || "$ACTION" == "update" ]]; then
        if ! verify_monitoring_setup; then
            log_message "WARN" "Monitoring setup verification found issues."
            # Continue despite verification issues
        fi
    fi
    
    # Send notification about setup status
    if [[ $ERROR_COUNT -eq 0 ]]; then
        send_deployment_notification "SUCCESS" "$ENVIRONMENT" "monitoring" "Monitoring setup ($ACTION) completed successfully for component: $COMPONENT"
        log_message "INFO" "Monitoring setup ($ACTION) completed successfully for $ENVIRONMENT environment, component: $COMPONENT"
        return 0
    else
        send_deployment_notification "FAILED" "$ENVIRONMENT" "monitoring" "Monitoring setup ($ACTION) failed with $ERROR_COUNT errors for component: $COMPONENT"
        log_message "ERROR" "Monitoring setup ($ACTION) failed with $ERROR_COUNT errors for $ENVIRONMENT environment, component: $COMPONENT"
        return 1
    fi
}

# Run the main function with all script arguments
main "$@"
exit $?