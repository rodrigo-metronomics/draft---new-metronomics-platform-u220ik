# Security module for Metronomics Platform
# Provisions AWS security services including WAF, GuardDuty, Security Hub, and IAM roles

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

# Data sources
data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

data "aws_lb" "main" {
  name = var.alb_dns_name
}

# Local variables
locals {
  name_prefix = "${var.project_name}-${var.environment}"
  
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
    Module      = "security"
  }
  
  # Environment-specific feature toggles
  enable_waf_current_env                 = lookup(var.enable_waf, var.environment, false)
  enable_guardduty_current_env           = lookup(var.enable_guardduty, var.environment, false)
  enable_security_hub_current_env        = lookup(var.enable_security_hub, var.environment, false)
  enable_config_current_env              = lookup(var.enable_config, var.environment, false)
  enable_shield_advanced_current_env     = lookup(var.enable_shield_advanced, var.environment, false)
  waf_log_retention_days_current_env     = lookup(var.waf_log_retention_days, var.environment, 30)
  config_bucket_force_destroy_current_env = lookup(var.config_bucket_force_destroy, var.environment, true)
}

# -----------------------------------------------------------------------
# WAF Resources
# -----------------------------------------------------------------------

# WAF Web ACL to protect against common web attacks
resource "aws_wafv2_web_acl" "waf_web_acl" {
  count = local.enable_waf_current_env ? 1 : 0

  name        = "${local.name_prefix}-web-acl"
  description = "WAF Web ACL for ${var.project_name} ${var.environment} environment"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  # Rate-based rule to prevent DDoS and brute force attacks
  rule {
    name     = "rate-limit-rule"
    priority = 1

    action {
      block {
        custom_response {
          response_code = 429
          response_header {
            name  = "Retry-After"
            value = "300"
          }
        }
      }
    }

    statement {
      rate_based_statement {
        limit              = var.waf_rate_limit
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name_prefix}-rate-limit-rule-metric"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed rule groups to protect against common threats
  dynamic "rule" {
    for_each = var.waf_managed_rule_groups
    
    content {
      name     = "${rule.value.name}-rule"
      priority = rule.value.priority

      override_action {
        none {}
      }

      statement {
        managed_rule_group_statement {
          name        = rule.value.name
          vendor_name = rule.value.vendor_name
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "${local.name_prefix}-${rule.value.name}-metric"
        sampled_requests_enabled   = true
      }
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${local.name_prefix}-web-acl-metric"
    sampled_requests_enabled   = true
  }

  tags = local.common_tags
}

# Associate WAF Web ACL with Application Load Balancer
resource "aws_wafv2_web_acl_association" "waf_alb_association" {
  count = local.enable_waf_current_env ? 1 : 0

  resource_arn = data.aws_lb.main.arn
  web_acl_arn  = aws_wafv2_web_acl.waf_web_acl[0].arn

  depends_on = [aws_wafv2_web_acl.waf_web_acl]
}

# CloudWatch Log Group for WAF logs
resource "aws_cloudwatch_log_group" "waf_log_group" {
  count = local.enable_waf_current_env ? 1 : 0

  name              = "/aws/waf/${local.name_prefix}-web-acl"
  retention_in_days = local.waf_log_retention_days_current_env
  tags              = local.common_tags
}

# Enable WAF logging configuration
resource "aws_wafv2_web_acl_logging_configuration" "waf_logging_config" {
  count = local.enable_waf_current_env ? 1 : 0

  log_destination_configs = [aws_cloudwatch_log_group.waf_log_group[0].arn]
  resource_arn            = aws_wafv2_web_acl.waf_web_acl[0].arn

  # Redact sensitive fields in logs to protect PII
  dynamic "redacted_fields" {
    for_each = var.waf_redacted_fields
    
    content {
      dynamic [redacted_fields.value.type] {
        for_each = redacted_fields.value.type != "" ? [1] : []
        content {
          name = redacted_fields.value.name
        }
      }
    }
  }

  depends_on = [
    aws_wafv2_web_acl.waf_web_acl,
    aws_cloudwatch_log_group.waf_log_group
  ]
}

# -----------------------------------------------------------------------
# GuardDuty Resources
# -----------------------------------------------------------------------

# GuardDuty detector for threat detection
resource "aws_guardduty_detector" "guardduty_detector" {
  count = local.enable_guardduty_current_env ? 1 : 0

  enable                       = true
  finding_publishing_frequency = var.guardduty_finding_publishing_frequency
  tags                         = local.common_tags
}

# SNS topic for GuardDuty findings
resource "aws_sns_topic" "guardduty_notification_topic" {
  count = local.enable_guardduty_current_env && var.guardduty_notification_email != "" ? 1 : 0

  name = "${local.name_prefix}-guardduty-notifications"
  tags = local.common_tags
}

# Email subscription for GuardDuty findings
resource "aws_sns_topic_subscription" "guardduty_email_subscription" {
  count = local.enable_guardduty_current_env && var.guardduty_notification_email != "" ? 1 : 0

  topic_arn = aws_sns_topic.guardduty_notification_topic[0].arn
  protocol  = "email"
  endpoint  = var.guardduty_notification_email

  depends_on = [aws_sns_topic.guardduty_notification_topic]
}

# CloudWatch Event Rule to capture GuardDuty findings
resource "aws_cloudwatch_event_rule" "guardduty_finding_events" {
  count = local.enable_guardduty_current_env && var.guardduty_notification_email != "" ? 1 : 0

  name        = "${local.name_prefix}-guardduty-finding-events"
  description = "Captures GuardDuty findings"
  
  event_pattern = <<PATTERN
{
  "source": ["aws.guardduty"],
  "detail-type": ["GuardDuty Finding"]
}
PATTERN

  tags = local.common_tags
}

# CloudWatch Event Target to send findings to SNS
resource "aws_cloudwatch_event_target" "guardduty_finding_notifications" {
  count = local.enable_guardduty_current_env && var.guardduty_notification_email != "" ? 1 : 0

  rule       = aws_cloudwatch_event_rule.guardduty_finding_events[0].name
  target_id  = "SendToSNS"
  arn        = aws_sns_topic.guardduty_notification_topic[0].arn

  depends_on = [
    aws_cloudwatch_event_rule.guardduty_finding_events,
    aws_sns_topic.guardduty_notification_topic
  ]
}

# -----------------------------------------------------------------------
# AWS Config Resources
# -----------------------------------------------------------------------

# S3 bucket for AWS Config recordings
resource "aws_s3_bucket" "config_bucket" {
  count = local.enable_config_current_env ? 1 : 0

  bucket        = "${local.name_prefix}-config-${data.aws_caller_identity.current.account_id}-${var.aws_region}"
  force_destroy = local.config_bucket_force_destroy_current_env
  tags          = local.common_tags
}

# Encrypt the AWS Config S3 bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "config_bucket_encryption" {
  count = local.enable_config_current_env ? 1 : 0

  bucket = aws_s3_bucket.config_bucket[0].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }

  depends_on = [aws_s3_bucket.config_bucket]
}

# Block public access to the AWS Config S3 bucket
resource "aws_s3_bucket_public_access_block" "config_bucket_public_access_block" {
  count = local.enable_config_current_env ? 1 : 0

  bucket                  = aws_s3_bucket.config_bucket[0].id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true

  depends_on = [aws_s3_bucket.config_bucket]
}

# IAM role for AWS Config
resource "aws_iam_role" "config_role" {
  count = local.enable_config_current_env ? 1 : 0

  name = "${local.name_prefix}-config-role"
  
  assume_role_policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "config.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
POLICY

  tags = local.common_tags
}

# Attach the AWS managed policy for Config to the IAM role
resource "aws_iam_role_policy_attachment" "config_policy_attachment" {
  count = local.enable_config_current_env ? 1 : 0

  role       = aws_iam_role.config_role[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"

  depends_on = [aws_iam_role.config_role]
}

# AWS Config recorder for compliance monitoring
resource "aws_config_configuration_recorder" "config_configuration_recorder" {
  count = local.enable_config_current_env ? 1 : 0

  name     = "${local.name_prefix}-config-recorder"
  role_arn = aws_iam_role.config_role[0].arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }

  depends_on = [aws_iam_role.config_role]
}

# AWS Config delivery channel for storing configuration snapshots
resource "aws_config_delivery_channel" "config_delivery_channel" {
  count = local.enable_config_current_env ? 1 : 0

  name           = "${local.name_prefix}-config-delivery-channel"
  s3_bucket_name = aws_s3_bucket.config_bucket[0].bucket

  snapshot_delivery_properties {
    delivery_frequency = "Six_Hours"
  }

  depends_on = [
    aws_s3_bucket.config_bucket,
    aws_config_configuration_recorder.config_configuration_recorder
  ]
}

# Enable the AWS Config recorder
resource "aws_config_configuration_recorder_status" "config_recorder_status" {
  count = local.enable_config_current_env ? 1 : 0

  name       = aws_config_configuration_recorder.config_configuration_recorder[0].name
  is_enabled = true

  depends_on = [aws_config_delivery_channel.config_delivery_channel]
}

# -----------------------------------------------------------------------
# Security Hub Resources
# -----------------------------------------------------------------------

# Enable AWS Security Hub for the account
resource "aws_securityhub_account" "security_hub" {
  count = local.enable_security_hub_current_env ? 1 : 0
}

# Subscribe to security standards in Security Hub
resource "aws_securityhub_standards_subscription" "security_hub_standards" {
  count = local.enable_security_hub_current_env ? 1 : 0

  dynamic "standards_arn" {
    for_each = var.security_hub_standards
    content {
      standards_arn = standards_arn.value
    }
  }

  depends_on = [aws_securityhub_account.security_hub]
}

# -----------------------------------------------------------------------
# Shield Advanced Resources
# -----------------------------------------------------------------------

# AWS Shield Advanced protection for the Application Load Balancer
resource "aws_shield_protection" "shield_protection" {
  count = local.enable_shield_advanced_current_env ? 1 : 0

  name         = "${local.name_prefix}-alb-protection"
  resource_arn = data.aws_lb.main.arn
  tags         = local.common_tags
}