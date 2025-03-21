# Terraform variable values for the production environment
# This file contains configuration values specific to the production environment
# Production environment is configured with maximum resources, redundancy, and security features for a highly available and secure deployment

# Environment identification
environment = "prod"
project_name = "metronomics"

# AWS regions
aws_region = "us-east-1"
secondary_aws_region = "us-west-2"

# Networking
vpc_cidr = "10.0.0.0/16"
vpc_cidr_secondary = "10.1.0.0/16"
availability_zones = 3

# Database configuration
db_instance_class = {
  prod = "db.r6g.xlarge"
}
db_multi_az = {
  prod = true
}
db_allocated_storage = {
  prod = 100
}
db_name = "metronomics"
db_username = "metronomics_app"

# Redis configuration
redis_node_type = {
  prod = "cache.m6g.xlarge"
}
redis_num_cache_nodes = {
  prod = 3
}

# ECS services configuration
ecs_task_cpu = {
  prod = {
    frontend = 1024
    api      = 2048
    worker   = 1024
  }
}

ecs_task_memory = {
  prod = {
    frontend = 2048
    api      = 4096
    worker   = 2048
  }
}

ecs_service_min_capacity = {
  prod = {
    frontend = 3
    api      = 4
    worker   = 2
  }
}

ecs_service_max_capacity = {
  prod = {
    frontend = 20
    api      = 30
    worker   = 15
  }
}

# Feature flags
enable_dr = {
  prod = true
}
enable_waf = {
  prod = true
}
enable_guardduty = {
  prod = true
}

# S3 storage configuration
s3_lifecycle_transition_days = {
  prod = 30
}
s3_lifecycle_expiration_days = {
  prod = 365
}

# Domain and DNS
domain_name = "metronomics.io"
subdomain_prefix = {
  prod = ""
}

# CDN
enable_cdn = {
  prod = true
}

# Database backup and maintenance
backup_retention_days = {
  prod = 30
}
enable_performance_insights = {
  prod = true
}
enable_deletion_protection = {
  prod = true
}
skip_final_snapshot = {
  prod = false
}
enable_read_replica = {
  prod = true
}

# Monitoring
enable_container_insights = true

# Auto-scaling
enable_auto_scaling = true
cpu_scale_out_threshold = 70
cpu_scale_in_threshold = 30

# WAF logs
waf_log_retention_days = {
  prod = 90
}

# Security services
enable_security_hub = {
  prod = true
}
enable_config = {
  prod = true
}
enable_shield_advanced = {
  prod = true
}
config_bucket_force_destroy = {
  prod = false
}

# RDS monitoring
enable_rds_enhanced_monitoring = true
rds_monitoring_interval = 60

# Network monitoring
enable_vpc_flow_logs = true
vpc_flow_logs_retention_days = 90

# ALB logs
enable_alb_access_logs = true
alb_access_logs_retention_days = 90

# WAF rate limiting
waf_rate_limit = 3000

# GuardDuty
guardduty_finding_publishing_frequency = "FIFTEEN_MINUTES"

# S3 replication
enable_cross_region_replication = true

# RDS maintenance
enable_rds_auto_minor_version_upgrade = true
enable_rds_backup_window = "02:00-06:00"
enable_rds_maintenance_window = "Sun:06:00-Sun:10:00"

# CloudFront WAF
enable_cloudfront_waf_association = true
cloudfront_price_class = "PriceClass_All"

# Route 53
enable_route53_health_checks = true

# CloudTrail
enable_cloudtrail = true
cloudtrail_log_retention_days = 90