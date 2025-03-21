# General environment variables
variable "environment" {
  type        = string
  description = "Deployment environment (dev, staging, prod)"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "project_name" {
  type        = string
  description = "Name of the project for resource naming and tagging"
  default     = "metronomics"
}

# AWS configuration
variable "aws_region" {
  type        = string
  description = "Primary AWS region for deployment"
  default     = "us-east-1"
}

variable "secondary_aws_region" {
  type        = string
  description = "Secondary AWS region for disaster recovery"
  default     = "us-west-2"
}

# Networking
variable "vpc_cidr" {
  type        = string
  description = "CIDR block for the VPC in primary region"
  default     = "10.0.0.0/16"
}

variable "vpc_cidr_secondary" {
  type        = string
  description = "CIDR block for the VPC in secondary region"
  default     = "10.1.0.0/16"
}

variable "availability_zones" {
  type        = number
  description = "Number of availability zones to use"
  default     = 2
}

variable "enable_dr" {
  type        = map(bool)
  description = "Enable disaster recovery resources by environment"
  default = {
    dev     = false
    staging = true
    prod    = true
  }
}

# Database
variable "db_instance_class" {
  type        = map(string)
  description = "RDS instance class by environment"
  default = {
    dev     = "db.t3.medium"
    staging = "db.r6g.large"
    prod    = "db.r6g.xlarge"
  }
}

variable "db_multi_az" {
  type        = map(bool)
  description = "Enable Multi-AZ for RDS by environment"
  default = {
    dev     = false
    staging = true
    prod    = true
  }
}

variable "db_allocated_storage" {
  type        = map(number)
  description = "Allocated storage for RDS in GB by environment"
  default = {
    dev     = 20
    staging = 50
    prod    = 100
  }
}

variable "db_name" {
  type        = string
  description = "Name of the PostgreSQL database"
  default     = "metronomics"
}

variable "db_username" {
  type        = string
  description = "Username for the database"
  default     = "metronomics_app"
}

variable "db_password" {
  type        = string
  description = "Password for the database (will be generated if not provided)"
  default     = ""
  sensitive   = true
}

# Redis cache
variable "redis_node_type" {
  type        = map(string)
  description = "ElastiCache Redis node type by environment"
  default = {
    dev     = "cache.t3.small"
    staging = "cache.m6g.large"
    prod    = "cache.m6g.xlarge"
  }
}

variable "redis_num_cache_nodes" {
  type        = map(number)
  description = "Number of Redis cache nodes by environment"
  default = {
    dev     = 1
    staging = 2
    prod    = 3
  }
}

# ECS services
variable "ecs_task_cpu" {
  type        = map(map(number))
  description = "CPU units for ECS tasks by service and environment"
  default = {
    dev = {
      frontend = 256
      api      = 512
      worker   = 256
    }
    staging = {
      frontend = 512
      api      = 1024
      worker   = 512
    }
    prod = {
      frontend = 1024
      api      = 2048
      worker   = 1024
    }
  }
}

variable "ecs_task_memory" {
  type        = map(map(number))
  description = "Memory (MiB) for ECS tasks by service and environment"
  default = {
    dev = {
      frontend = 512
      api      = 1024
      worker   = 512
    }
    staging = {
      frontend = 1024
      api      = 2048
      worker   = 1024
    }
    prod = {
      frontend = 2048
      api      = 4096
      worker   = 2048
    }
  }
}

variable "ecs_service_min_capacity" {
  type        = map(map(number))
  description = "Minimum number of tasks for ECS services by service and environment"
  default = {
    dev = {
      frontend = 1
      api      = 1
      worker   = 1
    }
    staging = {
      frontend = 2
      api      = 2
      worker   = 1
    }
    prod = {
      frontend = 3
      api      = 4
      worker   = 2
    }
  }
}

variable "ecs_service_max_capacity" {
  type        = map(map(number))
  description = "Maximum number of tasks for ECS services by service and environment"
  default = {
    dev = {
      frontend = 2
      api      = 2
      worker   = 2
    }
    staging = {
      frontend = 4
      api      = 4
      worker   = 3
    }
    prod = {
      frontend = 20
      api      = 30
      worker   = 15
    }
  }
}

# Security
variable "enable_waf" {
  type        = map(bool)
  description = "Enable AWS WAF by environment"
  default = {
    dev     = false
    staging = true
    prod    = true
  }
}

variable "enable_guardduty" {
  type        = map(bool)
  description = "Enable AWS GuardDuty by environment"
  default = {
    dev     = false
    staging = true
    prod    = true
  }
}

# S3 storage
variable "s3_lifecycle_transition_days" {
  type        = map(number)
  description = "Number of days before transitioning objects to Infrequent Access storage"
  default = {
    dev     = 30
    staging = 30
    prod    = 30
  }
}

variable "s3_lifecycle_expiration_days" {
  type        = map(number)
  description = "Number of days before expiring objects"
  default = {
    dev     = 90
    staging = 90
    prod    = 365
  }
}

# Domain and DNS
variable "domain_name" {
  type        = string
  description = "Domain name for the application"
  default     = "metronomics.io"
}

variable "subdomain_prefix" {
  type        = map(string)
  description = "Subdomain prefix by environment"
  default = {
    dev     = "dev"
    staging = "staging"
    prod    = ""
  }
}

# CDN
variable "enable_cdn" {
  type        = map(bool)
  description = "Enable CloudFront CDN by environment"
  default = {
    dev     = false
    staging = true
    prod    = true
  }
}

# Database backup and maintenance
variable "backup_retention_days" {
  type        = map(number)
  description = "Number of days to retain database backups"
  default = {
    dev     = 7
    staging = 14
    prod    = 30
  }
}

variable "enable_performance_insights" {
  type        = map(bool)
  description = "Enable Performance Insights for RDS by environment"
  default = {
    dev     = false
    staging = true
    prod    = true
  }
}

variable "enable_deletion_protection" {
  type        = map(bool)
  description = "Enable deletion protection for RDS by environment"
  default = {
    dev     = false
    staging = false
    prod    = true
  }
}

variable "skip_final_snapshot" {
  type        = map(bool)
  description = "Skip final snapshot when destroying the database"
  default = {
    dev     = true
    staging = true
    prod    = false
  }
}

variable "enable_read_replica" {
  type        = map(bool)
  description = "Enable read replica for RDS by environment"
  default = {
    dev     = false
    staging = false
    prod    = true
  }
}

# Monitoring
variable "enable_container_insights" {
  type        = bool
  description = "Enable CloudWatch Container Insights for the ECS cluster"
  default     = true
}

# Auto-scaling
variable "enable_auto_scaling" {
  type        = bool
  description = "Enable auto-scaling for ECS services"
  default     = true
}

variable "cpu_scale_out_threshold" {
  type        = number
  description = "CPU utilization percentage to trigger scale out"
  default     = 70
}

variable "cpu_scale_in_threshold" {
  type        = number
  description = "CPU utilization percentage to trigger scale in"
  default     = 30
}

# WAF logs
variable "waf_log_retention_days" {
  type        = map(number)
  description = "Number of days to retain WAF logs by environment"
  default = {
    dev     = 30
    staging = 30
    prod    = 90
  }
}

# Security services
variable "enable_security_hub" {
  type        = map(bool)
  description = "Enable AWS Security Hub by environment"
  default = {
    dev     = false
    staging = false
    prod    = true
  }
}

variable "enable_config" {
  type        = map(bool)
  description = "Enable AWS Config by environment"
  default = {
    dev     = false
    staging = false
    prod    = true
  }
}

variable "enable_shield_advanced" {
  type        = map(bool)
  description = "Enable AWS Shield Advanced by environment"
  default = {
    dev     = false
    staging = false
    prod    = true
  }
}

variable "config_bucket_force_destroy" {
  type        = map(bool)
  description = "Force destroy the AWS Config S3 bucket even if it contains objects"
  default = {
    dev     = true
    staging = true
    prod    = false
  }
}

# Observability
variable "honeycomb_api_key" {
  type        = string
  description = "API key for Honeycomb observability integration"
  sensitive   = true
}

# RDS monitoring
variable "enable_rds_enhanced_monitoring" {
  type        = bool
  description = "Enable enhanced monitoring for RDS instances"
  default     = true
}

variable "rds_monitoring_interval" {
  type        = number
  description = "Monitoring interval in seconds for RDS enhanced monitoring"
  default     = 60
}

# Network monitoring
variable "enable_vpc_flow_logs" {
  type        = bool
  description = "Enable VPC Flow Logs for network traffic analysis"
  default     = true
}

variable "vpc_flow_logs_retention_days" {
  type        = number
  description = "Number of days to retain VPC Flow Logs"
  default     = 30
}

# ALB logs
variable "enable_alb_access_logs" {
  type        = bool
  description = "Enable access logs for Application Load Balancer"
  default     = true
}

variable "alb_access_logs_retention_days" {
  type        = number
  description = "Number of days to retain ALB access logs"
  default     = 30
}

# WAF rate limiting
variable "waf_rate_limit" {
  type        = number
  description = "Maximum number of requests allowed per 5-minute period from a single IP"
  default     = 3000
}

# GuardDuty
variable "guardduty_finding_publishing_frequency" {
  type        = string
  description = "Frequency of publishing findings from GuardDuty"
  default     = "SIX_HOURS"

  validation {
    condition     = contains(["FIFTEEN_MINUTES", "ONE_HOUR", "SIX_HOURS"], var.guardduty_finding_publishing_frequency)
    error_message = "Finding publishing frequency must be one of: FIFTEEN_MINUTES, ONE_HOUR, SIX_HOURS."
  }
}

variable "guardduty_notification_email" {
  type        = string
  description = "Email address to receive GuardDuty findings notifications"
  default     = ""
}

# WAF rule groups
variable "waf_managed_rule_groups" {
  type = list(object({
    name        = string
    vendor_name = string
    priority    = number
  }))
  description = "List of AWS managed rule groups to include in the WAF Web ACL"
  default = [
    {
      name        = "AWSManagedRulesCommonRuleSet"
      vendor_name = "AWS"
      priority    = 10
    },
    {
      name        = "AWSManagedRulesSQLiRuleSet"
      vendor_name = "AWS"
      priority    = 20
    },
    {
      name        = "AWSManagedRulesKnownBadInputsRuleSet"
      vendor_name = "AWS"
      priority    = 30
    }
  ]
}

# S3 replication
variable "enable_cross_region_replication" {
  type        = bool
  description = "Enable S3 cross-region replication for disaster recovery"
  default     = true
}

# RDS maintenance
variable "enable_rds_auto_minor_version_upgrade" {
  type        = bool
  description = "Enable automatic minor version upgrades for RDS"
  default     = true
}

variable "enable_rds_backup_window" {
  type        = string
  description = "Preferred backup window for RDS in UTC"
  default     = "02:00-06:00"
}

variable "enable_rds_maintenance_window" {
  type        = string
  description = "Preferred maintenance window for RDS in UTC"
  default     = "Sun:06:00-Sun:10:00"
}

# CloudFront WAF
variable "enable_cloudfront_waf_association" {
  type        = bool
  description = "Associate WAF with CloudFront distribution for edge protection"
  default     = true
}

variable "cloudfront_price_class" {
  type        = string
  description = "CloudFront price class for global distribution"
  default     = "PriceClass_All"
}

# Route 53
variable "enable_route53_health_checks" {
  type        = bool
  description = "Enable Route53 health checks for failover routing"
  default     = true
}

# CloudTrail
variable "enable_cloudtrail" {
  type        = bool
  description = "Enable CloudTrail for API activity logging"
  default     = true
}

variable "cloudtrail_log_retention_days" {
  type        = number
  description = "Number of days to retain CloudTrail logs"
  default     = 90
}