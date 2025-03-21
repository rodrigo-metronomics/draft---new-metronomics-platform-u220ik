# Environment and general configuration variables
variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "project_name" {
  description = "Name of the project for resource naming and tagging"
  type        = string
  default     = "metronomics"
}

variable "aws_region" {
  description = "AWS region where the database resources will be deployed"
  type        = string
  default     = "us-east-1"
}

variable "subnet_ids" {
  description = "List of subnet IDs where the RDS instance will be deployed"
  type        = list(string)
}

variable "security_group_id" {
  description = "ID of the security group that will be attached to the RDS instance"
  type        = string
}

# Database instance configuration
variable "db_instance_class" {
  description = "RDS instance class by environment"
  type        = map(string)
  default = {
    dev     = "db.t3.medium"
    staging = "db.r6g.large"
    prod    = "db.r6g.xlarge"
  }
}

variable "db_multi_az" {
  description = "Enable Multi-AZ deployment for RDS by environment"
  type        = map(bool)
  default = {
    dev     = false
    staging = true
    prod    = true
  }
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS in GB by environment"
  type        = map(number)
  default = {
    dev     = 20
    staging = 50
    prod    = 100
  }
}

variable "db_name" {
  description = "Name of the PostgreSQL database"
  type        = string
  default     = "metronomics"
}

variable "db_username" {
  description = "Master username for the PostgreSQL database"
  type        = string
  default     = "metronomics_app"
}

variable "db_password" {
  description = "Master password for the PostgreSQL database (will be generated if not provided)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "backup_retention_days" {
  description = "Number of days to retain database backups by environment"
  type        = map(number)
  default = {
    dev     = 7
    staging = 14
    prod    = 30
  }
}

variable "is_replica" {
  description = "Whether this database is a replica of another RDS instance"
  type        = bool
  default     = false
}

variable "source_db_arn" {
  description = "ARN of the source database if this is a replica"
  type        = string
  default     = ""
}

variable "enable_performance_insights" {
  description = "Enable Performance Insights for RDS by environment"
  type        = map(bool)
  default = {
    dev     = false
    staging = true
    prod    = true
  }
}

variable "performance_insights_retention_period" {
  description = "Retention period for Performance Insights in days by environment"
  type        = map(number)
  default = {
    dev     = 7
    staging = 7
    prod    = 30
  }
}

variable "enable_cloudwatch_logs_export" {
  description = "Enable export of PostgreSQL logs to CloudWatch Logs"
  type        = bool
  default     = true
}

variable "enable_encryption" {
  description = "Enable storage encryption for the RDS instance"
  type        = bool
  default     = true
}

variable "enable_deletion_protection" {
  description = "Enable deletion protection for RDS by environment"
  type        = map(bool)
  default = {
    dev     = false
    staging = false
    prod    = true
  }
}

variable "skip_final_snapshot" {
  description = "Skip final snapshot when destroying the database by environment"
  type        = map(bool)
  default = {
    dev     = true
    staging = true
    prod    = false
  }
}

variable "enable_read_replica" {
  description = "Enable read replica for RDS by environment"
  type        = map(bool)
  default = {
    dev     = false
    staging = false
    prod    = true
  }
}

variable "alarm_cpu_threshold" {
  description = "CPU utilization percentage threshold for CloudWatch alarm"
  type        = number
  default     = 80
}

variable "alarm_storage_threshold_percent" {
  description = "Free storage space percentage threshold for CloudWatch alarm"
  type        = number
  default     = 20
}

variable "alarm_connections_threshold" {
  description = "Database connection count threshold for CloudWatch alarm by environment"
  type        = map(number)
  default = {
    dev     = 50
    staging = 100
    prod    = 500
  }
}

variable "alarm_actions" {
  description = "List of ARNs to notify when CloudWatch alarms are triggered"
  type        = list(string)
  default     = []
}

variable "enable_rds_enhanced_monitoring" {
  description = "Enable enhanced monitoring for RDS instances"
  type        = bool
  default     = true
}

variable "rds_monitoring_interval" {
  description = "Monitoring interval in seconds for RDS enhanced monitoring"
  type        = number
  default     = 60
}

variable "enable_auto_minor_version_upgrade" {
  description = "Enable automatic minor version upgrades for RDS"
  type        = bool
  default     = true
}

variable "backup_window" {
  description = "Preferred backup window for RDS in UTC"
  type        = string
  default     = "02:00-06:00"
}

variable "maintenance_window" {
  description = "Preferred maintenance window for RDS in UTC"
  type        = string
  default     = "Sun:06:00-Sun:10:00"
}

variable "apply_immediately" {
  description = "Apply changes immediately instead of during the next maintenance window"
  type        = bool
  default     = false
}

variable "copy_tags_to_snapshot" {
  description = "Copy all tags from the RDS instance to snapshots"
  type        = bool
  default     = true
}

variable "storage_type" {
  description = "Storage type for the RDS instance (gp2, gp3, io1)"
  type        = string
  default     = "gp3"
}

variable "max_allocated_storage" {
  description = "Maximum storage allocation in GB for storage autoscaling by environment"
  type        = map(number)
  default = {
    dev     = 50
    staging = 100
    prod    = 200
  }
}

variable "tags" {
  description = "Additional tags to apply to all database resources"
  type        = map(string)
  default     = {}
}