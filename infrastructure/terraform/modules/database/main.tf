# Provider for AWS resources
provider "aws" {
  version = "~> 4.0"
}

# Provider for random values
provider "random" {
  version = "~> 3.0"
}

# Data sources to get information about the current AWS account and region
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Local values for resource naming and configuration
locals {
  db_identifier           = "${var.project_name}-${var.environment}-db"
  read_replica_identifier = "${var.project_name}-${var.environment}-read-replica"
  dr_replica_identifier   = "${var.project_name}-${var.environment}-dr-replica"
  final_snapshot_identifier = "${var.project_name}-${var.environment}-final-snapshot-${formatdate("YYYYMMDDhhmmss", timestamp())}"
  
  db_instance_class      = lookup(var.db_instance_class, var.environment, "db.t3.medium")
  db_multi_az            = lookup(var.db_multi_az, var.environment, false)
  db_allocated_storage   = lookup(var.db_allocated_storage, var.environment, 20)
  backup_retention_period = lookup(var.backup_retention_days, var.environment, 7)
  enable_performance_insights = lookup(var.enable_performance_insights, var.environment, false)
  performance_insights_retention_period = lookup(var.performance_insights_retention_period, var.environment, 7)
  enable_deletion_protection = lookup(var.enable_deletion_protection, var.environment, false)
  skip_final_snapshot    = lookup(var.skip_final_snapshot, var.environment, true)
  enable_read_replica    = lookup(var.enable_read_replica, var.environment, false)
  alarm_connections_threshold = lookup(var.alarm_connections_threshold, var.environment, 80)
  
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
    Service     = "Database"
  }
}

# Subnet group for the RDS instance that spans multiple availability zones
resource "aws_db_subnet_group" "main" {
  name        = "${local.db_identifier}-subnet-group"
  subnet_ids  = var.subnet_ids
  description = "Subnet group for ${var.project_name} ${var.environment} database"
  tags        = local.common_tags
}

# Parameter group for PostgreSQL 15.x with optimized settings
resource "aws_db_parameter_group" "postgres15" {
  name        = "${local.db_identifier}-pg15-params"
  family      = "postgres15"
  description = "Custom parameter group for PostgreSQL 15 - ${var.project_name} ${var.environment}"
  
  parameter {
    name  = "log_connections"
    value = "1"
  }
  
  parameter {
    name  = "log_disconnections"
    value = "1"
  }
  
  parameter {
    name  = "log_statement"
    value = "ddl"
  }
  
  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }
  
  parameter {
    name  = "shared_buffers"
    value = "{DBInstanceClassMemory/32768}MB"
  }
  
  parameter {
    name  = "max_connections"
    value = "{DBInstanceClassMemory/9531392}"
  }
  
  parameter {
    name  = "work_mem"
    value = "{DBInstanceClassMemory/65536}MB"
  }
  
  parameter {
    name  = "maintenance_work_mem"
    value = "{DBInstanceClassMemory/16384}MB"
  }
  
  parameter {
    name  = "effective_cache_size"
    value = "{DBInstanceClassMemory/8192}MB"
  }
  
  parameter {
    name  = "autovacuum"
    value = "1"
  }
  
  tags = local.common_tags
}

# Generate a random password for the database if not provided
resource "random_password" "db_password" {
  length      = 16
  special     = false
  min_upper   = 2
  min_lower   = 2
  min_numeric = 2
}

# AWS Secrets Manager secret to store database credentials securely
resource "aws_secretsmanager_secret" "db_credentials" {
  name        = "${local.db_identifier}-credentials"
  description = "Database credentials for ${var.project_name} ${var.environment}"
  recovery_window_in_days = 7
  tags        = local.common_tags
}

# Current version of the database credentials secret
resource "aws_secretsmanager_secret_version" "db_credentials_version" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = var.db_username
    password = coalesce(var.db_password, random_password.db_password.result)
    engine = "postgres"
    host = aws_db_instance.main.address
    port = aws_db_instance.main.port
    dbname = var.db_name
    dbInstanceIdentifier = aws_db_instance.main.id
  })
}

