# Backend configuration for Terraform state management

# This backend configuration uses S3 for state storage and DynamoDB for state locking
terraform {
  backend "s3" {
    bucket         = "" # S3 bucket name for storing Terraform state files
    key            = "" # Path within the S3 bucket where the Terraform state file will be stored
    region         = "" # AWS region where the S3 bucket and DynamoDB table are located
    dynamodb_table = "" # DynamoDB table name for Terraform state locking
    encrypt        = true # Enable encryption for the Terraform state file in S3
    profile        = "" # AWS profile to use for authentication when accessing the backend resources
  }
}

# The actual values for these parameters are provided via environment-specific backend.tfvars files

# Usage examples:
# Development: terraform init -backend-config=environments/dev/backend.tfvars
# Staging: terraform init -backend-config=environments/staging/backend.tfvars
# Production: terraform init -backend-config=environments/prod/backend.tfvars