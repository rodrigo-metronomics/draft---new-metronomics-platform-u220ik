#!/bin/bash
#
# Deployment script for the Metronomics Platform
# Automates build, deployment, and verification process across different environments
#
# Author: Metronomics DevOps Team
#
# Usage: ./deploy.sh [options]
#   Options:
#     -e, --environment ENV    Deploy to environment (development, staging, production)
#     -c, --component COMP     Component to deploy (backend, frontend, worker, all)
#     --skip-build             Skip Docker image building
#     --skip-tests             Skip running tests
#     --force                  Force deployment even if tests fail
#     --apply-terraform        Apply Terraform before deployment
#     --skip-terraform         Skip Terraform verification
#     -h, --help               Show this help message
#
# Examples:
#   ./deploy.sh -e development -c all              # Deploy all components to development
#   ./deploy.sh -e staging -c frontend --skip-tests # Deploy frontend to staging, skip tests
#   ./deploy.sh -e production -c backend --apply-terraform # Apply Terraform and deploy backend to production

# Strict error handling
set -euo pipefail

# Constants
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text)
PROJECT_ROOT=$(git rev-parse --show-toplevel)
DOCKER_COMPOSE_FILE="${PROJECT_ROOT}/infrastructure/docker/docker-compose.yml"
BACKEND_DOCKERFILE="${PROJECT_ROOT}/infrastructure/docker/Dockerfile.backend"
WEB_DOCKERFILE="${PROJECT_ROOT}/infrastructure/docker/Dockerfile.web"
BACKEND_SRC_DIR="${PROJECT_ROOT}/src/backend"
WEB_SRC_DIR="${PROJECT_ROOT}/src/web"
TERRAFORM_DIR="${PROJECT_ROOT}/infrastructure/terraform"
ECR_REPO_PREFIX="metronomics"
DEPLOYMENT_TIMEOUT="900"
HEALTH_CHECK_RETRIES="30"
HEALTH_CHECK_INTERVAL="10"

# Default values
ENVIRONMENT="development"
COMPONENT="all"
SKIP_BUILD=false
SKIP_TESTS=false
FORCE=false
APPLY_TERRAFORM=false
SKIP_TERRAFORM=false

# Helper Functions
log_info() {
    echo -e "\033[0;32m[INFO]\033[0m $1"
}

log_warn() {
    echo -e "\033[0;33m[WARN]\033[0m $1"
}

log_error() {
    echo -e "\033[0;31m[ERROR]\033[0m $1" >&2
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed. Please install it first."
        return 1
    fi
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install it first."
        return 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running. Please start it first."
        return 1
    fi
    
    # Check if Terraform is installed
    if ! command -v terraform &> /dev/null; then
        log_error "Terraform is not installed. Please install it first."
        return 1
    fi
    
    # Check if jq is installed
    if ! command -v jq &> /dev/null; then
        log_error "jq is not installed. Please install it first."
        return 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials are not configured or invalid."
        return 1
    fi
    
    # Check if git repository is clean if not in force mode
    if [[ "$FORCE" != "true" ]]; then
        if [[ -n "$(git status --porcelain)" ]]; then
            log_warn "Git repository has uncommitted changes. This may affect versioning."
            log_warn "Use --force to deploy anyway."
            return 1
        fi
    fi
    
    log_info "All prerequisites met."
    return 0
}

parse_arguments() {
    local args=("$@")
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
                    log_error "Invalid environment: $ENVIRONMENT. Must be development, staging, or production."
                    return 1
                fi
                shift 2
                ;;
            -c|--component)
                COMPONENT="$2"
                if [[ ! "$COMPONENT" =~ ^(backend|frontend|worker|all)$ ]]; then
                    log_error "Invalid component: $COMPONENT. Must be backend, frontend, worker, or all."
                    return 1
                fi
                shift 2
                ;;
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            --force)
                FORCE=true
                shift
                ;;
            --apply-terraform)
                APPLY_TERRAFORM=true
                shift
                ;;
            --skip-terraform)
                SKIP_TERRAFORM=true
                shift
                ;;
            -h|--help)
                echo "Usage: ./deploy.sh [options]"
                echo "  Options:"
                echo "    -e, --environment ENV    Deploy to environment (development, staging, production)"
                echo "    -c, --component COMP     Component to deploy (backend, frontend, worker, all)"
                echo "    --skip-build             Skip Docker image building"
                echo "    --skip-tests             Skip running tests"
                echo "    --force                  Force deployment even if tests fail"
                echo "    --apply-terraform        Apply Terraform before deployment"
                echo "    --skip-terraform         Skip Terraform verification"
                echo "    -h, --help               Show this help message"
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                return 1
                ;;
        esac
    done
    
    # Validate argument combinations
    if [[ "$APPLY_TERRAFORM" == "true" && "$SKIP_TERRAFORM" == "true" ]]; then
        log_error "Cannot specify both --apply-terraform and --skip-terraform"
        return 1
    fi
    
    return 0
}

setup_environment() {
    local environment="$1"
    log_info "Setting up environment: $environment"
    
    # Load environment-specific variables
    if [[ -f "${PROJECT_ROOT}/.env.${environment}" ]]; then
        source "${PROJECT_ROOT}/.env.${environment}"
        log_info "Loaded environment variables from .env.${environment}"
    else
        log_warn "Environment file .env.${environment} not found. Using defaults."
    fi
    
    # Set AWS region based on environment
    case "$environment" in
        development)
            AWS_REGION=${DEV_AWS_REGION:-"us-east-1"}
            DEPLOYMENT_STRATEGY="direct"
            ;;
        staging)
            AWS_REGION=${STAGING_AWS_REGION:-"us-east-1"}
            DEPLOYMENT_STRATEGY="blue-green"
            ;;
        production)
            AWS_REGION=${PROD_AWS_REGION:-"us-east-1"}
            DEPLOYMENT_STRATEGY="canary"
            ;;
    esac
    
    # Export variables for Terraform
    export TF_VAR_environment="$environment"
    export TF_VAR_aws_region="$AWS_REGION"
    
    log_info "Environment setup complete for $environment in region $AWS_REGION"
    return 0
}

run_tests() {
    local component="$1"
    
    if [[ "$SKIP_TESTS" == "true" ]]; then
        log_info "Skipping tests as requested."
        return 0
    fi
    
    log_info "Running tests for $component..."
    
    case "$component" in
        backend|all)
            log_info "Running backend tests..."
            pushd "$BACKEND_SRC_DIR" > /dev/null
            if ! npm test; then
                log_error "Backend tests failed."
                if [[ "$FORCE" != "true" ]]; then
                    popd > /dev/null
                    return 1
                else
                    log_warn "Continuing with deployment despite test failures (--force mode)."
                fi
            fi
            popd > /dev/null
            ;;
        frontend|all)
            log_info "Running frontend tests..."
            pushd "$WEB_SRC_DIR" > /dev/null
            if ! npm test; then
                log_error "Frontend tests failed."
                if [[ "$FORCE" != "true" ]]; then
                    popd > /dev/null
                    return 1
                else
                    log_warn "Continuing with deployment despite test failures (--force mode)."
                fi
            fi
            popd > /dev/null
            ;;
        worker)
            log_info "Running worker tests..."
            pushd "$BACKEND_SRC_DIR" > /dev/null
            if ! npm test; then
                log_error "Worker tests failed."
                if [[ "$FORCE" != "true" ]]; then
                    popd > /dev/null
                    return 1
                else
                    log_warn "Continuing with deployment despite test failures (--force mode)."
                fi
            fi
            popd > /dev/null
            ;;
    esac
    
    log_info "All tests passed successfully."
    return 0
}

