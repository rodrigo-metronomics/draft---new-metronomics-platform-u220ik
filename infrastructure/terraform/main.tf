# Main Terraform configuration for Metronomics Platform
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

# Configure the AWS Provider for the primary region
provider "aws" {
  region = var.aws_region
}

# Configure the AWS Provider for the secondary region (DR)
provider "aws" {
  alias  = "secondary"
  region = var.secondary_aws_region
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Local values
locals {
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
  
  is_production = var.environment == "prod"
  enable_disaster_recovery = lookup(var.enable_dr, var.environment, false)
}

# Networking module for primary region
module "networking" {
  source = "./modules/networking"
  
  environment         = var.environment
  project_name        = var.project_name
  vpc_cidr            = var.vpc_cidr
  aws_region          = var.aws_region
  availability_zones  = var.availability_zones
  trusted_ip_ranges   = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
}

# Networking module for secondary region (DR)
module "networking_dr" {
  count  = local.enable_disaster_recovery ? 1 : 0
  source = "./modules/networking"
  
  providers = {
    aws = aws.secondary
  }
  
  environment         = var.environment
  project_name        = var.project_name
  vpc_cidr            = var.vpc_cidr_secondary
  aws_region          = var.secondary_aws_region
  availability_zones  = var.availability_zones
  trusted_ip_ranges   = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
}

# Database module for primary region
module "database" {
  source = "./modules/database"
  
  environment         = var.environment
  project_name        = var.project_name
  subnet_ids          = module.networking.private_data_subnet_ids
  security_group_id   = module.networking.db_security_group_id
  aws_region          = var.aws_region
  
  db_instance_class    = var.db_instance_class
  db_multi_az          = var.db_multi_az
  db_allocated_storage = var.db_allocated_storage
  db_name              = var.db_name
  db_username          = var.db_username
  db_password          = var.db_password
  backup_retention_days = var.backup_retention_days
  is_replica           = false
  source_db_arn        = ""
}

# Database module for secondary region (DR)
module "database_dr" {
  count  = local.enable_disaster_recovery ? 1 : 0
  source = "./modules/database"
  
  providers = {
    aws = aws.secondary
  }
  
  environment         = var.environment
  project_name        = var.project_name
  subnet_ids          = module.networking_dr[0].private_data_subnet_ids
  security_group_id   = module.networking_dr[0].db_security_group_id
  aws_region          = var.secondary_aws_region
  
  db_instance_class    = var.db_instance_class
  db_multi_az          = var.db_multi_az
  db_allocated_storage = var.db_allocated_storage
  db_name              = var.db_name
  db_username          = var.db_username
  db_password          = var.db_password
  backup_retention_days = var.backup_retention_days
  is_replica           = true
  source_db_arn        = module.database.db_instance_arn
}

# Storage module (S3 and Redis)
module "storage" {
  source = "./modules/storage"
  
  environment         = var.environment
  project_name        = var.project_name
  subnet_ids          = module.networking.private_data_subnet_ids
  security_group_id   = module.networking.db_security_group_id
  aws_region          = var.aws_region
  
  redis_node_type     = var.redis_node_type
  redis_num_cache_nodes = var.redis_num_cache_nodes
  s3_lifecycle_transition_days = var.s3_lifecycle_transition_days
  s3_lifecycle_expiration_days = var.s3_lifecycle_expiration_days
  enable_dr           = var.enable_dr
}

# Compute module for primary region (ECS, ALB)
module "compute" {
  source = "./modules/compute"
  
  environment         = var.environment
  project_name        = var.project_name
  vpc_id              = module.networking.vpc_id
  public_subnet_ids   = module.networking.public_subnet_ids
  private_subnet_ids  = module.networking.private_app_subnet_ids
  app_security_group_id = module.networking.app_security_group_id
  
  db_endpoint         = module.database.db_instance_endpoint
  redis_endpoint      = module.storage.redis_endpoint
  s3_bucket_name      = module.storage.s3_bucket_name
  aws_region          = var.aws_region
  
  ecs_task_cpu        = var.ecs_task_cpu
  ecs_task_memory     = var.ecs_task_memory
  ecs_service_min_capacity = var.ecs_service_min_capacity
  ecs_service_max_capacity = var.ecs_service_max_capacity
  
  domain_name         = var.domain_name
  subdomain_prefix    = var.subdomain_prefix
}

# Compute module for secondary region (DR)
module "compute_dr" {
  count  = local.enable_disaster_recovery ? 1 : 0
  source = "./modules/compute"
  
  providers = {
    aws = aws.secondary
  }
  
  environment         = "${var.environment}-dr"
  project_name        = var.project_name
  vpc_id              = module.networking_dr[0].vpc_id
  public_subnet_ids   = module.networking_dr[0].public_subnet_ids
  private_subnet_ids  = module.networking_dr[0].private_app_subnet_ids
  app_security_group_id = module.networking_dr[0].app_security_group_id
  
  db_endpoint         = module.database_dr[0].db_instance_endpoint
  redis_endpoint      = module.storage.redis_endpoint
  s3_bucket_name      = module.storage.s3_dr_bucket_name
  aws_region          = var.secondary_aws_region
  
  ecs_task_cpu        = var.ecs_task_cpu
  ecs_task_memory     = var.ecs_task_memory
  ecs_service_min_capacity = var.ecs_service_min_capacity
  ecs_service_max_capacity = var.ecs_service_max_capacity
  
  domain_name         = var.domain_name
  subdomain_prefix    = var.subdomain_prefix
}

# Monitoring module
module "monitoring" {
  source = "./modules/monitoring"
  
  environment         = var.environment
  project_name        = var.project_name
  ecs_cluster_name    = module.compute.ecs_cluster_name
  ecs_service_names   = module.compute.ecs_service_names
  db_instance_arn     = module.database.db_instance_arn
  alb_dns_name        = module.compute.alb_dns_name
  aws_region          = var.aws_region
  honeycomb_api_key   = var.honeycomb_api_key
}

# Security module
module "security" {
  source = "./modules/security"
  
  environment         = var.environment
  project_name        = var.project_name
  alb_dns_name        = module.compute.alb_dns_name
  aws_region          = var.aws_region
  enable_waf          = var.enable_waf
  enable_guardduty    = var.enable_guardduty
}

# Outputs
output "environment" {
  description = "The deployment environment (dev, staging, prod)"
  value       = var.environment
}

output "aws_region" {
  description = "The primary AWS region for deployment"
  value       = var.aws_region
}

output "secondary_aws_region" {
  description = "The secondary AWS region for disaster recovery (if enabled)"
  value       = local.enable_disaster_recovery ? var.secondary_aws_region : ""
}

output "vpc_id" {
  description = "ID of the primary VPC"
  value       = module.networking.vpc_id
}

output "db_endpoint" {
  description = "Endpoint of the primary RDS instance"
  value       = module.database.db_instance_endpoint
}

output "redis_endpoint" {
  description = "Endpoint of the ElastiCache Redis cluster"
  value       = module.storage.redis_endpoint
}

output "s3_bucket_name" {
  description = "Name of the primary S3 bucket"
  value       = module.storage.s3_bucket_name
}

output "application_url" {
  description = "URL for accessing the Metronomics Platform application"
  value       = var.subdomain_prefix[var.environment] != "" ? "https://${var.subdomain_prefix[var.environment]}.${var.domain_name}" : "https://${var.domain_name}"
}

output "ecr_repository_urls" {
  description = "URLs of the ECR repositories for container images"
  value       = module.compute.ecr_repository_urls
}

output "cloudwatch_dashboard_url" {
  description = "URL of the CloudWatch dashboard"
  value       = module.monitoring.cloudwatch_dashboard_url
}

output "disaster_recovery_enabled" {
  description = "Whether disaster recovery is enabled for this environment"
  value       = local.enable_disaster_recovery
}