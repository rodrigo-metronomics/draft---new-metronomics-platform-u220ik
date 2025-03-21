# This file contains configuration values specific to the development environment

# Development environment is configured with minimal resources and redundancy to reduce costs

# Environment basics
environment = "dev"
project_name = "metronomics"
aws_region = "us-east-1"
secondary_aws_region = "us-west-2"

# Network configuration
vpc_cidr = "10.0.0.0/16"
vpc_cidr_secondary = "10.1.0.0/16"
availability_zones = 2

# Database configuration
db_instance_class = "db.t3.medium"
db_multi_az = false
db_allocated_storage = 20
db_name = "metronomics_dev"
db_username = "metronomics_app"

# Redis configuration
redis_node_type = "cache.t3.small"
redis_num_cache_nodes = 1

# ECS service configuration
ecs_task_cpu = {
  frontend = 256
  api      = 512
  worker   = 256
}

ecs_task_memory = {
  frontend = 512
  api      = 1024
  worker   = 512
}

ecs_service_min_capacity = {
  frontend = 1
  api      = 1
  worker   = 1
}

ecs_service_max_capacity = {
  frontend = 2
  api      = 2
  worker   = 2
}

# Disaster recovery and security features
enable_dr = false
enable_waf = false
enable_guardduty = false

# S3 storage configuration
s3_lifecycle_transition_days = 30
s3_lifecycle_expiration_days = 90

# Domain and DNS configuration
domain_name = "metronomics.io"
subdomain_prefix = "dev"

# CDN configuration
enable_cdn = false

# Database backup and maintenance
backup_retention_days = 7
enable_performance_insights = false
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

# Observability and logging
enable_rds_enhanced_monitoring = false
enable_vpc_flow_logs = false
enable_alb_access_logs = false