build_docker_images() {
    local component="$1"
    local environment="$2"
    
    if [[ "$SKIP_BUILD" == "true" ]]; then
        log_info "Skipping Docker image build as requested."
        return 0
    fi
    
    log_info "Building Docker images for $component in $environment environment..."
    
    # Get version information
    local version=$(git describe --tags --always)
    local commit_hash=$(git rev-parse --short HEAD)
    local build_timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    # Common build arguments
    local build_args=(
        "--build-arg VERSION=$version"
        "--build-arg COMMIT_HASH=$commit_hash"
        "--build-arg BUILD_TIMESTAMP=$build_timestamp"
        "--build-arg NODE_ENV=$environment"
    )
    
    case "$component" in
        backend|all)
            log_info "Building backend image..."
            if ! docker build -f "$BACKEND_DOCKERFILE" \
                 -t "${ECR_REPO_PREFIX}/backend:${version}" \
                 -t "${ECR_REPO_PREFIX}/backend:latest" \
                 ${build_args[@]} \
                 "$PROJECT_ROOT"; then
                log_error "Failed to build backend image."
                return 1
            fi
            ;;
        frontend|all)
            log_info "Building frontend image..."
            if ! docker build -f "$WEB_DOCKERFILE" \
                 -t "${ECR_REPO_PREFIX}/frontend:${version}" \
                 -t "${ECR_REPO_PREFIX}/frontend:latest" \
                 ${build_args[@]} \
                 "$PROJECT_ROOT"; then
                log_error "Failed to build frontend image."
                return 1
            fi
            ;;
        worker)
            log_info "Building worker image..."
            if ! docker build -f "$BACKEND_DOCKERFILE" \
                 -t "${ECR_REPO_PREFIX}/worker:${version}" \
                 -t "${ECR_REPO_PREFIX}/worker:latest" \
                 ${build_args[@]} \
                 --build-arg="APP_TYPE=worker" \
                 "$PROJECT_ROOT"; then
                log_error "Failed to build worker image."
                return 1
            fi
            ;;
    esac
    
    log_info "Docker images built successfully."
    
    # Export version for later use
    export IMAGE_VERSION="$version"
    return 0
}

push_docker_images() {
    local component="$1"
    local environment="$2"
    local version=${IMAGE_VERSION:-$(git describe --tags --always)}
    
    log_info "Pushing Docker images to ECR for $component..."
    
    # Login to ECR
    log_info "Logging in to Amazon ECR..."
    aws ecr get-login-password --region "$AWS_REGION" | \
        docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
    
    # Create repositories if they don't exist
    create_ecr_repository() {
        local repo_name="$1"
        
        if ! aws ecr describe-repositories --repository-names "$repo_name" --region "$AWS_REGION" &> /dev/null; then
            log_info "Creating ECR repository: $repo_name"
            aws ecr create-repository --repository-name "$repo_name" --region "$AWS_REGION" > /dev/null
        fi
    }
    
    # Push specific components
    push_component() {
        local component_name="$1"
        local image_name="${ECR_REPO_PREFIX}/${component_name}"
        local repo_name="${ECR_REPO_PREFIX}-${component_name}-${environment}"
        local ecr_uri="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$repo_name"
        
        create_ecr_repository "$repo_name"
        
        # Tag images for ECR
        log_info "Tagging $image_name:$version for ECR..."
        docker tag "$image_name:$version" "$ecr_uri:$version"
        docker tag "$image_name:$version" "$ecr_uri:latest"
        
        # Push images to ECR
        log_info "Pushing $ecr_uri:$version to ECR..."
        if ! docker push "$ecr_uri:$version"; then
            log_error "Failed to push $ecr_uri:$version to ECR."
            return 1
        fi
        
        log_info "Pushing $ecr_uri:latest to ECR..."
        if ! docker push "$ecr_uri:latest"; then
            log_error "Failed to push $ecr_uri:latest to ECR."
            return 1
        fi
        
        # Export image URI for later use
        export "${component_name^^}_IMAGE_URI=$ecr_uri:$version"
        log_info "$component_name image pushed successfully: $ecr_uri:$version"
    }
    
    case "$component" in
        backend|all)
            push_component "backend"
            ;;
        frontend|all)
            push_component "frontend"
            ;;
        worker|all)
            push_component "worker"
            ;;
    esac
    
    log_info "All images pushed to ECR successfully."
    return 0
}

apply_terraform() {
    local environment="$1"
    
    if [[ "$APPLY_TERRAFORM" != "true" && "$SKIP_TERRAFORM" == "true" ]]; then
        log_info "Skipping Terraform operations as requested."
        return 0
    fi
    
    log_info "Preparing Terraform for $environment environment..."
    
    # Change to Terraform directory
    pushd "$TERRAFORM_DIR" > /dev/null
    
    # Initialize Terraform
    log_info "Initializing Terraform..."
    if ! terraform init; then
        log_error "Failed to initialize Terraform."
        popd > /dev/null
        return 1
    fi
    
    # Select appropriate workspace
    log_info "Selecting $environment workspace..."
    if ! terraform workspace select "$environment" 2>/dev/null; then
        log_info "Workspace $environment does not exist. Creating it..."
        if ! terraform workspace new "$environment"; then
            log_error "Failed to create Terraform workspace: $environment"
            popd > /dev/null
            return 1
        fi
    fi
    
    if [[ "$APPLY_TERRAFORM" == "true" ]]; then
        # Create Terraform plan
        log_info "Creating Terraform plan..."
        if ! terraform plan -out=tfplan; then
            log_error "Failed to create Terraform plan."
            popd > /dev/null
            return 1
        fi
        
        # Apply Terraform plan
        log_info "Applying Terraform plan..."
        if ! terraform apply -auto-approve tfplan; then
            log_error "Failed to apply Terraform plan."
            popd > /dev/null
            return 1
        fi
    else
        log_info "Verifying Terraform state..."
        if ! terraform plan -detailed-exitcode; then
            if [[ $? -eq 2 ]]; then
                log_warn "Terraform changes detected but not applied. Use --apply-terraform to apply changes."
            else
                log_error "Terraform plan failed."
                popd > /dev/null
                return 1
            fi
        fi
    fi
    
    # Extract outputs
    log_info "Extracting Terraform outputs..."
    local tf_outputs
    tf_outputs=$(terraform output -json)
    
    # Store important outputs as environment variables
    export TF_CLUSTER_NAME=$(echo "$tf_outputs" | jq -r '.ecs_cluster_name.value // empty')
    export TF_ALB_DNS=$(echo "$tf_outputs" | jq -r '.alb_dns_name.value // empty')
    export TF_VPC_ID=$(echo "$tf_outputs" | jq -r '.vpc_id.value // empty')
    
    if [[ -z "$TF_CLUSTER_NAME" ]]; then
        log_warn "Could not extract ECS cluster name from Terraform outputs."
    else
        log_info "ECS cluster name: $TF_CLUSTER_NAME"
    fi
    
    if [[ -z "$TF_ALB_DNS" ]]; then
        log_warn "Could not extract ALB DNS name from Terraform outputs."
    else
        log_info "ALB DNS name: $TF_ALB_DNS"
    fi
    
    popd > /dev/null
    log_info "Terraform operations completed successfully."
    return 0
}

