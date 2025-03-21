# Application Load Balancer outputs
output "alb_dns_name" {
  description = "DNS name of the application load balancer for accessing the Metronomics Platform"
  value       = aws_lb.alb.dns_name
  type        = string
}

output "alb_arn" {
  description = "ARN of the application load balancer for integration with WAF and monitoring"
  value       = aws_lb.alb.arn
  type        = string
}

output "alb_zone_id" {
  description = "Route 53 zone ID of the load balancer for DNS alias records"
  value       = aws_lb.alb.zone_id
  type        = string
}

# ECS Cluster outputs
output "ecs_cluster_name" {
  description = "Name of the ECS cluster for service deployment and monitoring"
  value       = aws_ecs_cluster.ecs_cluster.name
  type        = string
}

output "ecs_cluster_arn" {
  description = "ARN of the ECS cluster for IAM policies and CloudWatch metrics"
  value       = aws_ecs_cluster.ecs_cluster.arn
  type        = string
}

# ECS Service outputs
output "ecs_service_names" {
  description = "Names of the ECS services for monitoring and deployment automation"
  value = {
    frontend = aws_ecs_service.frontend_service.name
    api      = aws_ecs_service.api_service.name
    worker   = aws_ecs_service.worker_service.name
  }
  type = map(string)
}

output "ecs_service_arns" {
  description = "ARNs of the ECS services for IAM policies and CloudWatch metrics"
  value = {
    frontend = aws_ecs_service.frontend_service.id
    api      = aws_ecs_service.api_service.id
    worker   = aws_ecs_service.worker_service.id
  }
  type = map(string)
}

# ECR Repository outputs
output "ecr_repository_urls" {
  description = "URLs of the ECR repositories for container image pushing and pulling"
  value = {
    frontend = aws_ecr_repository.frontend_repository.repository_url
    api      = aws_ecr_repository.api_repository.repository_url
    worker   = aws_ecr_repository.worker_repository.repository_url
  }
  type = map(string)
}

# IAM Role outputs
output "task_execution_role_arn" {
  description = "ARN of the task execution role for ECS tasks"
  value       = aws_iam_role.ecs_task_execution_role.arn
  type        = string
}

output "task_role_arn" {
  description = "ARN of the task role for ECS tasks to access AWS services"
  value       = aws_iam_role.ecs_task_role.arn
  type        = string
}

# ALB Target Group outputs
output "alb_target_group_arns" {
  description = "ARNs of the ALB target groups for service registration and health monitoring"
  value = {
    frontend = aws_lb_target_group.alb_target_group_frontend.arn
    api      = aws_lb_target_group.alb_target_group_api.arn
  }
  type = map(string)
}

# ALB Listener outputs
output "alb_listener_arns" {
  description = "ARNs of the ALB listeners for rule management and certificate updates"
  value = {
    http  = aws_lb_listener.alb_listener_http.arn
    https = aws_lb_listener.alb_listener_https.arn
  }
  type = map(string)
}

# CloudWatch Log Group outputs
output "cloudwatch_log_group_names" {
  description = "Names of the CloudWatch log groups for log monitoring and analysis"
  value = {
    frontend = aws_cloudwatch_log_group.cloudwatch_log_group_frontend.name
    api      = aws_cloudwatch_log_group.cloudwatch_log_group_api.name
    worker   = aws_cloudwatch_log_group.cloudwatch_log_group_worker.name
  }
  type = map(string)
}

# Domain name output
output "domain_name" {
  description = "Fully qualified domain name configured for the application"
  value       = local.domain
  type        = string
}

# Auto Scaling Target outputs
output "auto_scaling_target_arns" {
  description = "Resource IDs of the auto-scaling targets for ECS services"
  value = {
    frontend = var.enable_auto_scaling ? aws_appautoscaling_target.frontend_auto_scaling_target[0].resource_id : ""
    api      = var.enable_auto_scaling ? aws_appautoscaling_target.api_auto_scaling_target[0].resource_id : ""
    worker   = var.enable_auto_scaling ? aws_appautoscaling_target.worker_auto_scaling_target[0].resource_id : ""
  }
  type = map(string)
}

# Task Definition outputs
output "task_definition_arns" {
  description = "ARNs of the ECS task definitions for deployment and updates"
  value = {
    frontend = aws_ecs_task_definition.frontend_task_definition.arn
    api      = aws_ecs_task_definition.api_task_definition.arn
    worker   = aws_ecs_task_definition.worker_task_definition.arn
  }
  type = map(string)
}

# Route53 Record output
output "route53_record_name" {
  description = "The Route53 record name created for the application"
  value       = aws_route53_record.route53_record.name
  type        = string
}