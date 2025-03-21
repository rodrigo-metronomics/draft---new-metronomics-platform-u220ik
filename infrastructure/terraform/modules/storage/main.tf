# Storage module for the Metronomics Platform

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

# Configure the primary AWS region provider
provider "aws" {
  region = var.aws_region
}

# Configure the secondary AWS region provider for disaster recovery
provider "aws" {
  alias  = "secondary"
  region = var.secondary_aws_region
}

# Get information about current AWS account and region
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
  enable_disaster_recovery = lookup(var.enable_dr, var.environment, false)
}

# S3 bucket for file storage
resource "aws_s3_bucket" "main" {
  bucket = "${lower(var.project_name)}-${var.environment}-storage"
  tags   = local.common_tags
}

resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "main" {
  bucket = aws_s3_bucket.main.id
  rule {
    id     = "transition-to-ia"
    status = "Enabled"
    transition {
      days          = lookup(var.s3_lifecycle_transition_days, var.environment, 30)
      storage_class = "STANDARD_IA"
    }
  }
  rule {
    id     = "expire-objects"
    status = "Enabled"
    expiration {
      days = lookup(var.s3_lifecycle_expiration_days, var.environment, 90)
    }
  }
}

resource "aws_s3_bucket_public_access_block" "main" {
  bucket                  = aws_s3_bucket.main.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_cors_configuration" "main" {
  bucket = aws_s3_bucket.main.id
  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = ["https://*.${var.project_name}.io", "http://localhost:*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# S3 bucket for disaster recovery (secondary region)
resource "aws_s3_bucket" "dr" {
  count    = local.enable_disaster_recovery ? 1 : 0
  provider = aws.secondary
  bucket   = "${lower(var.project_name)}-${var.environment}-dr-storage"
  tags     = merge(local.common_tags, { Region = "Secondary" })
}

resource "aws_s3_bucket_versioning" "dr" {
  count    = local.enable_disaster_recovery ? 1 : 0
  provider = aws.secondary
  bucket   = aws_s3_bucket.dr[0].id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "dr" {
  count    = local.enable_disaster_recovery ? 1 : 0
  provider = aws.secondary
  bucket   = aws_s3_bucket.dr[0].id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "dr" {
  count                   = local.enable_disaster_recovery ? 1 : 0
  provider                = aws.secondary
  bucket                  = aws_s3_bucket.dr[0].id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# IAM role and policy for S3 replication
resource "aws_iam_role" "replication" {
  count = local.enable_disaster_recovery ? 1 : 0
  name  = "${var.project_name}-${var.environment}-s3-replication-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "sts:AssumeRole",
        Principal = {
          Service = "s3.amazonaws.com"
        },
        Effect = "Allow",
        Sid    = ""
      }
    ]
  })
  tags = local.common_tags
}

resource "aws_iam_policy" "replication" {
  count = local.enable_disaster_recovery ? 1 : 0
  name  = "${var.project_name}-${var.environment}-s3-replication-policy"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = [
          "s3:GetReplicationConfiguration",
          "s3:ListBucket"
        ],
        Effect = "Allow",
        Resource = [
          aws_s3_bucket.main.arn
        ]
      },
      {
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ],
        Effect = "Allow",
        Resource = [
          "${aws_s3_bucket.main.arn}/*"
        ]
      },
      {
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ],
        Effect   = "Allow",
        Resource = "${aws_s3_bucket.dr[0].arn}/*"
      }
    ]
  })
  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "replication" {
  count      = local.enable_disaster_recovery ? 1 : 0
  role       = aws_iam_role.replication[0].name
  policy_arn = aws_iam_policy.replication[0].arn
}

resource "aws_s3_bucket_replication_configuration" "main" {
  count  = local.enable_disaster_recovery ? 1 : 0
  bucket = aws_s3_bucket.main.id
  role   = aws_iam_role.replication[0].arn
  rule {
    id     = "entire-bucket"
    status = "Enabled"
    destination {
      bucket        = aws_s3_bucket.dr[0].arn
      storage_class = "STANDARD"
    }
  }
}

# ElastiCache Redis for caching
resource "aws_elasticache_subnet_group" "redis" {
  name       = "${var.project_name}-${var.environment}-redis-subnet-group"
  subnet_ids = var.subnet_ids
  tags       = local.common_tags
}

resource "aws_elasticache_parameter_group" "redis" {
  name        = "${var.project_name}-${var.environment}-redis-params"
  family      = "redis6.x"
  description = "Redis parameter group for ${var.project_name} ${var.environment}"
  parameter {
    name  = "maxmemory-policy"
    value = "volatile-lru"
  }
  parameter {
    name  = "notify-keyspace-events"
    value = "Ex"
  }
  tags = local.common_tags
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "${var.project_name}-${var.environment}-redis"
  description                = "Redis cluster for ${var.project_name} ${var.environment}"
  node_type                  = lookup(var.redis_node_type, var.environment, "cache.t3.small")
  num_cache_clusters         = lookup(var.redis_num_cache_nodes, var.environment, 1)
  parameter_group_name       = aws_elasticache_parameter_group.redis.name
  subnet_group_name          = aws_elasticache_subnet_group.redis.name
  security_group_ids         = [var.security_group_id]
  port                       = 6379
  engine                     = "redis"
  engine_version             = "6.x"
  automatic_failover_enabled = var.environment == "prod" || var.environment == "staging" ? true : false
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  multi_az_enabled           = var.environment == "prod" || var.environment == "staging" ? true : false
  auto_minor_version_upgrade = true
  maintenance_window         = "sun:05:00-sun:09:00"
  snapshot_window            = "00:00-04:00"
  snapshot_retention_limit   = var.environment == "prod" ? 7 : var.environment == "staging" ? 3 : 1
  tags                       = local.common_tags
}