# Output variables for the Metronomics Platform infrastructure

# General Environment Information
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

output "disaster_recovery_enabled" {
  description = "Whether disaster recovery is enabled for this environment"
  value       = local.enable_disaster_recovery
}

# Network Infrastructure
output "vpc_id" {
  description = "ID of the primary VPC"
  value       = module.networking.vpc_id
}

output "vpc_dr_id" {
  description = "ID of the disaster recovery VPC (if enabled)"
  value       = local.enable_disaster_recovery ? module.networking_dr[0].vpc_id : ""
}

output "public_subnet_ids" {
  description = "List of public subnet IDs in the primary region"
  value       = module.networking.public_subnet_ids
}

output "private_app_subnet_ids" {
  description = "List of private application subnet IDs in the primary region"
  value       = module.networking.private_app_subnet_ids
}

output "private_data_subnet_ids" {
  description = "List of private data subnet IDs in the primary region"
  value       = module.networking.private_data_subnet_ids
}

# Database Resources
output "db_endpoint" {
  description = "Endpoint of the primary RDS instance"
  value       = module.database.db_instance_endpoint
}

output "db_read_replica_endpoint" {
  description = "Endpoint of the read replica RDS instance (if enabled)"
  value       = module.database.read_replica_endpoint
}

output "db_dr_endpoint" {
  description = "Endpoint of the disaster recovery RDS instance (if enabled)"
  value       = local.enable_disaster_recovery ? module.database_dr[0].db_instance_endpoint : ""
}

output "db_name" {
  description = "Name of the PostgreSQL database"
  value       = module.database.db_name
}

output "db_secret_arn" {
  description = "ARN of the Secrets Manager secret containing database credentials"
  value       = module.database.db_secret_arn
}

output "db_connection_string" {
  description = "PostgreSQL connection string for the primary database instance"
  value       = module.database.connection_string
  sensitive   = true
}

# Storage Resources
output "redis_endpoint" {
  description = "Endpoint of the ElastiCache Redis cluster"
  value       = module.storage.redis_endpoint
}

output "redis_connection_string" {
  description = "Connection string for the ElastiCache Redis cluster"
  value       = module.storage.redis_connection_string
}

output "s3_bucket_name" {
  description = "Name of the primary S3 bucket"
  value       = module.storage.s3_bucket_name
}

output "s3_bucket_arn" {
  description = "ARN of the primary S3 bucket"
  value       = module.storage.s3_bucket_arn
}

output "s3_dr_bucket_name" {
  description = "Name of the disaster recovery S3 bucket (if enabled)"
  value       = module.storage.s3_dr_bucket_name
}

# Compute Resources
output "alb_dns_name" {
  description = "DNS name of the application load balancer"
  value       = module.compute.alb_dns_name
}

output "alb_dr_dns_name" {
  description = "DNS name of the disaster recovery application load balancer (if enabled)"
  value       = local.enable_disaster_recovery ? module.compute_dr[0].alb_dns_name : ""
}

output "application_url" {
  description = "URL for accessing the Metronomics Platform application"
  value       = var.subdomain_prefix[var.environment] != "" ? "https://${var.subdomain_prefix[var.environment]}.${var.domain_name}" : "https://${var.domain_name}"
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = module.compute.ecs_cluster_name
}

output "ecs_dr_cluster_name" {
  description = "Name of the disaster recovery ECS cluster (if enabled)"
  value       = local.enable_disaster_recovery ? module.compute_dr[0].ecs_cluster_name : ""
}

output "ecs_service_names" {
  description = "Map of service names for the frontend, API, and worker services"
  value       = module.compute.ecs_service_names
}

output "ecr_repository_urls" {
  description = "URLs of the ECR repositories for container images"
  value       = module.compute.ecr_repository_urls
}

# Monitoring and Observability
output "cloudwatch_dashboard_url" {
  description = "URL of the CloudWatch dashboard"
  value       = module.monitoring.cloudwatch_dashboard_url
}

output "alarm_topic_arn" {
  description = "ARN of the SNS topic for CloudWatch alarms"
  value       = module.monitoring.alarm_topic_arn
}

output "honeycomb_dataset" {
  description = "Name of the Honeycomb dataset for application metrics"
  value       = module.monitoring.honeycomb_dataset
}

# Security Resources
output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL"
  value       = module.security.waf_web_acl_arn
}

output "guardduty_detector_id" {
  description = "ID of the GuardDuty detector"
  value       = module.security.guardduty_detector_id
}

output "security_hub_enabled" {
  description = "Whether Security Hub is enabled for this environment"
  value       = module.security.security_hub_enabled
}