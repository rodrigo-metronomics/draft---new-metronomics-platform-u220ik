# Provider configuration is expected in the root module

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Get domain details
data "aws_route53_zone" "domain_zone" {
  name         = var.domain_name
  private_zone = false
}

data "aws_acm_certificate" "domain_certificate" {
  domain      = "*.${var.domain_name}"
  statuses    = ["ISSUED"]
  most_recent = true
}

# Get secrets
data "aws_secretsmanager_secret" "firebase_api_key" {
  name = "${var.project_name}/${var.environment}/firebase-api-key"
}

data "aws_secretsmanager_secret_version" "firebase_api_key" {
  secret_id = data.aws_secretsmanager_secret.firebase_api_key.id
}

data "aws_secretsmanager_secret" "firebase_service_account" {
  name = "${var.project_name}/${var.environment}/firebase-service-account"
}

data "aws_secretsmanager_secret_version" "firebase_service_account" {
  secret_id = data.aws_secretsmanager_secret.firebase_service_account.id
}

# Local variables
locals {
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }

  domain = var.subdomain_prefix[var.environment] != "" ? "${var.subdomain_prefix[var.environment]}.${var.domain_name}" : var.domain_name

  container_environment = {
    frontend = {
      NODE_ENV         = var.environment
      API_URL          = "${local.domain}/api"
      FIREBASE_API_KEY = data.aws_secretsmanager_secret_version.firebase_api_key.secret_string
    }
    api = {
      NODE_ENV                  = var.environment
      DB_HOST                   = var.db_endpoint
      REDIS_HOST                = var.redis_endpoint
      S3_BUCKET                 = var.s3_bucket_name
      FIREBASE_SERVICE_ACCOUNT  = data.aws_secretsmanager_secret_version.firebase_service_account.secret_string
    }
    worker = {
      NODE_ENV                  = var.environment
      DB_HOST                   = var.db_endpoint
      REDIS_HOST                = var.redis_endpoint
      S3_BUCKET                 = var.s3_bucket_name
      FIREBASE_SERVICE_ACCOUNT  = data.aws_secretsmanager_secret_version.firebase_service_account.secret_string
    }
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "ecs_cluster" {
  name = "${var.project_name}-${var.environment}-cluster"
  setting {
    name  = "containerInsights"
    value = var.enable_container_insights ? "enabled" : "disabled"
  }
  tags = local.common_tags
}

# IAM Roles and Policies
resource "aws_iam_role" "ecs_task_execution_role" {
  name = "${var.project_name}-${var.environment}-task-execution-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_policy_attachment" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "ecs_task_role" {
  name = "${var.project_name}-${var.environment}-task-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
  tags = local.common_tags
}

resource "aws_iam_policy" "ecs_task_s3_policy" {
  name = "${var.project_name}-${var.environment}-task-s3-policy"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket",
          "s3:DeleteObject"
        ]
        Effect = "Allow"
        Resource = [
          "arn:aws:s3:::${var.s3_bucket_name}",
          "arn:aws:s3:::${var.s3_bucket_name}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_s3_policy_attachment" {
  role       = aws_iam_role.ecs_task_role.name
  policy_arn = aws_iam_policy.ecs_task_s3_policy.arn
}

resource "aws_iam_policy" "ecs_task_secrets_policy" {
  name = "${var.project_name}-${var.environment}-task-secrets-policy"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Effect = "Allow"
        Resource = [
          "${data.aws_secretsmanager_secret.firebase_api_key.arn}",
          "${data.aws_secretsmanager_secret.firebase_service_account.arn}"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_secrets_policy_attachment" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = aws_iam_policy.ecs_task_secrets_policy.arn
}

# ECR Repositories
resource "aws_ecr_repository" "frontend_repository" {
  name                 = "${var.project_name}-${var.environment}-frontend"
  image_tag_mutability = var.ecr_image_tag_mutability
  image_scanning_configuration {
    scan_on_push = var.ecr_scan_on_push
  }
  tags = local.common_tags
}

resource "aws_ecr_repository" "api_repository" {
  name                 = "${var.project_name}-${var.environment}-api"
  image_tag_mutability = var.ecr_image_tag_mutability
  image_scanning_configuration {
    scan_on_push = var.ecr_scan_on_push
  }
  tags = local.common_tags
}

resource "aws_ecr_repository" "worker_repository" {
  name                 = "${var.project_name}-${var.environment}-worker"
  image_tag_mutability = var.ecr_image_tag_mutability
  image_scanning_configuration {
    scan_on_push = var.ecr_scan_on_push
  }
  tags = local.common_tags
}

# ECS Task Definitions
resource "aws_ecs_task_definition" "frontend_task_definition" {
  family                   = "${var.project_name}-${var.environment}-frontend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.ecs_task_cpu[var.environment].frontend
  memory                   = var.ecs_task_memory[var.environment].frontend
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn
  
  container_definitions = jsonencode([
    {
      name = "frontend"
      image = "${aws_ecr_repository.frontend_repository.repository_url}:latest"
      essential = true
      portMappings = [
        {
          containerPort = 80
          hostPort = 80
          protocol = "tcp"
        }
      ]
      environment = [
        for key, value in local.container_environment.frontend : 
        {
          name = key
          value = value
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group" = "/ecs/${var.project_name}-${var.environment}-frontend"
          "awslogs-region" = var.aws_region
          "awslogs-stream-prefix" = "ecs"
          "awslogs-create-group" = "true"
        }
      }
      healthCheck = {
        command = ["CMD-SHELL", "curl -f http://localhost/health || exit 1"]
        interval = 30
        timeout = 5
        retries = 3
        startPeriod = 60
      }
    }
  ])
  
  tags = local.common_tags
}

resource "aws_ecs_task_definition" "api_task_definition" {
  family                   = "${var.project_name}-${var.environment}-api"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.ecs_task_cpu[var.environment].api
  memory                   = var.ecs_task_memory[var.environment].api
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn
  
  container_definitions = jsonencode([
    {
      name = "api"
      image = "${aws_ecr_repository.api_repository.repository_url}:latest"
      essential = true
      portMappings = [
        {
          containerPort = 3000
          hostPort = 3000
          protocol = "tcp"
        }
      ]
      environment = [
        for key, value in local.container_environment.api : 
        {
          name = key
          value = value
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group" = "/ecs/${var.project_name}-${var.environment}-api"
          "awslogs-region" = var.aws_region
          "awslogs-stream-prefix" = "ecs"
          "awslogs-create-group" = "true"
        }
      }
      healthCheck = {
        command = ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"]
        interval = 30
        timeout = 5
        retries = 3
        startPeriod = 60
      }
    }
  ])
  
  tags = local.common_tags
}

resource "aws_ecs_task_definition" "worker_task_definition" {
  family                   = "${var.project_name}-${var.environment}-worker"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.ecs_task_cpu[var.environment].worker
  memory                   = var.ecs_task_memory[var.environment].worker
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn
  
  container_definitions = jsonencode([
    {
      name = "worker"
      image = "${aws_ecr_repository.worker_repository.repository_url}:latest"
      essential = true
      environment = [
        for key, value in local.container_environment.worker : 
        {
          name = key
          value = value
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group" = "/ecs/${var.project_name}-${var.environment}-worker"
          "awslogs-region" = var.aws_region
          "awslogs-stream-prefix" = "ecs"
          "awslogs-create-group" = "true"
        }
      }
    }
  ])
  
  tags = local.common_tags
}

# Load Balancer
resource "aws_lb" "alb" {
  name               = "${var.project_name}-${var.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.app_security_group_id]
  subnets            = var.public_subnet_ids
  enable_deletion_protection = var.environment == "prod" ? true : false
  
  tags = local.common_tags
}

resource "aws_lb_target_group" "alb_target_group_frontend" {
  name     = "${var.project_name}-${var.environment}-frontend-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = var.vpc_id
  target_type = "ip"
  
  health_check {
    enabled             = true
    path                = "/health"
    port                = "traffic-port"
    healthy_threshold   = 3
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    matcher             = "200"
  }
  
  tags = local.common_tags
}

resource "aws_lb_target_group" "alb_target_group_api" {
  name     = "${var.project_name}-${var.environment}-api-tg"
  port     = 3000
  protocol = "HTTP"
  vpc_id   = var.vpc_id
  target_type = "ip"
  
  health_check {
    enabled             = true
    path                = "/health"
    port                = "traffic-port"
    healthy_threshold   = 3
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    matcher             = "200"
  }
  
  tags = local.common_tags
}

resource "aws_lb_listener" "alb_listener_http" {
  load_balancer_arn = aws_lb.alb.arn
  port              = 80
  protocol          = "HTTP"
  
  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

resource "aws_lb_listener" "alb_listener_https" {
  load_balancer_arn = aws_lb.alb.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = data.aws_acm_certificate.domain_certificate.arn
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.alb_target_group_frontend.arn
  }
}

resource "aws_lb_listener_rule" "alb_listener_rule_api" {
  listener_arn = aws_lb_listener.alb_listener_https.arn
  priority     = 100
  
  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.alb_target_group_api.arn
  }
  
  condition {
    path_pattern {
      values = ["/api/*"]
    }
  }
}

# ECS Services
resource "aws_ecs_service" "frontend_service" {
  name                               = "${var.project_name}-${var.environment}-frontend"
  cluster                            = aws_ecs_cluster.ecs_cluster.id
  task_definition                    = aws_ecs_task_definition.frontend_task_definition.arn
  desired_count                      = var.ecs_service_min_capacity[var.environment].frontend
  launch_type                        = "FARGATE"
  platform_version                   = "LATEST"
  scheduling_strategy                = "REPLICA"
  deployment_maximum_percent         = var.deployment_maximum_percent
  deployment_minimum_healthy_percent = var.deployment_minimum_healthy_percent
  health_check_grace_period_seconds  = var.health_check_grace_period

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [var.app_security_group_id]
    assign_public_ip = false
  }
  
  load_balancer {
    target_group_arn = aws_lb_target_group.alb_target_group_frontend.arn
    container_name   = "frontend"
    container_port   = 80
  }
  
  deployment_controller {
    type = "ECS"
  }
  
  tags = local.common_tags
}

resource "aws_ecs_service" "api_service" {
  name                               = "${var.project_name}-${var.environment}-api"
  cluster                            = aws_ecs_cluster.ecs_cluster.id
  task_definition                    = aws_ecs_task_definition.api_task_definition.arn
  desired_count                      = var.ecs_service_min_capacity[var.environment].api
  launch_type                        = "FARGATE"
  platform_version                   = "LATEST"
  scheduling_strategy                = "REPLICA"
  deployment_maximum_percent         = var.deployment_maximum_percent
  deployment_minimum_healthy_percent = var.deployment_minimum_healthy_percent
  health_check_grace_period_seconds  = var.health_check_grace_period

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [var.app_security_group_id]
    assign_public_ip = false
  }
  
  load_balancer {
    target_group_arn = aws_lb_target_group.alb_target_group_api.arn
    container_name   = "api"
    container_port   = 3000
  }
  
  deployment_controller {
    type = "ECS"
  }
  
  tags = local.common_tags
}

resource "aws_ecs_service" "worker_service" {
  name                               = "${var.project_name}-${var.environment}-worker"
  cluster                            = aws_ecs_cluster.ecs_cluster.id
  task_definition                    = aws_ecs_task_definition.worker_task_definition.arn
  desired_count                      = var.ecs_service_min_capacity[var.environment].worker
  launch_type                        = "FARGATE"
  platform_version                   = "LATEST"
  scheduling_strategy                = "REPLICA"
  deployment_maximum_percent         = var.deployment_maximum_percent
  deployment_minimum_healthy_percent = var.deployment_minimum_healthy_percent

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [var.app_security_group_id]
    assign_public_ip = false
  }
  
  deployment_controller {
    type = "ECS"
  }
  
  tags = local.common_tags
}

