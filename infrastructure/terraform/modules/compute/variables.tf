# Basic configuration variables
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

variable "aws_region" {
  type        = string
  description = "AWS region for deploying compute resources"
  default     = "us-east-1"
}

# Network configuration variables
variable "vpc_id" {
  type        = string
  description = "ID of the VPC where compute resources will be deployed"
}

variable "public_subnet_ids" {
  type        = list(string)
  description = "List of public subnet IDs for the load balancer"
}

variable "private_subnet_ids" {
  type        = list(string)
  description = "List of private subnet IDs for ECS services"
}

variable "app_security_group_id" {
  type        = string
  description = "Security group ID for the application components"
}

# Service endpoint variables
variable "db_endpoint" {
  type        = string
  description = "Endpoint for the PostgreSQL database"
}

variable "redis_endpoint" {
  type        = string
  description = "Endpoint for the Redis cache"
}

variable "s3_bucket_name" {
  type        = string
  description = "Name of the S3 bucket for application storage"
}

# ECS Task configuration variables
variable "ecs_task_cpu" {
  type        = map(map(number))
  description = "CPU units for ECS tasks by service and environment"
  default     = {
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
  default     = {
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
  default     = {
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
  default     = {
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

# Domain and DNS variables
variable "domain_name" {
  type        = string
  description = "Domain name for the application"
  default     = "metronomics.io"
}

variable "subdomain_prefix" {
  type        = map(string)
  description = "Subdomain prefix by environment"
  default     = {
    dev     = "dev"
    staging = "staging"
    prod    = ""
  }
}

# Auto-scaling configuration variables
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

variable "scale_out_cooldown" {
  type        = number
  description = "Cooldown period in seconds after scaling out"
  default     = 300
}

variable "scale_in_cooldown" {
  type        = number
  description = "Cooldown period in seconds after scaling in"
  default     = 300
}

# Deployment configuration variables
variable "health_check_grace_period" {
  type        = number
  description = "Grace period in seconds for health checks during task startup"
  default     = 120
}

variable "deployment_maximum_percent" {
  type        = number
  description = "Maximum percentage of tasks that can be running during a deployment"
  default     = 200
}

variable "deployment_minimum_healthy_percent" {
  type        = number
  description = "Minimum percentage of tasks that must remain healthy during a deployment"
  default     = 100
}

# ECR configuration variables
variable "ecr_image_tag_mutability" {
  type        = string
  description = "Image tag mutability setting for ECR repositories"
  default     = "MUTABLE"
  
  validation {
    condition     = contains(["MUTABLE", "IMMUTABLE"], var.ecr_image_tag_mutability)
    error_message = "ECR image tag mutability must be either MUTABLE or IMMUTABLE."
  }
}

variable "ecr_scan_on_push" {
  type        = bool
  description = "Enable vulnerability scanning for container images when pushed to ECR"
  default     = true
}

# Monitoring and logging variables
variable "enable_container_insights" {
  type        = bool
  description = "Enable CloudWatch Container Insights for the ECS cluster"
  default     = true
}

variable "log_retention_days" {
  type        = number
  description = "Number of days to retain CloudWatch logs for ECS services"
  default     = 30
}

variable "enable_alb_access_logs" {
  type        = bool
  description = "Enable access logs for Application Load Balancer"
  default     = true
}

variable "alb_access_logs_bucket" {
  type        = string
  description = "S3 bucket name for ALB access logs"
  default     = ""
}

variable "alb_access_logs_prefix" {
  type        = string
  description = "S3 bucket prefix for ALB access logs"
  default     = "alb-logs"
}

# ALB configuration variables
variable "alb_idle_timeout" {
  type        = number
  description = "Idle timeout for ALB connections in seconds"
  default     = 60
}

variable "alb_deletion_protection" {
  type        = bool
  description = "Enable deletion protection for the ALB"
  default     = false
}

# Deployment strategy variables
variable "enable_blue_green_deployment" {
  type        = bool
  description = "Enable blue-green deployment for the frontend service"
  default     = false
}

# Maintenance variables
variable "task_definition_revision_retention" {
  type        = number
  description = "Number of task definition revisions to retain"
  default     = 5
}