update_ecs_services() {
    local component="$1"
    local environment="$2"
    
    log_info "Updating ECS services for $component in $environment environment..."
    
    # Get ECS cluster name
    local cluster_name=${TF_CLUSTER_NAME:-"metronomics-${environment}"}
    
    # Deploy based on deployment strategy
    case "$DEPLOYMENT_STRATEGY" in
        direct)
            log_info "Using direct deployment strategy for $environment..."
            deploy_direct "$component" "$environment" "$cluster_name"
            ;;
        blue-green)
            log_info "Using blue-green deployment strategy for $environment..."
            deploy_blue_green "$component" "$environment" "$cluster_name"
            ;;
        canary)
            log_info "Using canary deployment strategy for $environment..."
            deploy_canary "$component" "$environment" "$cluster_name"
            ;;
        *)
            log_error "Unknown deployment strategy: $DEPLOYMENT_STRATEGY"
            return 1
            ;;
    esac
    
    local result=$?
    if [[ $result -ne 0 ]]; then
        log_error "Deployment failed for $component."
        return 1
    fi
    
    log_info "ECS services updated successfully."
    return 0
}

deploy_direct() {
    local component="$1"
    local environment="$2"
    local cluster_name="$3"
    
    log_info "Performing direct deployment for $component..."
    
    # Get service names based on component
    local services=()
    case "$component" in
        backend|all)
            services+=("metronomics-backend-${environment}")
            ;;
        frontend|all)
            services+=("metronomics-frontend-${environment}")
            ;;
        worker|all)
            services+=("metronomics-worker-${environment}")
            ;;
    esac
    
    # Update each service
    for service in "${services[@]}"; do
        log_info "Updating service: $service"
        
        # Get current task definition
        local task_def_arn
        task_def_arn=$(aws ecs describe-services \
            --cluster "$cluster_name" \
            --services "$service" \
            --region "$AWS_REGION" \
            --query "services[0].taskDefinition" \
            --output text)
        
        if [[ -z "$task_def_arn" || "$task_def_arn" == "null" ]]; then
            log_error "Could not find task definition for service: $service"
            return 1
        fi
        
        # Get current task definition details
        local task_def
        task_def=$(aws ecs describe-task-definition \
            --task-definition "$task_def_arn" \
            --region "$AWS_REGION" \
            --query "taskDefinition")
        
        # Create new task definition with updated image
        local component_name=$(echo "$service" | sed -E "s/metronomics-([^-]+)-${environment}/\1/")
        local image_uri_var="${component_name^^}_IMAGE_URI"
        local image_uri=${!image_uri_var}
        
        if [[ -z "$image_uri" ]]; then
            log_error "Image URI for $component_name is not defined"
            return 1
        fi
        
        log_info "Updating task definition with image: $image_uri"
        
        # Update container image in task definition
        local new_task_def
        new_task_def=$(echo "$task_def" | jq ".containerDefinitions |= map(if .name == \"$component_name\" then .image = \"$image_uri\" else . end)")
        
        # Register new task definition
        local new_task_def_arn
        new_task_def_arn=$(aws ecs register-task-definition \
            --region "$AWS_REGION" \
            --family "$(echo "$task_def" | jq -r '.family')" \
            --execution-role-arn "$(echo "$task_def" | jq -r '.executionRoleArn')" \
            --task-role-arn "$(echo "$task_def" | jq -r '.taskRoleArn // .executionRoleArn')" \
            --network-mode "$(echo "$task_def" | jq -r '.networkMode')" \
            --container-definitions "$(echo "$new_task_def" | jq -c '.containerDefinitions')" \
            --requires-compatibilities "$(echo "$task_def" | jq -r '.requiresCompatibilities[]')" \
            --cpu "$(echo "$task_def" | jq -r '.cpu')" \
            --memory "$(echo "$task_def" | jq -r '.memory')" \
            --query "taskDefinition.taskDefinitionArn" \
            --output text)
        
        if [[ -z "$new_task_def_arn" ]]; then
            log_error "Failed to register new task definition"
            return 1
        fi
        
        log_info "Registered new task definition: $new_task_def_arn"
        
        # Update service to use new task definition
        log_info "Updating service to use new task definition..."
        if ! aws ecs update-service \
            --cluster "$cluster_name" \
            --service "$service" \
            --task-definition "$new_task_def_arn" \
            --region "$AWS_REGION" > /dev/null; then
            log_error "Failed to update service: $service"
            return 1
        fi
        
        # Monitor deployment
        log_info "Monitoring deployment progress..."
        if ! aws ecs wait services-stable \
            --cluster "$cluster_name" \
            --services "$service" \
            --region "$AWS_REGION"; then
            log_error "Deployment did not stabilize within the expected time"
            return 1
        fi
        
        log_info "Service $service updated successfully"
    done
    
    return 0
}

