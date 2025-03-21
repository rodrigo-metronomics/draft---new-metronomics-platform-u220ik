# Output values for the storage module

# S3 Bucket outputs
output "s3_bucket_name" {
  description = "Name of the primary S3 bucket for file storage"
  value       = aws_s3_bucket.main.bucket
}

output "s3_bucket_id" {
  description = "ID of the primary S3 bucket for file storage"
  value       = aws_s3_bucket.main.id
}

output "s3_bucket_arn" {
  description = "ARN of the primary S3 bucket for file storage"
  value       = aws_s3_bucket.main.arn
}

# Disaster Recovery S3 Bucket outputs (if enabled)
output "s3_dr_bucket_name" {
  description = "Name of the disaster recovery S3 bucket (if enabled)"
  value       = local.enable_disaster_recovery ? aws_s3_bucket.dr[0].bucket : ""
}

output "s3_dr_bucket_id" {
  description = "ID of the disaster recovery S3 bucket (if enabled)"
  value       = local.enable_disaster_recovery ? aws_s3_bucket.dr[0].id : ""
}

# Redis outputs
output "redis_endpoint" {
  description = "Primary endpoint address of the ElastiCache Redis cluster"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
}

output "redis_port" {
  description = "Port number of the ElastiCache Redis cluster"
  value       = aws_elasticache_replication_group.redis.port
}

output "redis_connection_string" {
  description = "Connection string for the ElastiCache Redis cluster"
  value       = "redis://${aws_elasticache_replication_group.redis.primary_endpoint_address}:${aws_elasticache_replication_group.redis.port}"
}

output "redis_auth_token" {
  description = "Authentication token for the ElastiCache Redis cluster"
  value       = aws_elasticache_replication_group.redis.auth_token
  sensitive   = true
}