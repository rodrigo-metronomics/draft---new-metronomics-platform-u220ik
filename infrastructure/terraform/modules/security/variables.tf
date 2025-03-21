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
  description = "AWS region where security resources will be deployed"
  type        = string
  default     = "us-east-1"
}

variable "alb_dns_name" {
  description = "DNS name of the Application Load Balancer to protect with WAF and Shield"
  type        = string
}

variable "enable_waf" {
  description = "Enable AWS WAF by environment"
  type        = map(bool)
  default     = {
    dev     = false
    staging = true
    prod    = true
  }
}

variable "enable_guardduty" {
  description = "Enable AWS GuardDuty by environment"
  type        = map(bool)
  default     = {
    dev     = false
    staging = true
    prod    = true
  }
}

variable "enable_security_hub" {
  description = "Enable AWS Security Hub by environment"
  type        = map(bool)
  default     = {
    dev     = false
    staging = false
    prod    = true
  }
}

variable "enable_config" {
  description = "Enable AWS Config by environment"
  type        = map(bool)
  default     = {
    dev     = false
    staging = false
    prod    = true
  }
}

variable "enable_shield_advanced" {
  description = "Enable AWS Shield Advanced by environment"
  type        = map(bool)
  default     = {
    dev     = false
    staging = false
    prod    = true
  }
}

variable "waf_rate_limit" {
  description = "Maximum number of requests allowed per 5-minute period from a single IP"
  type        = number
  default     = 3000
}

variable "waf_log_retention_days" {
  description = "Number of days to retain WAF logs by environment"
  type        = map(number)
  default     = {
    dev     = 30
    staging = 30
    prod    = 90
  }
}

variable "guardduty_finding_publishing_frequency" {
  description = "Frequency of publishing findings from GuardDuty"
  type        = string
  default     = "SIX_HOURS"
  
  validation {
    condition     = contains(["FIFTEEN_MINUTES", "ONE_HOUR", "SIX_HOURS"], var.guardduty_finding_publishing_frequency)
    error_message = "Finding publishing frequency must be one of: FIFTEEN_MINUTES, ONE_HOUR, SIX_HOURS."
  }
}

variable "guardduty_notification_email" {
  description = "Email address to receive GuardDuty findings notifications"
  type        = string
  default     = ""
}

variable "config_bucket_force_destroy" {
  description = "Force destroy the AWS Config S3 bucket even if it contains objects"
  type        = map(bool)
  default     = {
    dev     = true
    staging = true
    prod    = false
  }
}

variable "waf_managed_rule_groups" {
  description = "List of AWS managed rule groups to include in the WAF Web ACL"
  type        = list(object({
    name        = string
    vendor_name = string
    priority    = number
  }))
  default     = [
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

variable "waf_redacted_fields" {
  description = "List of fields to redact in WAF logs to protect sensitive data"
  type        = list(object({
    type = string
    name = string
  }))
  default     = [
    {
      type = "header"
      name = "authorization"
    },
    {
      type = "header"
      name = "cookie"
    },
    {
      type = "querystring"
      name = "password"
    }
  ]
}

variable "security_hub_standards" {
  description = "List of security standards to enable in Security Hub"
  type        = list(string)
  default     = [
    "arn:aws:securityhub:::ruleset/cis-aws-foundations-benchmark/v/1.2.0",
    "arn:aws:securityhub:us-east-1::standards/aws-foundational-security-best-practices/v/1.0.0"
  ]
}