# Auto Scaling
resource "aws_appautoscaling_target" "frontend_auto_scaling_target" {
  count              = var.enable_auto_scaling ? 1 : 0
  max_capacity       = var.ecs_service_max_capacity[var.environment].frontend
  min_capacity       = var.ecs_service_min_capacity[var.environment].frontend
  resource_id        = "service/${aws_ecs_cluster.ecs_cluster.name}/${aws_ecs_service.frontend_service.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "frontend_auto_scaling_policy" {
  count              = var.enable_auto_scaling ? 1 : 0
  name               = "${var.project_name}-${var.environment}-frontend-cpu-policy"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.frontend_auto_scaling_target[0].resource_id
  scalable_dimension = aws_appautoscaling_target.frontend_auto_scaling_target[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.frontend_auto_scaling_target[0].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70.0
    scale_in_cooldown  = var.scale_in_cooldown
    scale_out_cooldown = var.scale_out_cooldown
  }
}

resource "aws_appautoscaling_target" "api_auto_scaling_target" {
  count              = var.enable_auto_scaling ? 1 : 0
  max_capacity       = var.ecs_service_max_capacity[var.environment].api
  min_capacity       = var.ecs_service_min_capacity[var.environment].api
  resource_id        = "service/${aws_ecs_cluster.ecs_cluster.name}/${aws_ecs_service.api_service.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "api_auto_scaling_policy" {
  count              = var.enable_auto_scaling ? 1 : 0
  name               = "${var.project_name}-${var.environment}-api-cpu-policy"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.api_auto_scaling_target[0].resource_id
  scalable_dimension = aws_appautoscaling_target.api_auto_scaling_target[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.api_auto_scaling_target[0].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70.0
    scale_in_cooldown  = var.scale_in_cooldown
    scale_out_cooldown = var.scale_out_cooldown
  }
}

