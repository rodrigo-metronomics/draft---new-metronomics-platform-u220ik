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

variable "subnet_ids" {
  description = "List of subnet IDs for the ElastiCache Redis cluster"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group ID to associate with the ElastiCache Redis cluster"
  type        = string
}

variable "aws_region" {
  description = "AWS region for the primary storage resources"
  type        = string
  default     = "us-east-1"
}

variable "secondary_aws_region" {
  description = "AWS region for disaster recovery storage resources"
  type        = string
  default     = "us-west-2"
}

variable "redis_node_type" {
  description = "ElastiCache Redis node type by environment"
  type        = map(string)
  default     = {
    dev     = "cache.t3.small"
    staging = "cache.m6g.large"
    prod    = "cache.m6g.xlarge"
  }
}

variable "redis_num_cache_nodes" {
  description = "Number of Redis cache nodes by environment"
  type        = map(number)
  default     = {
    dev     = 1
    staging = 2
    prod    = 3
  }
}

variable "s3_lifecycle_transition_days" {
  description = "Number of days before transitioning objects to Infrequent Access storage"
  type        = map(number)
  default     = {
    dev     = 30
    staging = 30
    prod    = 30
  }
}

variable "s3_lifecycle_expiration_days" {
  description = "Number of days before expiring objects"
  type        = map(number)
  default     = {
    dev     = 90
    staging = 90
    prod    = 365
  }
}

variable "enable_dr" {
  description = "Enable disaster recovery resources by environment"
  type        = map(bool)
  default     = {
    dev     = false
    staging = true
    prod    = true
  }
}

variable "redis_parameter_family" {
  description = "ElastiCache parameter group family"
  type        = string
  default     = "redis6.x"
}

variable "redis_port" {
  description = "Port for the ElastiCache Redis cluster"
  type        = number
  default     = 6379
}

variable "redis_maintenance_window" {
  description = "Preferred maintenance window for Redis in UTC"
  type        = string
  default     = "sun:05:00-sun:09:00"
}

variable "redis_snapshot_window" {
  description = "Preferred snapshot window for Redis in UTC"
  type        = string
  default     = "00:00-04:00"
}

variable "redis_snapshot_retention_limit" {
  description = "Number of days to retain Redis snapshots by environment"
  type        = map(number)
  default     = {
    dev     = 1
    staging = 3
    prod    = 7
  }
}

variable "s3_cors_allowed_origins" {
  description = "List of allowed origins for CORS on S3 buckets"
  type        = list(string)
  default     = ["https://*.metronomics.io", "http://localhost:*"]
}

variable "s3_cors_max_age_seconds" {
  description = "Maximum age in seconds for browser caching of CORS response"
  type        = number
  default     = 3000
}

variable "s3_versioning_enabled" {
  description = "Enable versioning for S3 buckets"
  type        = bool
  default     = true
}

variable "s3_server_side_encryption" {
  description = "Enable server-side encryption for S3 buckets"
  type        = bool
  default     = true
}

variable "redis_at_rest_encryption" {
  description = "Enable encryption at rest for Redis"
  type        = bool
  default     = true
}

variable "redis_transit_encryption" {
  description = "Enable encryption in transit for Redis"
  type        = bool
  default     = true
}