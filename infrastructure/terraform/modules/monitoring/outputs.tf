# CloudWatch Dashboard outputs
output "cloudwatch_dashboard_url" {
  description = "URL to access the CloudWatch dashboard for the Metronomics Platform"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

# Alarm notification outputs
output "alarm_topic_arn" {
  description = "ARN of the SNS topic for CloudWatch alarms"
  value       = aws_sns_topic.alarm_topic.arn
}

# Honeycomb integration outputs
output "honeycomb_dataset" {
  description = "Name of the Honeycomb dataset for application metrics"
  value       = "${var.project_name}-${var.environment}-metrics"
}

output "honeycomb_exporter_function_name" {
  description = "Name of the Lambda function that exports CloudWatch metrics to Honeycomb"
  value       = aws_lambda_function.honeycomb_exporter.function_name
}

# CloudWatch alarms outputs
output "cloudwatch_alarms" {
  description = "Map of CloudWatch alarm ARNs for different monitored resources"
  value = {
    frontend_cpu       = aws_cloudwatch_metric_alarm.ecs_cpu_high_frontend.arn
    frontend_memory    = aws_cloudwatch_metric_alarm.ecs_memory_high_frontend.arn
    api_cpu            = aws_cloudwatch_metric_alarm.ecs_cpu_high_api.arn
    api_memory         = aws_cloudwatch_metric_alarm.ecs_memory_high_api.arn
    worker_cpu         = aws_cloudwatch_metric_alarm.ecs_cpu_high_worker.arn
    worker_memory      = aws_cloudwatch_metric_alarm.ecs_memory_high_worker.arn
    alb_5xx            = aws_cloudwatch_metric_alarm.alb_5xx_error_high.arn
    alb_4xx            = aws_cloudwatch_metric_alarm.alb_4xx_error_high.arn
    alb_response_time  = aws_cloudwatch_metric_alarm.alb_response_time_high.arn
    db_cpu             = aws_cloudwatch_metric_alarm.db_cpu_high.arn
    db_connections     = aws_cloudwatch_metric_alarm.db_connections_high.arn
    db_storage         = aws_cloudwatch_metric_alarm.db_storage_low.arn
  }
}

# Log group outputs
output "log_group_name" {
  description = "Name of the CloudWatch log group for Honeycomb exporter logs"
  value       = aws_cloudwatch_log_group.honeycomb_logs.name
}

# Monitoring status
output "monitoring_enabled" {
  description = "Indicates that monitoring is enabled for this environment"
  value       = true
}