deploy_blue_green() {
    local component="$1"
    local environment="$2"
    local cluster_name="$3"
    
    log_info "Performing blue-green deployment for $component..."
    
    # Get service names based on component
    local services=()
    case "$component" in
        backend|all)
            services+=("metronomics-backend-${environment}")
            ;;
        frontend|all)
            services+=("metronomics-frontend-${environment}")
            ;;
        worker|all)
            services+=("metronomics-worker-${environment}")
            ;;
    esac
    
    # Update each service
    for service in "${services[@]}"; do
        log_info "Setting up blue-green deployment for service: $service"
        
        # Get current task definition and target group
        local task_def_arn
        task_def_arn=$(aws ecs describe-services \
            --cluster "$cluster_name" \
            --services "$service" \
            --region "$AWS_REGION" \
            --query "services[0].taskDefinition" \
            --output text)
        
        if [[ -z "$task_def_arn" || "$task_def_arn" == "null" ]]; then
            log_error "Could not find task definition for service: $service"
            return 1
        fi
        
        # Get current task definition details
        local task_def
        task_def=$(aws ecs describe-task-definition \
            --task-definition "$task_def_arn" \
            --region "$AWS_REGION" \
            --query "taskDefinition")
        
        # Get current target group (blue)
        local service_details
        service_details=$(aws ecs describe-services \
            --cluster "$cluster_name" \
            --services "$service" \
            --region "$AWS_REGION")
        
        local blue_target_group
        blue_target_group=$(echo "$service_details" | jq -r '.services[0].loadBalancers[0].targetGroupArn')
        
        if [[ -z "$blue_target_group" || "$blue_target_group" == "null" ]]; then
            log_error "Could not determine current target group for service: $service"
            return 1
        fi
        
        # Create new (green) target group
        local component_name=$(echo "$service" | sed -E "s/metronomics-([^-]+)-${environment}/\1/")
        local timestamp=$(date +%s)
        local green_target_group_name="${component_name}-green-${timestamp}"
        
        # Get VPC ID
        local vpc_id=${TF_VPC_ID:-$(aws ecs describe-services \
            --cluster "$cluster_name" \
            --services "$service" \
            --region "$AWS_REGION" \
            --query "services[0].networkConfiguration.awsvpcConfiguration.subnets[0]" \
            --output text | xargs -I{} aws ec2 describe-subnets \
            --subnet-ids {} \
            --region "$AWS_REGION" \
            --query "Subnets[0].VpcId" \
            --output text)}
        
        if [[ -z "$vpc_id" || "$vpc_id" == "null" ]]; then
            log_error "Could not determine VPC ID for service: $service"
            return 1
        fi
        
        log_info "Creating green target group: $green_target_group_name in VPC: $vpc_id"
        
        # Create green target group based on blue target group settings
        local blue_target_group_details
        blue_target_group_details=$(aws elbv2 describe-target-groups \
            --target-group-arns "$blue_target_group" \
            --region "$AWS_REGION")
        
        local protocol=$(echo "$blue_target_group_details" | jq -r '.TargetGroups[0].Protocol')
        local port=$(echo "$blue_target_group_details" | jq -r '.TargetGroups[0].Port')
        local target_type=$(echo "$blue_target_group_details" | jq -r '.TargetGroups[0].TargetType')
        
        local green_target_group_arn
        green_target_group_arn=$(aws elbv2 create-target-group \
            --name "$green_target_group_name" \
            --protocol "$protocol" \
            --port "$port" \
            --vpc-id "$vpc_id" \
            --target-type "$target_type" \
            --region "$AWS_REGION" \
            --query "TargetGroups[0].TargetGroupArn" \
            --output text)
        
        if [[ -z "$green_target_group_arn" || "$green_target_group_arn" == "null" ]]; then
            log_error "Failed to create green target group"
            return 1
        fi
        
        log_info "Created green target group: $green_target_group_arn"
        
        # Update health check settings to match blue target group
        local health_check_settings
        health_check_settings=$(echo "$blue_target_group_details" | jq '.TargetGroups[0].HealthCheckSettings')
        
        aws elbv2 modify-target-group-attributes \
            --target-group-arn "$green_target_group_arn" \
            --attributes "$health_check_settings" \
            --region "$AWS_REGION"
        
        # Create new task definition with updated image
        local image_uri_var="${component_name^^}_IMAGE_URI"
        local image_uri=${!image_uri_var}
        
        if [[ -z "$image_uri" ]]; then
            log_error "Image URI for $component_name is not defined"
            return 1
        fi
        
        log_info "Updating task definition with image: $image_uri"
        
        # Update container image in task definition
        local new_task_def
        new_task_def=$(echo "$task_def" | jq ".containerDefinitions |= map(if .name == \"$component_name\" then .image = \"$image_uri\" else . end)")
        
        # Register new task definition
        local new_task_def_arn
        new_task_def_arn=$(aws ecs register-task-definition \
            --region "$AWS_REGION" \
            --family "$(echo "$task_def" | jq -r '.family')" \
            --execution-role-arn "$(echo "$task_def" | jq -r '.executionRoleArn')" \
            --task-role-arn "$(echo "$task_def" | jq -r '.taskRoleArn // .executionRoleArn')" \
            --network-mode "$(echo "$task_def" | jq -r '.networkMode')" \
            --container-definitions "$(echo "$new_task_def" | jq -c '.containerDefinitions')" \
            --requires-compatibilities "$(echo "$task_def" | jq -r '.requiresCompatibilities[]')" \
            --cpu "$(echo "$task_def" | jq -r '.cpu')" \
            --memory "$(echo "$task_def" | jq -r '.memory')" \
            --query "taskDefinition.taskDefinitionArn" \
            --output text)
        
        if [[ -z "$new_task_def_arn" ]]; then
            log_error "Failed to register new task definition"
            return 1
        fi
        
        log_info "Registered new task definition: $new_task_def_arn"
        
        # Create or update green service
        local green_service="${service}-green"
        local green_service_exists
        green_service_exists=$(aws ecs describe-services \
            --cluster "$cluster_name" \
            --services "$green_service" \
            --region "$AWS_REGION" \
            --query "services[?status=='ACTIVE'].status" \
            --output text)
        
        if [[ -n "$green_service_exists" ]]; then
            # Update existing green service
            log_info "Updating existing green service: $green_service"
            aws ecs update-service \
                --cluster "$cluster_name" \
                --service "$green_service" \
                --task-definition "$new_task_def_arn" \
                --load-balancers "targetGroupArn=${green_target_group_arn},containerName=${component_name},containerPort=${port}" \
                --region "$AWS_REGION"
        else
            # Clone blue service configuration for green service
            log_info "Creating new green service: $green_service"
            local blue_service_json
            blue_service_json=$(aws ecs describe-services \
                --cluster "$cluster_name" \
                --services "$service" \
                --region "$AWS_REGION" \
                --query "services[0]")
            
            aws ecs create-service \
                --cluster "$cluster_name" \
                --service-name "$green_service" \
                --task-definition "$new_task_def_arn" \
                --desired-count "$(echo "$blue_service_json" | jq -r '.desiredCount')" \
                --launch-type "$(echo "$blue_service_json" | jq -r '.launchType')" \
                --network-configuration "$(echo "$blue_service_json" | jq -c '.networkConfiguration')" \
                --load-balancers "targetGroupArn=${green_target_group_arn},containerName=${component_name},containerPort=${port}" \
                --region "$AWS_REGION"
        fi
        
        # Wait for green service to be stable
        log_info "Waiting for green service to be stable..."
        if ! aws ecs wait services-stable \
            --cluster "$cluster_name" \
            --services "$green_service" \
            --region "$AWS_REGION"; then
            log_error "Green service did not stabilize within the expected time"
            return 1
        fi
        
        # Get the load balancer ARN
        local load_balancer_arn
        load_balancer_arn=$(aws elbv2 describe-target-groups \
            --target-group-arns "$blue_target_group" \
            --region "$AWS_REGION" \
            --query "TargetGroups[0].LoadBalancerArns[0]" \
            --output text)
        
        if [[ -z "$load_balancer_arn" || "$load_balancer_arn" == "null" ]]; then
            log_error "Could not determine load balancer ARN"
            return 1
        fi
        
        # Find the listener ARN
        local listener_arn
        listener_arn=$(aws elbv2 describe-listeners \
            --load-balancer-arn "$load_balancer_arn" \
            --region "$AWS_REGION" \
            --query "Listeners[?Port==\`${port}\`].ListenerArn" \
            --output text)
        
        if [[ -z "$listener_arn" || "$listener_arn" == "null" ]]; then
            log_error "Could not determine listener ARN"
            return 1
        fi
        
        # Perform test traffic routing (10%)
        log_info "Routing 10% of traffic to green environment for testing..."
        local rules
        rules=$(aws elbv2 describe-rules \
            --listener-arn "$listener_arn" \
            --region "$AWS_REGION" \
            --query "Rules[?Actions[0].TargetGroupArn=='${blue_target_group}']")
        
        # Modify the rules to split traffic
        aws elbv2 modify-rule \
            --rule-arn "$(echo "$rules" | jq -r '.[0].RuleArn')" \
            --actions "[{\"Type\":\"forward\",\"ForwardConfig\":{\"TargetGroups\":[{\"TargetGroupArn\":\"${blue_target_group}\",\"Weight\":90},{\"TargetGroupArn\":\"${green_target_group_arn}\",\"Weight\":10}]}}]" \
            --region "$AWS_REGION"
        
        # Run smoke tests against green environment
        log_info "Running smoke tests against green environment..."
        local smoke_test_result=0
        if ! verify_deployment "$component" "$environment" "$green_target_group_arn"; then
            log_error "Smoke tests failed against green environment"
            smoke_test_result=1
        fi
        
        if [[ $smoke_test_result -eq 0 ]]; then
            # Complete cutover if tests pass
            log_info "Smoke tests passed. Completing cutover to green environment..."
            
            # Modify rules to direct all traffic to green
            aws elbv2 modify-rule \
                --rule-arn "$(echo "$rules" | jq -r '.[0].RuleArn')" \
                --actions "[{\"Type\":\"forward\",\"ForwardConfig\":{\"TargetGroups\":[{\"TargetGroupArn\":\"${green_target_group_arn}\",\"Weight\":100}]}}]" \
                --region "$AWS_REGION"
            
            # Update blue service to use new task definition
            log_info "Updating blue service with new task definition..."
            aws ecs update-service \
                --cluster "$cluster_name" \
                --service "$service" \
                --task-definition "$new_task_def_arn" \
                --load-balancers "targetGroupArn=${blue_target_group},containerName=${component_name},containerPort=${port}" \
                --region "$AWS_REGION"
            
            # Wait for blue service to be stable
            aws ecs wait services-stable \
                --cluster "$cluster_name" \
                --services "$service" \
                --region "$AWS_REGION"
            
            # Delete green service
            log_info "Deleting temporary green service..."
            aws ecs update-service \
                --cluster "$cluster_name" \
                --service "$green_service" \
                --desired-count 0 \
                --region "$AWS_REGION"
            
            aws ecs delete-service \
                --cluster "$cluster_name" \
                --service "$green_service" \
                --force \
                --region "$AWS_REGION"
            
            # Reset load balancer rules
            aws elbv2 modify-rule \
                --rule-arn "$(echo "$rules" | jq -r '.[0].RuleArn')" \
                --actions "[{\"Type\":\"forward\",\"ForwardConfig\":{\"TargetGroups\":[{\"TargetGroupArn\":\"${blue_target_group}\",\"Weight\":100}]}}]" \
                --region "$AWS_REGION"
            
            # Delete green target group
            aws elbv2 delete-target-group \
                --target-group-arn "$green_target_group_arn" \
                --region "$AWS_REGION"
            
            log_info "Blue-green deployment completed successfully for $service"
        else
            # Rollback if tests fail
            log_error "Rolling back to blue environment due to test failures..."
            
            # Reset load balancer rules to blue only
            aws elbv2 modify-rule \
                --rule-arn "$(echo "$rules" | jq -r '.[0].RuleArn')" \
                --actions "[{\"Type\":\"forward\",\"ForwardConfig\":{\"TargetGroups\":[{\"TargetGroupArn\":\"${blue_target_group}\",\"Weight\":100}]}}]" \
                --region "$AWS_REGION"
            
            # Delete green service
            aws ecs update-service \
                --cluster "$cluster_name" \
                --service "$green_service" \
                --desired-count 0 \
                --region "$AWS_REGION"
            
            aws ecs delete-service \
                --cluster "$cluster_name" \
                --service "$green_service" \
                --force \
                --region "$AWS_REGION"
            
            # Delete green target group
            aws elbv2 delete-target-group \
                --target-group-arn "$green_target_group_arn" \
                --region "$AWS_REGION"
            
            log_error "Blue-green deployment failed and was rolled back for $service"
            return 1
        fi
    done
    
    return 0
}