resource "aws_appautoscaling_target" "worker_auto_scaling_target" {
  count              = var.enable_auto_scaling ? 1 : 0
  max_capacity       = var.ecs_service_max_capacity[var.environment].worker
  min_capacity       = var.ecs_service_min_capacity[var.environment].worker
  resource_id        = "service/${aws_ecs_cluster.ecs_cluster.name}/${aws_ecs_service.worker_service.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "worker_auto_scaling_policy" {
  count              = var.enable_auto_scaling ? 1 : 0
  name               = "${var.project_name}-${var.environment}-worker-cpu-policy"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.worker_auto_scaling_target[0].resource_id
  scalable_dimension = aws_appautoscaling_target.worker_auto_scaling_target[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.worker_auto_scaling_target[0].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70.0
    scale_in_cooldown  = var.scale_in_cooldown
    scale_out_cooldown = var.scale_out_cooldown
  }
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "cloudwatch_log_group_frontend" {
  name              = "/ecs/${var.project_name}-${var.environment}-frontend"
  retention_in_days = 30
  tags              = local.common_tags
}

resource "aws_cloudwatch_log_group" "cloudwatch_log_group_api" {
  name              = "/ecs/${var.project_name}-${var.environment}-api"
  retention_in_days = 30
  tags              = local.common_tags
}

resource "aws_cloudwatch_log_group" "cloudwatch_log_group_worker" {
  name              = "/ecs/${var.project_name}-${var.environment}-worker"
  retention_in_days = 30
  tags              = local.common_tags
}

# DNS Configuration
resource "aws_route53_record" "route53_record" {
  zone_id = data.aws_route53_zone.domain_zone.zone_id
  name    = local.domain
  type    = "A"
  
  alias {
    name                   = aws_lb.alb.dns_name
    zone_id                = aws_lb.alb.zone_id
    evaluate_target_health = true
  }
}

# Outputs
output "alb_dns_name" {
  description = "DNS name of the application load balancer"
  value       = aws_lb.alb.dns_name
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.ecs_cluster.name
}

output "ecs_cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = aws_ecs_cluster.ecs_cluster.arn
}

