# Primary RDS instance outputs
output "db_instance_endpoint" {
  description = "The connection endpoint for the primary RDS instance"
  value       = aws_db_instance.main.endpoint
  type        = string
}

output "db_instance_address" {
  description = "The hostname of the primary RDS instance"
  value       = aws_db_instance.main.address
  type        = string
}

output "db_instance_port" {
  description = "The port on which the primary RDS instance accepts connections"
  value       = aws_db_instance.main.port
  type        = number
}

output "db_instance_id" {
  description = "The RDS instance identifier"
  value       = aws_db_instance.main.id
  type        = string
}

output "db_instance_arn" {
  description = "The ARN of the primary RDS instance"
  value       = aws_db_instance.main.arn
  type        = string
}

# Database information
output "db_name" {
  description = "The name of the PostgreSQL database"
  value       = var.db_name
  type        = string
}

output "db_username" {
  description = "The master username for the PostgreSQL database"
  value       = var.db_username
  type        = string
}

# Read replica outputs
output "read_replica_endpoint" {
  description = "The connection endpoint for the read replica RDS instance (if enabled)"
  value       = length(aws_db_instance.read_replica) > 0 ? aws_db_instance.read_replica[0].endpoint : ""
  type        = string
}

# Disaster recovery replica outputs
output "dr_replica_endpoint" {
  description = "The connection endpoint for the disaster recovery replica RDS instance (if enabled)"
  value       = length(aws_db_instance.dr_replica) > 0 ? aws_db_instance.dr_replica[0].endpoint : ""
  type        = string
}

# DB subnet and parameter groups
output "db_subnet_group_name" {
  description = "The name of the DB subnet group"
  value       = aws_db_subnet_group.main.name
  type        = string
}

output "db_parameter_group_name" {
  description = "The name of the DB parameter group"
  value       = aws_db_parameter_group.postgres15.name
  type        = string
}

# Secrets Manager
output "db_secret_arn" {
  description = "The ARN of the Secrets Manager secret containing database credentials"
  value       = aws_secretsmanager_secret.db_credentials.arn
  type        = string
}

# Connection strings (marked as sensitive)
output "connection_string" {
  description = "PostgreSQL connection string for the primary database instance"
  value       = "postgresql://${var.db_username}:${coalesce(var.db_password, random_password.db_password.result)}@${aws_db_instance.main.endpoint}/${var.db_name}"
  type        = string
  sensitive   = true
}

output "read_replica_connection_string" {
  description = "PostgreSQL connection string for the read replica database instance (if enabled)"
  value       = length(aws_db_instance.read_replica) > 0 ? "postgresql://${var.db_username}:${coalesce(var.db_password, random_password.db_password.result)}@${aws_db_instance.read_replica[0].endpoint}/${var.db_name}" : ""
  type        = string
  sensitive   = true
}

# CloudWatch alarm ARNs
output "cloudwatch_cpu_alarm_arn" {
  description = "The ARN of the CloudWatch alarm for high CPU utilization"
  value       = aws_cloudwatch_metric_alarm.db_cpu_utilization_high.arn
  type        = string
}

output "cloudwatch_storage_alarm_arn" {
  description = "The ARN of the CloudWatch alarm for low free storage space"
  value       = aws_cloudwatch_metric_alarm.db_free_storage_space_low.arn
  type        = string
}

output "cloudwatch_connections_alarm_arn" {
  description = "The ARN of the CloudWatch alarm for high database connection count"
  value       = aws_cloudwatch_metric_alarm.db_connection_count_high.arn
  type        = string
}

# Database instance configuration outputs
output "multi_az_enabled" {
  description = "Whether Multi-AZ deployment is enabled for the primary RDS instance"
  value       = aws_db_instance.main.multi_az
  type        = bool
}

output "backup_retention_period" {
  description = "The backup retention period in days"
  value       = aws_db_instance.main.backup_retention_period
  type        = number
}

output "performance_insights_enabled" {
  description = "Whether Performance Insights is enabled for the primary RDS instance"
  value       = aws_db_instance.main.performance_insights_enabled
  type        = bool
}