deploy_canary() {
    local component="$1"
    local environment="$2"
    local cluster_name="$3"
    
    log_info "Performing canary deployment for $component..."
    
    # Get service names based on component
    local services=()
    case "$component" in
        backend|all)
            services+=("metronomics-backend-${environment}")
            ;;
        frontend|all)
            services+=("metronomics-frontend-${environment}")
            ;;
        worker|all)
            services+=("metronomics-worker-${environment}")
            ;;
    esac
    
    # Update each service
    for service in "${services[@]}"; do
        log_info "Setting up canary deployment for service: $service"
        
        # Get current task definition and load balancer configuration
        local task_def_arn
        task_def_arn=$(aws ecs describe-services \
            --cluster "$cluster_name" \
            --services "$service" \
            --region "$AWS_REGION" \
            --query "services[0].taskDefinition" \
            --output text)
        
        if [[ -z "$task_def_arn" || "$task_def_arn" == "null" ]]; then
            log_error "Could not find task definition for service: $service"
            return 1
        fi
        
        # Get current task definition details
        local task_def
        task_def=$(aws ecs describe-task-definition \
            --task-definition "$task_def_arn" \
            --region "$AWS_REGION" \
            --query "taskDefinition")
        
        # Get service details
        local service_details
        service_details=$(aws ecs describe-services \
            --cluster "$cluster_name" \
            --services "$service" \
            --region "$AWS_REGION")
        
        local target_group_arn
        target_group_arn=$(echo "$service_details" | jq -r '.services[0].loadBalancers[0].targetGroupArn')
        
        if [[ -z "$target_group_arn" || "$target_group_arn" == "null" ]]; then
            log_error "Could not determine target group for service: $service"
            return 1
        fi
        
        # Get load balancer details
        local load_balancer_arn
        load_balancer_arn=$(aws elbv2 describe-target-groups \
            --target-group-arns "$target_group_arn" \
            --region "$AWS_REGION" \
            --query "TargetGroups[0].LoadBalancerArns[0]" \
            --output text)
        
        if [[ -z "$load_balancer_arn" || "$load_balancer_arn" == "null" ]]; then
            log_error "Could not determine load balancer ARN"
            return 1
        fi
        
        # Create new task definition with updated image
        local component_name=$(echo "$service" | sed -E "s/metronomics-([^-]+)-${environment}/\1/")
        local image_uri_var="${component_name^^}_IMAGE_URI"
        local image_uri=${!image_uri_var}
        
        if [[ -z "$image_uri" ]]; then
            log_error "Image URI for $component_name is not defined"
            return 1
        fi
        
        log_info "Updating task definition with image: $image_uri"
        
        # Update container image in task definition
        local new_task_def
        new_task_def=$(echo "$task_def" | jq ".containerDefinitions |= map(if .name == \"$component_name\" then .image = \"$image_uri\" else . end)")
        
        # Register new task definition
        local new_task_def_arn
        new_task_def_arn=$(aws ecs register-task-definition \
            --region "$AWS_REGION" \
            --family "$(echo "$task_def" | jq -r '.family')" \
            --execution-role-arn "$(echo "$task_def" | jq -r '.executionRoleArn')" \
            --task-role-arn "$(echo "$task_def" | jq -r '.taskRoleArn // .executionRoleArn')" \
            --network-mode "$(echo "$task_def" | jq -r '.networkMode')" \
            --container-definitions "$(echo "$new_task_def" | jq -c '.containerDefinitions')" \
            --requires-compatibilities "$(echo "$task_def" | jq -r '.requiresCompatibilities[]')" \
            --cpu "$(echo "$task_def" | jq -r '.cpu')" \
            --memory "$(echo "$task_def" | jq -r '.memory')" \
            --query "taskDefinition.taskDefinitionArn" \
            --output text)
        
        if [[ -z "$new_task_def_arn" ]]; then
            log_error "Failed to register new task definition"
            return 1
        fi
        
        log_info "Registered new task definition: $new_task_def_arn"
        
        # Create canary service
        local canary_service="${service}-canary"
        local canary_target_group_name="${component_name}-canary-$(date +%s)"
        
        # Get VPC ID
        local vpc_id=${TF_VPC_ID:-$(aws ecs describe-services \
            --cluster "$cluster_name" \
            --services "$service" \
            --region "$AWS_REGION" \
            --query "services[0].networkConfiguration.awsvpcConfiguration.subnets[0]" \
            --output text | xargs -I{} aws ec2 describe-subnets \
            --subnet-ids {} \
            --region "$AWS_REGION" \
            --query "Subnets[0].VpcId" \
            --output text)}
        
        if [[ -z "$vpc_id" || "$vpc_id" == "null" ]]; then
            log_error "Could not determine VPC ID for service: $service"
            return 1
        fi
        
        # Create canary target group
        log_info "Creating canary target group: $canary_target_group_name"
        local target_group_details
        target_group_details=$(aws elbv2 describe-target-groups \
            --target-group-arns "$target_group_arn" \
            --region "$AWS_REGION")
        
        local protocol=$(echo "$target_group_details" | jq -r '.TargetGroups[0].Protocol')
        local port=$(echo "$target_group_details" | jq -r '.TargetGroups[0].Port')
        local target_type=$(echo "$target_group_details" | jq -r '.TargetGroups[0].TargetType')
        
        local canary_target_group_arn
        canary_target_group_arn=$(aws elbv2 create-target-group \
            --name "$canary_target_group_name" \
            --protocol "$protocol" \
            --port "$port" \
            --vpc-id "$vpc_id" \
            --target-type "$target_type" \
            --region "$AWS_REGION" \
            --query "TargetGroups[0].TargetGroupArn" \
            --output text)
        
        if [[ -z "$canary_target_group_arn" || "$canary_target_group_arn" == "null" ]]; then
            log_error "Failed to create canary target group"
            return 1
        fi
        
        # Update health check settings to match original target group
        local health_check_settings
        health_check_settings=$(echo "$target_group_details" | jq '.TargetGroups[0].HealthCheckSettings')
        
        aws elbv2 modify-target-group-attributes \
            --target-group-arn "$canary_target_group_arn" \
            --attributes "$health_check_settings" \
            --region "$AWS_REGION"
        
        # Create or update canary service
        local canary_service_exists
        canary_service_exists=$(aws ecs describe-services \
            --cluster "$cluster_name" \
            --services "$canary_service" \
            --region "$AWS_REGION" \
            --query "services[?status=='ACTIVE'].status" \
            --output text)
        
        if [[ -n "$canary_service_exists" ]]; then
            # Update existing canary service
            log_info "Updating existing canary service: $canary_service"
            aws ecs update-service \
                --cluster "$cluster_name" \
                --service "$canary_service" \
                --task-definition "$new_task_def_arn" \
                --load-balancers "targetGroupArn=${canary_target_group_arn},containerName=${component_name},containerPort=${port}" \
                --region "$AWS_REGION"
        else
            # Clone original service configuration for canary service
            log_info "Creating new canary service: $canary_service"
            local original_service_json
            original_service_json=$(aws ecs describe-services \
                --cluster "$cluster_name" \
                --services "$service" \
                --region "$AWS_REGION" \
                --query "services[0]")
            
            # Set canary desired count to 10% of original
            local original_count=$(echo "$original_service_json" | jq -r '.desiredCount')
            local canary_count=$(( original_count / 10 ))
            if [[ $canary_count -lt 1 ]]; then
                canary_count=1
            fi
            
            aws ecs create-service \
                --cluster "$cluster_name" \
                --service-name "$canary_service" \
                --task-definition "$new_task_def_arn" \
                --desired-count "$canary_count" \
                --launch-type "$(echo "$original_service_json" | jq -r '.launchType')" \
                --network-configuration "$(echo "$original_service_json" | jq -c '.networkConfiguration')" \
                --load-balancers "targetGroupArn=${canary_target_group_arn},containerName=${component_name},containerPort=${port}" \
                --region "$AWS_REGION"
        fi
        
        # Wait for canary service to be stable
        log_info "Waiting for canary service to be stable..."
        if ! aws ecs wait services-stable \
            --cluster "$cluster_name" \
            --services "$canary_service" \
            --region "$AWS_REGION"; then
            log_error "Canary service did not stabilize within the expected time"
            return 1
        fi
        
        # Find the listener ARN
        local listener_arn
        listener_arn=$(aws elbv2 describe-listeners \
            --load-balancer-arn "$load_balancer_arn" \
            --region "$AWS_REGION" \
            --query "Listeners[?Port==\`${port}\`].ListenerArn" \
            --output text)
        
        if [[ -z "$listener_arn" || "$listener_arn" == "null" ]]; then
            log_error "Could not determine listener ARN"
            return 1
        fi
        
        # Find the default rule
        local rules
        rules=$(aws elbv2 describe-rules \
            --listener-arn "$listener_arn" \
            --region "$AWS_REGION" \
            --query "Rules[?Actions[0].TargetGroupArn=='${target_group_arn}']")
        
        # Start canary with 10% traffic
        log_info "Routing 10% of traffic to canary deployment..."
        aws elbv2 modify-rule \
            --rule-arn "$(echo "$rules" | jq -r '.[0].RuleArn')" \
            --actions "[{\"Type\":\"forward\",\"ForwardConfig\":{\"TargetGroups\":[{\"TargetGroupArn\":\"${target_group_arn}\",\"Weight\":90},{\"TargetGroupArn\":\"${canary_target_group_arn}\",\"Weight\":10}]}}]" \
            --region "$AWS_REGION"
        
        # Monitor canary metrics for 5 minutes
        log_info "Monitoring canary deployment for 5 minutes..."
        local monitoring_result=0
        
        # Check CloudWatch metrics for canary service
        for i in {1..5}; do
            log_info "Canary monitoring: minute $i of 5..."
            sleep 60
            
            # Check error rates and other metrics
            local canary_errors
            canary_errors=$(aws cloudwatch get-metric-statistics \
                --namespace "AWS/ApplicationELB" \
                --metric-name "HTTPCode_Target_5XX_Count" \
                --dimensions "Name=TargetGroup,Value=$(echo $canary_target_group_arn | cut -d/ -f2)" "Name=LoadBalancer,Value=$(echo $load_balancer_arn | cut -d/ -f3)" \
                --start-time "$(date -u -v-5M +"%Y-%m-%dT%H:%M:%SZ")" \
                --end-time "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
                --period 300 \
                --statistics Sum \
                --region "$AWS_REGION" \
                --query "Datapoints[0].Sum" \
                --output text)
            
            if [[ -z "$canary_errors" ]]; then
                canary_errors=0
            fi
            
            if (( $(echo "$canary_errors > 5" | bc -l) )); then
                log_error "Canary deployment has too many errors: $canary_errors 5xx errors"
                monitoring_result=1
                break
            fi
            
            # Also check for successful response
            if ! verify_deployment "$component" "$environment" "$canary_target_group_arn" "silent"; then
                log_error "Canary deployment health check failed"
                monitoring_result=1
                break
            fi
        done
        
        if [[ $monitoring_result -eq 0 ]]; then
            # Increase to 50% traffic if initial monitoring is good
            log_info "Initial canary metrics look good. Increasing to 50% traffic..."
            aws elbv2 modify-rule \
                --rule-arn "$(echo "$rules" | jq -r '.[0].RuleArn')" \
                --actions "[{\"Type\":\"forward\",\"ForwardConfig\":{\"TargetGroups\":[{\"TargetGroupArn\":\"${target_group_arn}\",\"Weight\":50},{\"TargetGroupArn\":\"${canary_target_group_arn}\",\"Weight\":50}]}}]" \
                --region "$AWS_REGION"
            
            # Update canary service to 50% capacity
            local original_count=$(aws ecs describe-services \
                --cluster "$cluster_name" \
                --services "$service" \
                --region "$AWS_REGION" \
                --query "services[0].desiredCount" \
                --output text)
            
            local canary_count=$(( original_count / 2 ))
            if [[ $canary_count -lt 1 ]]; then
                canary_count=1
            fi
            
            aws ecs update-service \
                --cluster "$cluster_name" \
                --service "$canary_service" \
                --desired-count "$canary_count" \
                --region "$AWS_REGION"
            
            # Monitor again for 5 minutes
            log_info "Monitoring 50% canary deployment for 5 minutes..."
            local monitoring_result=0
            
            for i in {1..5}; do
                log_info "Canary monitoring (50%): minute $i of 5..."
                sleep 60
                
                # Check error rates and other metrics
                local canary_errors
                canary_errors=$(aws cloudwatch get-metric-statistics \
                    --namespace "AWS/ApplicationELB" \
                    --metric-name "HTTPCode_Target_5XX_Count" \
                    --dimensions "Name=TargetGroup,Value=$(echo $canary_target_group_arn | cut -d/ -f2)" "Name=LoadBalancer,Value=$(echo $load_balancer_arn | cut -d/ -f3)" \
                    --start-time "$(date -u -v-5M +"%Y-%m-%dT%H:%M:%SZ")" \
                    --end-time "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
                    --period 300 \
                    --statistics Sum \
                    --region "$AWS_REGION" \
                    --query "Datapoints[0].Sum" \
                    --output text)
                
                if [[ -z "$canary_errors" ]]; then
                    canary_errors=0
                fi
                
                if (( $(echo "$canary_errors > 5" | bc -l) )); then
                    log_error "Canary deployment has too many errors: $canary_errors 5xx errors"
                    monitoring_result=1
                    break
                fi
                
                # Also check for successful response
                if ! verify_deployment "$component" "$environment" "$canary_target_group_arn" "silent"; then
                    log_error "Canary deployment health check failed"
                    monitoring_result=1
                    break
                fi
            done
            
            if [[ $monitoring_result -eq 0 ]]; then
                # Complete deployment if all monitoring passes
                log_info "Canary metrics look good. Completing deployment..."
                
                # Update main service to use new task definition
                aws ecs update-service \
                    --cluster "$cluster_name" \
                    --service "$service" \
                    --task-definition "$new_task_def_arn" \
                    --region "$AWS_REGION"
                
                # Reset load balancer to main service only
                aws elbv2 modify-rule \
                    --rule-arn "$(echo "$rules" | jq -r '.[0].RuleArn')" \
                    --actions "[{\"Type\":\"forward\",\"ForwardConfig\":{\"TargetGroups\":[{\"TargetGroupArn\":\"${target_group_arn}\",\"Weight\":100}]}}]" \
                    --region "$AWS_REGION"
                
                # Wait for main service to be stable
                log_info "Waiting for main service to be stable with new version..."
                if ! aws ecs wait services-stable \
                    --cluster "$cluster_name" \
                    --services "$service" \
                    --region "$AWS_REGION"; then
                    log_error "Main service did not stabilize within the expected time"
                    return 1
                fi
                
                # Clean up canary resources
                log_info "Cleaning up canary resources..."
                aws ecs update-service \
                    --cluster "$cluster_name" \
                    --service "$canary_service" \
                    --desired-count 0 \
                    --region "$AWS_REGION"
                
                aws ecs delete-service \
                    --cluster "$cluster_name" \
                    --service "$canary_service" \
                    --force \
                    --region "$AWS_REGION"
                
                aws elbv2 delete-target-group \
                    --target-group-arn "$canary_target_group_arn" \
                    --region "$AWS_REGION"
                
                log_info "Canary deployment completed successfully for $service"
            else
                # Rollback if 50% monitoring fails
                log_error "Canary deployment failed at 50% phase. Rolling back..."
                
                # Reset load balancer to main service only
                aws elbv2 modify-rule \
                    --rule-arn "$(echo "$rules" | jq -r '.[0].RuleArn')" \
                    --actions "[{\"Type\":\"forward\",\"ForwardConfig\":{\"TargetGroups\":[{\"TargetGroupArn\":\"${target_group_arn}\",\"Weight\":100}]}}]" \
                    --region "$AWS_REGION"
                
                # Clean up canary resources
                aws ecs update-service \
                    --cluster "$cluster_name" \
                    --service "$canary_service" \
                    --desired-count 0 \
                    --region "$AWS_REGION"
                
                aws ecs delete-service \
                    --cluster "$cluster_name" \
                    --service "$canary_service" \
                    --force \
                    --region "$AWS_REGION"
                
                aws elbv2 delete-target-group \
                    --target-group-arn "$canary_target_group_arn" \
                    --region "$AWS_REGION"
                
                log_error "Canary deployment failed and was rolled back for $service"
                return 1
            fi
        else
            # Rollback if initial monitoring fails
            log_error "Canary deployment failed at 10% phase. Rolling back..."
            
            # Reset load balancer to main service only
            aws elbv2 modify-rule \
                --rule-arn "$(echo "$rules" | jq -r '.[0].RuleArn')" \
                --actions "[{\"Type\":\"forward\",\"ForwardConfig\":{\"TargetGroups\":[{\"TargetGroupArn\":\"${target_group_arn}\",\"Weight\":100}]}}]" \
                --region "$AWS_REGION"
            
            # Clean up canary resources
            aws ecs update-service \
                --cluster "$cluster_name" \
                --service "$canary_service" \
                --desired-count 0 \
                --region "$AWS_REGION"
            
            aws ecs delete-service \
                --cluster "$cluster_name" \
                --service "$canary_service" \
                --force \
                --region "$AWS_REGION"
            
            aws elbv2 delete-target-group \
                --target-group-arn "$canary_target_group_arn" \
                --region "$AWS_REGION"
            
            log_error "Canary deployment failed and was rolled back for $service"
            return 1
        fi
    done
    
    return 0
}

