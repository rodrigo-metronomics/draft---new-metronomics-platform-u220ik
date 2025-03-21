# General configuration variables
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
}

variable "aws_region" {
  type        = string
  description = "AWS region where monitoring resources will be deployed"
}

# Resources to monitor
variable "ecs_cluster_name" {
  type        = string
  description = "Name of the ECS cluster to monitor"
}

variable "ecs_service_names" {
  type        = map(string)
  description = "Map of ECS service names to monitor (frontend, api, worker)"
}

variable "db_instance_arn" {
  type        = string
  description = "ARN of the RDS database instance to monitor"
}

variable "alb_dns_name" {
  type        = string
  description = "DNS name of the Application Load Balancer to monitor"
}

# Integration configuration
variable "honeycomb_api_key" {
  type        = string
  description = "API key for Honeycomb observability integration"
  sensitive   = true
}

# Alarm configuration
variable "alarm_evaluation_periods" {
  type        = number
  description = "Number of periods to evaluate for alarm conditions"
  default     = 3
}

variable "alarm_period" {
  type        = number
  description = "Period in seconds for alarm evaluation"
  default     = 300
}

# Threshold configurations
variable "cpu_utilization_threshold" {
  type        = map(number)
  description = "CPU utilization percentage threshold for alarms by environment"
  default = {
    dev     = 80
    staging = 75
    prod    = 70
  }
}

variable "memory_utilization_threshold" {
  type        = map(number)
  description = "Memory utilization percentage threshold for alarms by environment"
  default = {
    dev     = 80
    staging = 75
    prod    = 70
  }
}

variable "error_5xx_threshold" {
  type        = map(number)
  description = "Threshold for 5XX error count alarms by environment"
  default = {
    dev     = 25
    staging = 15
    prod    = 10
  }
}

variable "error_4xx_threshold" {
  type        = map(number)
  description = "Threshold for 4XX error count alarms by environment"
  default = {
    dev     = 100
    staging = 75
    prod    = 50
  }
}

variable "response_time_threshold" {
  type        = map(number)
  description = "Response time threshold in seconds for alarms by environment"
  default = {
    dev     = 1.0
    staging = 0.75
    prod    = 0.5
  }
}

variable "db_connections_threshold" {
  type        = map(number)
  description = "Database connection count threshold for alarms by environment"
  default = {
    dev     = 50
    staging = 100
    prod    = 200
  }
}

variable "db_storage_threshold" {
  type        = map(number)
  description = "Database free storage space threshold in GB for alarms by environment"
  default = {
    dev     = 5
    staging = 10
    prod    = 20
  }
}

# Honeycomb configuration
variable "honeycomb_metrics_export_interval" {
  type        = string
  description = "CloudWatch event schedule expression for exporting metrics to Honeycomb"
  default     = "rate(15 minutes)"
}

# Monitoring feature toggles
variable "enable_detailed_monitoring" {
  type        = bool
  description = "Enable detailed monitoring for CloudWatch metrics"
  default     = true
}

variable "log_retention_days" {
  type        = number
  description = "Number of days to retain CloudWatch logs"
  default     = 30
}

variable "alarm_notification_email" {
  type        = string
  description = "Email address to receive alarm notifications"
  default     = ""
}

variable "enable_dashboard" {
  type        = bool
  description = "Enable CloudWatch dashboard creation"
  default     = true
}

variable "enable_honeycomb_integration" {
  type        = bool
  description = "Enable integration with Honeycomb for observability"
  default     = true
}

variable "dashboard_refresh_interval" {
  type        = number
  description = "Dashboard refresh interval in seconds"
  default     = 300
}

variable "enable_anomaly_detection" {
  type        = bool
  description = "Enable CloudWatch anomaly detection for metrics"
  default     = true
}

variable "alarm_actions_enabled" {
  type        = bool
  description = "Enable alarm actions (notifications, auto-scaling, etc.)"
  default     = true
}

variable "metric_namespace" {
  type        = string
  description = "Namespace for custom CloudWatch metrics"
  default     = "Metronomics"
}

variable "enable_composite_alarms" {
  type        = bool
  description = "Enable composite alarms that combine multiple metric conditions"
  default     = true
}

# Alert priority configuration
variable "alarm_priority_levels" {
  type        = map(map(string))
  description = "Configuration for different alarm priority levels and notification channels"
  default = {
    critical = {
      notification_type     = "email_and_sms"
      response_time_minutes = "15"
    }
    warning = {
      notification_type     = "email"
      response_time_minutes = "60"
    }
    info = {
      notification_type     = "email_digest"
      response_time_minutes = "1440"
    }
  }
}