# Primary PostgreSQL RDS instance for the Metronomics Platform
resource "aws_db_instance" "main" {
  identifier              = local.db_identifier
  engine                  = "postgres"
  engine_version          = "15.3"
  instance_class          = local.db_instance_class
  allocated_storage       = local.db_allocated_storage
  max_allocated_storage   = local.db_allocated_storage * 2
  storage_type            = "gp3"
  storage_encrypted       = var.enable_encryption
  
  db_name                 = var.db_name
  username                = var.db_username
  password                = coalesce(var.db_password, random_password.db_password.result)
  port                    = 5432
  
  multi_az                = local.db_multi_az
  db_subnet_group_name    = aws_db_subnet_group.main.name
  vpc_security_group_ids  = [var.security_group_id]
  parameter_group_name    = aws_db_parameter_group.postgres15.name
  
  backup_retention_period = local.backup_retention_period
  backup_window           = "02:00-06:00"
  maintenance_window      = "Sun:06:00-Sun:10:00"
  
  auto_minor_version_upgrade = true
  allow_major_version_upgrade = false
  apply_immediately        = false
  
  skip_final_snapshot      = local.skip_final_snapshot
  final_snapshot_identifier = local.final_snapshot_identifier
  deletion_protection      = local.enable_deletion_protection
  
  performance_insights_enabled = local.enable_performance_insights
  performance_insights_retention_period = local.enable_performance_insights ? local.performance_insights_retention_period : null
  
  enabled_cloudwatch_logs_exports = var.enable_cloudwatch_logs_export ? ["postgresql", "upgrade"] : []
  
  copy_tags_to_snapshot     = true
  replicate_source_db       = var.is_replica ? var.source_db_arn : null
  
  tags = local.common_tags
}

# Read replica for the primary PostgreSQL RDS instance to distribute read load
resource "aws_db_instance" "read_replica" {
  count                   = local.enable_read_replica ? 1 : 0
  
  identifier              = local.read_replica_identifier
  replicate_source_db     = aws_db_instance.main.identifier
  instance_class          = local.db_instance_class
  storage_type            = "gp3"
  storage_encrypted       = var.enable_encryption
  
  port                    = 5432
  multi_az                = false
  vpc_security_group_ids  = [var.security_group_id]
  parameter_group_name    = aws_db_parameter_group.postgres15.name
  
  backup_retention_period = 0
  auto_minor_version_upgrade = true
  apply_immediately      = false
  
  skip_final_snapshot    = true
  deletion_protection    = false
  
  performance_insights_enabled = local.enable_performance_insights
  performance_insights_retention_period = local.enable_performance_insights ? local.performance_insights_retention_period : null
  
  enabled_cloudwatch_logs_exports = var.enable_cloudwatch_logs_export ? ["postgresql", "upgrade"] : []
  
  copy_tags_to_snapshot  = true
  
  tags = merge(local.common_tags, {
    Role = "ReadReplica"
  })
}

# Disaster recovery replica for the primary PostgreSQL RDS instance in a different region
resource "aws_db_instance" "dr_replica" {
  count                   = var.is_replica ? 1 : 0
  
  identifier              = local.dr_replica_identifier
  replicate_source_db     = var.source_db_arn
  instance_class          = local.db_instance_class
  storage_type            = "gp3"
  storage_encrypted       = var.enable_encryption
  
  port                    = 5432
  multi_az                = false
  vpc_security_group_ids  = [var.security_group_id]
  parameter_group_name    = aws_db_parameter_group.postgres15.name
  
  backup_retention_period = local.backup_retention_period
  auto_minor_version_upgrade = true
  apply_immediately      = false
  
  skip_final_snapshot    = local.skip_final_snapshot
  final_snapshot_identifier = local.final_snapshot_identifier
  deletion_protection    = local.enable_deletion_protection
  
  performance_insights_enabled = local.enable_performance_insights
  performance_insights_retention_period = local.enable_performance_insights ? local.performance_insights_retention_period : null
  
  enabled_cloudwatch_logs_exports = var.enable_cloudwatch_logs_export ? ["postgresql", "upgrade"] : []
  
  copy_tags_to_snapshot  = true
  
  tags = merge(local.common_tags, {
    Role = "DisasterRecovery"
  })
}

# CloudWatch alarm for high CPU utilization on the RDS instance
resource "aws_cloudwatch_metric_alarm" "db_cpu_utilization_high" {
  alarm_name          = "${local.db_identifier}-cpu-utilization-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = var.alarm_cpu_threshold
  alarm_description   = "This metric monitors RDS CPU utilization"
  alarm_actions       = var.alarm_actions
  ok_actions          = var.alarm_actions
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }
  
  tags = local.common_tags
}

# CloudWatch alarm for low free storage space on the RDS instance
resource "aws_cloudwatch_metric_alarm" "db_free_storage_space_low" {
  alarm_name          = "${local.db_identifier}-free-storage-space-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 3
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = local.db_allocated_storage * 1024 * 1024 * 1024 * var.alarm_storage_threshold_percent / 100
  alarm_description   = "This metric monitors RDS free storage space"
  alarm_actions       = var.alarm_actions
  ok_actions          = var.alarm_actions
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }
  
  tags = local.common_tags
}

# CloudWatch alarm for high database connection count
resource "aws_cloudwatch_metric_alarm" "db_connection_count_high" {
  alarm_name          = "${local.db_identifier}-connection-count-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = local.alarm_connections_threshold
  alarm_description   = "This metric monitors RDS connection count"
  alarm_actions       = var.alarm_actions
  ok_actions          = var.alarm_actions
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }
  
  tags = local.common_tags
}