verify_deployment() {
    local component="$1"
    local environment="$2"
    local target_group_arn="${3:-}"
    local silent="${4:-}"
    
    if [[ "$silent" != "silent" ]]; then
        log_info "Verifying deployment for $component in $environment environment..."
    fi
    
    # Get endpoint from load balancer if not using specific target group
    local endpoint
    if [[ -z "$target_group_arn" ]]; then
        endpoint=${TF_ALB_DNS:-"metronomics-$environment.example.com"}
    else
        # Get load balancer DNS from target group
        local load_balancer_arn
        load_balancer_arn=$(aws elbv2 describe-target-groups \
            --target-group-arns "$target_group_arn" \
            --region "$AWS_REGION" \
            --query "TargetGroups[0].LoadBalancerArns[0]" \
            --output text)
        
        endpoint=$(aws elbv2 describe-load-balancers \
            --load-balancer-arns "$load_balancer_arn" \
            --region "$AWS_REGION" \
            --query "LoadBalancers[0].DNSName" \
            --output text)
    fi
    
    if [[ -z "$endpoint" || "$endpoint" == "null" ]]; then
        log_error "Could not determine endpoint for verification"
        return 1
    fi
    
    # Define health check paths based on component
    local health_check_paths=()
    case "$component" in
        backend|all)
            health_check_paths+=("/api/health")
            ;;
        frontend|all)
            health_check_paths+=("/")
            ;;
        worker)
            # Workers don't typically have health endpoints exposed directly
            health_check_paths+=("/")
            ;;
    esac
    
    # Perform health checks
    local success=0
    for path in "${health_check_paths[@]}"; do
        local max_retries=${HEALTH_CHECK_RETRIES}
        local retry_interval=${HEALTH_CHECK_INTERVAL}
        local retries=0
        
        while [[ $retries -lt $max_retries ]]; do
            if [[ "$silent" != "silent" ]]; then
                log_info "Checking health endpoint: $endpoint$path (attempt $((retries+1))/$max_retries)"
            fi
            
            local status_code
            status_code=$(curl -s -o /dev/null -w "%{http_code}" "http://$endpoint$path")
            
            if [[ "$status_code" =~ ^(200|301|302)$ ]]; then
                if [[ "$silent" != "silent" ]]; then
                    log_info "Health check passed: $endpoint$path returned $status_code"
                fi
                success=1
                break
            else
                if [[ "$silent" != "silent" ]]; then
                    log_warn "Health check failed: $endpoint$path returned $status_code. Retrying in $retry_interval seconds..."
                fi
                sleep $retry_interval
                retries=$((retries+1))
            fi
        done
        
        if [[ $success -eq 0 ]]; then
            log_error "Health check failed after $max_retries attempts: $endpoint$path"
            return 1
        fi
    done
    
    if [[ "$silent" != "silent" ]]; then
        log_info "Deployment verification successful for $component"
    fi
    return 0
}