output "ecs_service_names" {
  description = "Names of the ECS services"
  value = {
    frontend = aws_ecs_service.frontend_service.name
    api      = aws_ecs_service.api_service.name
    worker   = aws_ecs_service.worker_service.name
  }
}

output "ecs_service_arns" {
  description = "ARNs of the ECS services"
  value = {
    frontend = aws_ecs_service.frontend_service.id
    api      = aws_ecs_service.api_service.id
    worker   = aws_ecs_service.worker_service.id
  }
}

output "ecr_repository_urls" {
  description = "URLs of the ECR repositories"
  value = {
    frontend = aws_ecr_repository.frontend_repository.repository_url
    api      = aws_ecr_repository.api_repository.repository_url
    worker   = aws_ecr_repository.worker_repository.repository_url
  }
}

output "task_execution_role_arn" {
  description = "ARN of the task execution role"
  value       = aws_iam_role.ecs_task_execution_role.arn
}

output "task_role_arn" {
  description = "ARN of the task role"
  value       = aws_iam_role.ecs_task_role.arn
}

output "alb_target_group_arns" {
  description = "ARNs of the ALB target groups"
  value = {
    frontend = aws_lb_target_group.alb_target_group_frontend.arn
    api      = aws_lb_target_group.alb_target_group_api.arn
  }
}

output "alb_listener_arns" {
  description = "ARNs of the ALB listeners"
  value = {
    http  = aws_lb_listener.alb_listener_http.arn
    https = aws_lb_listener.alb_listener_https.arn
  }
}

output "alb_arn" {
  description = "ARN of the application load balancer"
  value       = aws_lb.alb.arn
}

output "domain_name" {
  description = "Domain name configured for the application"
  value       = local.domain
}