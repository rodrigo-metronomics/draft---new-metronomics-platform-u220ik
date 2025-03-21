# This file contains configuration values specific to the staging environment
# Staging environment is configured with moderate resources and redundancy to balance costs and reliability

# Environment identification
environment = "staging"
project_name = "metronomics"

# AWS regions
aws_region = "us-east-1"
secondary_aws_region = "us-west-2"

# Network configuration
vpc_cidr = "10.0.0.0/16"
vpc_cidr_secondary = "10.1.0.0/16"
availability_zones = 2

# Database configuration
db_instance_class = "db.r6g.large"
db_multi_az = true
db_allocated_storage = 50
db_name = "metronomics_staging"
db_username = "metronomics_app"

# Redis cache configuration
redis_node_type = "cache.m6g.large"
redis_num_cache_nodes = 2

# ECS task configuration
ecs_task_cpu = {
  frontend = 512
  api      = 1024
  worker   = 512
}

ecs_task_memory = {
  frontend = 1024
  api      = 2048
  worker   = 1024
}

ecs_service_min_capacity = {
  frontend = 2
  api      = 2
  worker   = 1
}

ecs_service_max_capacity = {
  frontend = 4
  api      = 4
  worker   = 3
}

# Feature flags
enable_dr = true
enable_waf = true
enable_guardduty = true

# S3 lifecycle policies
s3_lifecycle_transition_days = 30
s3_lifecycle_expiration_days = 90

# Domain and DNS
domain_name = "metronomics.io"
subdomain_prefix = "staging"

# CDN configuration
enable_cdn = true

# Database backup and maintenance
backup_retention_days = 14
enable_performance_insights = true
enable_deletion_protection = false
skip_final_snapshot = true
enable_read_replica = false

# Monitoring and scaling
enable_container_insights = true
enable_auto_scaling = true
cpu_scale_out_threshold = 70
cpu_scale_in_threshold = 30

# Security and compliance
waf_log_retention_days = 30
enable_security_hub = false
enable_config = false
enable_shield_advanced = false
config_bucket_force_destroy = true

# Enhanced monitoring
enable_rds_enhanced_monitoring = true
rds_monitoring_interval = 60
enable_vpc_flow_logs = true
vpc_flow_logs_retention_days = 30
enable_alb_access_logs = true
alb_access_logs_retention_days = 30

# Disaster recovery
enable_cross_region_replication = true

# Database maintenance
enable_rds_auto_minor_version_upgrade = true
enable_rds_backup_window = "02:00-06:00"
enable_rds_maintenance_window = "Sun:06:00-Sun:10:00"

# CloudFront and WAF
enable_cloudfront_waf_association = true
cloudfront_price_class = "PriceClass_All"

# Route 53 and monitoring
enable_route53_health_checks = true

# Audit logging
enable_cloudtrail = true
cloudtrail_log_retention_days = 90