rollback_deployment() {
    local component="$1"
    local environment="$2"
    
    log_info "Rolling back deployment for $component in $environment environment..."
    
    # Get ECS cluster name
    local cluster_name=${TF_CLUSTER_NAME:-"metronomics-${environment}"}
    
    # Get service names based on component
    local services=()
    case "$component" in
        backend|all)
            services+=("metronomics-backend-${environment}")
            ;;
        frontend|all)
            services+=("metronomics-frontend-${environment}")
            ;;
        worker|all)
            services+=("metronomics-worker-${environment}")
            ;;
    esac
    
    # Rollback each service
    for service in "${services[@]}"; do
        log_info "Rolling back service: $service"
        
        # Get current task definition
        local current_task_def_arn
        current_task_def_arn=$(aws ecs describe-services \
            --cluster "$cluster_name" \
            --services "$service" \
            --region "$AWS_REGION" \
            --query "services[0].taskDefinition" \
            --output text)
        
        if [[ -z "$current_task_def_arn" || "$current_task_def_arn" == "null" ]]; then
            log_error "Could not find current task definition for service: $service"
            continue
        fi
        
        # Get task definition family
        local task_def_family
        task_def_family=$(aws ecs describe-task-definition \
            --task-definition "$current_task_def_arn" \
            --region "$AWS_REGION" \
            --query "taskDefinition.family" \
            --output text)
        
        # List previous task definitions
        local task_def_arns
        task_def_arns=$(aws ecs list-task-definitions \
            --family-prefix "$task_def_family" \
            --sort DESC \
            --region "$AWS_REGION" \
            --query "taskDefinitionArns" \
            --output text)
        
        # Find previous stable task definition
        local previous_task_def_arn
        local found_current=false
        
        for arn in $task_def_arns; do
            if [[ "$found_current" == "true" ]]; then
                previous_task_def_arn=$arn
                break
            fi
            
            if [[ "$arn" == "$current_task_def_arn" ]]; then
                found_current=true
            fi
        done
        
        if [[ -z "$previous_task_def_arn" ]]; then
            log_error "Could not find previous task definition for rollback"
            continue
        fi
        
        log_info "Rolling back to previous task definition: $previous_task_def_arn"
        
        # Update service to use previous task definition
        if ! aws ecs update-service \
            --cluster "$cluster_name" \
            --service "$service" \
            --task-definition "$previous_task_def_arn" \
            --region "$AWS_REGION" > /dev/null; then
            log_error "Failed to update service for rollback: $service"
            continue
        fi
        
        # Monitor rollback
        log_info "Monitoring rollback progress..."
        if ! aws ecs wait services-stable \
            --cluster "$cluster_name" \
            --services "$service" \
            --region "$AWS_REGION"; then
            log_error "Rollback did not stabilize within the expected time"
            continue
        fi
        
        log_info "Rollback completed successfully for service: $service"
    done
    
    return 0
}

