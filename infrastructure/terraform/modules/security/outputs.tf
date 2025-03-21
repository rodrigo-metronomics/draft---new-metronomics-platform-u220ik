# Outputs from the security module that can be referenced by other modules
# Provides essential identifiers for integrating security components with the rest of the infrastructure

# WAF Web ACL outputs
output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL if enabled, empty string otherwise"
  value       = local.enable_waf_current_env ? aws_wafv2_web_acl.waf_web_acl[0].arn : ""
}

output "waf_web_acl_id" {
  description = "ID of the WAF Web ACL if enabled, empty string otherwise"
  value       = local.enable_waf_current_env ? aws_wafv2_web_acl.waf_web_acl[0].id : ""
}

output "waf_enabled" {
  description = "Whether WAF is enabled for the current environment"
  value       = local.enable_waf_current_env
}

# GuardDuty outputs
output "guardduty_detector_id" {
  description = "ID of the GuardDuty detector if enabled, empty string otherwise"
  value       = local.enable_guardduty_current_env ? aws_guardduty_detector.guardduty_detector[0].id : ""
}

output "guardduty_notification_topic_arn" {
  description = "ARN of the SNS topic for GuardDuty notifications if enabled and email is provided, empty string otherwise"
  value       = local.enable_guardduty_current_env && var.guardduty_notification_email != "" ? aws_sns_topic.guardduty_notification_topic[0].arn : ""
}

output "guardduty_enabled" {
  description = "Whether GuardDuty is enabled for the current environment"
  value       = local.enable_guardduty_current_env
}

# Security Hub outputs
output "security_hub_enabled" {
  description = "Whether Security Hub is enabled for the current environment"
  value       = local.enable_security_hub_current_env
}

# AWS Config outputs
output "config_enabled" {
  description = "Whether AWS Config is enabled for the current environment"
  value       = local.enable_config_current_env
}

output "config_bucket_name" {
  description = "Name of the S3 bucket for AWS Config recordings if enabled, empty string otherwise"
  value       = local.enable_config_current_env ? aws_s3_bucket.config_bucket[0].bucket : ""
}

# Shield Advanced outputs
output "shield_advanced_enabled" {
  description = "Whether Shield Advanced is enabled for the current environment"
  value       = local.enable_shield_advanced_current_env
}

output "shield_protection_id" {
  description = "ID of the Shield Advanced protection for the ALB if enabled, empty string otherwise"
  value       = local.enable_shield_advanced_current_env ? aws_shield_protection.shield_protection[0].id : ""
}