update_documentation() {
    local environment="$1"
    local version="$2"
    
    log_info "Updating deployment documentation for $environment ($version)..."
    
    local docs_dir="${PROJECT_ROOT}/docs/deployments"
    local changelog_file="${docs_dir}/changelog.md"
    local history_file="${docs_dir}/${environment}_deployment_history.md"
    
    # Create directories if they don't exist
    mkdir -p "$docs_dir"
    
    # Generate changelog
    local last_tag=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
    local changelog
    
    if [[ -n "$last_tag" ]]; then
        changelog=$(git log --pretty=format:"- %s (%h)" ${last_tag}..HEAD)
    else
        changelog=$(git log --pretty=format:"- %s (%h)" -n 20)
    fi
    
    # Update changelog file
    echo "# Changelog" > "$changelog_file"
    echo "" >> "$changelog_file"
    echo "## Version: $version - $(date '+%Y-%m-%d %H:%M:%S')" >> "$changelog_file"
    echo "" >> "$changelog_file"
    echo "$changelog" >> "$changelog_file"
    
    # Update deployment history
    if [[ ! -f "$history_file" ]]; then
        echo "# $environment Deployment History" > "$history_file"
        echo "" >> "$history_file"
    fi
    
    # Add deployment entry
    echo "## Deployment: $version - $(date '+%Y-%m-%d %H:%M:%S')" >> "$history_file"
    echo "" >> "$history_file"
    echo "Components: $COMPONENT" >> "$history_file"
    echo "Deployed by: $(whoami)" >> "$history_file"
    echo "" >> "$history_file"
    echo "### Changes" >> "$history_file"
    echo "" >> "$history_file"
    echo "$changelog" >> "$history_file"
    echo "" >> "$history_file"
    
    log_info "Deployment documentation updated"
    return 0
}

send_deployment_notification() {
    local status="$1"
    local environment="$2"
    local component="$3"
    local message="$4"
    
    log_info "Sending $status notification for $component deployment to $environment..."
    
    # Determine SNS topic based on environment
    local sns_topic_arn
    case "$environment" in
        development)
            sns_topic_arn=${DEV_SNS_TOPIC_ARN:-""}
            ;;
        staging)
            sns_topic_arn=${STAGING_SNS_TOPIC_ARN:-""}
            ;;
        production)
            sns_topic_arn=${PROD_SNS_TOPIC_ARN:-""}
            ;;
    esac
    
    if [[ -z "$sns_topic_arn" ]]; then
        log_warn "SNS topic ARN not defined for $environment. Skipping notification."
        return 0
    fi
    
    # Prepare notification message
    local notification_subject="[$status] Metronomics $environment deployment: $component"
    local notification_message="Deployment Status: $status
Environment: $environment
Component: $component
Version: ${IMAGE_VERSION:-unknown}
Timestamp: $(date '+%Y-%m-%d %H:%M:%S')
Deployed by: $(whoami)

$message"
    
    # Send SNS notification
    aws sns publish \
        --topic-arn "$sns_topic_arn" \
        --subject "$notification_subject" \
        --message "$notification_message" \
        --region "$AWS_REGION"
    
    log_info "Deployment notification sent"
    return 0
}

# Main function
main() {
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
    
    # Run tests if not skipped
    if [[ "$SKIP_TESTS" != "true" ]]; then
        if ! run_tests "$COMPONENT"; then
            log_error "Tests failed. Deployment aborted."
            return 1
        fi
    fi
    
    # Apply Terraform if specified
    if [[ "$APPLY_TERRAFORM" == "true" || "$SKIP_TERRAFORM" != "true" ]]; then
        if ! apply_terraform "$ENVIRONMENT"; then
            log_error "Terraform operation failed. Deployment aborted."
            return 1
        fi
    fi
    
    # Build Docker images if not skipped
    if [[ "$SKIP_BUILD" != "true" ]]; then
        if ! build_docker_images "$COMPONENT" "$ENVIRONMENT"; then
            log_error "Docker image build failed. Deployment aborted."
            return 1
        fi
    fi
    
    # Push Docker images to ECR
    if ! push_docker_images "$COMPONENT" "$ENVIRONMENT"; then
        log_error "Docker image push failed. Deployment aborted."
        return 1
    fi
    
    # Update ECS services
    if ! update_ecs_services "$COMPONENT" "$ENVIRONMENT"; then
        log_error "ECS service update failed. Attempting rollback..."
        rollback_deployment "$COMPONENT" "$ENVIRONMENT"
        send_deployment_notification "FAILED" "$ENVIRONMENT" "$COMPONENT" "Deployment failed during service update. Rollback initiated."
        return 1
    fi
    
    # Verify deployment
    if ! verify_deployment "$COMPONENT" "$ENVIRONMENT"; then
        log_error "Deployment verification failed. Attempting rollback..."
        rollback_deployment "$COMPONENT" "$ENVIRONMENT"
        send_deployment_notification "FAILED" "$ENVIRONMENT" "$COMPONENT" "Deployment failed during verification. Rollback initiated."
        return 1
    fi
    
    # Update documentation
    update_documentation "$ENVIRONMENT" "${IMAGE_VERSION:-unknown}"
    
    # Send success notification
    send_deployment_notification "SUCCESS" "$ENVIRONMENT" "$COMPONENT" "Deployment completed successfully."
    
    log_info "Deployment completed successfully!"
    return 0
}

# Execute main function with all script arguments
main "$@"
exit $?