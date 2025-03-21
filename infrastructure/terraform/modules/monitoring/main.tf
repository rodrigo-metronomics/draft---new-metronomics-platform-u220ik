# Provider dependencies declared in parent modules
# Using AWS provider ~> 4.0 and Archive provider ~> 2.0

# Local variables for reuse across resources
locals {
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
  
  alarm_actions = [aws_sns_topic.alarm_topic.arn]
  
  # Dashboard widgets as JSON encoded strings for better maintainability
  dashboard_widgets = {
    frontend_cpu = jsonencode({
      type: "metric",
      width: 12,
      height: 6,
      properties: {
        title: "Frontend CPU Utilization",
        view: "timeSeries",
        stacked: false,
        metrics: [
          ["AWS/ECS", "CPUUtilization", "ServiceName", "${var.ecs_service_names["frontend"]}", "ClusterName", "${var.ecs_cluster_name}"]
        ],
        region: "${var.aws_region}",
        period: 300,
        stat: "Average",
        yAxis: {
          left: {
            min: 0,
            max: 100
          }
        }
      }
    })
    
    api_cpu = jsonencode({
      type: "metric",
      width: 12,
      height: 6,
      properties: {
        title: "API CPU Utilization",
        view: "timeSeries",
        stacked: false,
        metrics: [
          ["AWS/ECS", "CPUUtilization", "ServiceName", "${var.ecs_service_names["api"]}", "ClusterName", "${var.ecs_cluster_name}"]
        ],
        region: "${var.aws_region}",
        period: 300,
        stat: "Average",
        yAxis: {
          left: {
            min: 0,
            max: 100
          }
        }
      }
    })
    
    worker_cpu = jsonencode({
      type: "metric",
      width: 12,
      height: 6,
      properties: {
        title: "Worker CPU Utilization",
        view: "timeSeries",
        stacked: false,
        metrics: [
          ["AWS/ECS", "CPUUtilization", "ServiceName", "${var.ecs_service_names["worker"]}", "ClusterName", "${var.ecs_cluster_name}"]
        ],
        region: "${var.aws_region}",
        period: 300,
        stat: "Average",
        yAxis: {
          left: {
            min: 0,
            max: 100
          }
        }
      }
    })
    
    frontend_memory = jsonencode({
      type: "metric",
      width: 12,
      height: 6,
      properties: {
        title: "Frontend Memory Utilization",
        view: "timeSeries",
        stacked: false,
        metrics: [
          ["AWS/ECS", "MemoryUtilization", "ServiceName", "${var.ecs_service_names["frontend"]}", "ClusterName", "${var.ecs_cluster_name}"]
        ],
        region: "${var.aws_region}",
        period: 300,
        stat: "Average",
        yAxis: {
          left: {
            min: 0,
            max: 100
          }
        }
      }
    })
    
    api_memory = jsonencode({
      type: "metric",
      width: 12,
      height: 6,
      properties: {
        title: "API Memory Utilization",
        view: "timeSeries",
        stacked: false,
        metrics: [
          ["AWS/ECS", "MemoryUtilization", "ServiceName", "${var.ecs_service_names["api"]}", "ClusterName", "${var.ecs_cluster_name}"]
        ],
        region: "${var.aws_region}",
        period: 300,
        stat: "Average",
        yAxis: {
          left: {
            min: 0,
            max: 100
          }
        }
      }
    })
    
    worker_memory = jsonencode({
      type: "metric",
      width: 12,
      height: 6,
      properties: {
        title: "Worker Memory Utilization",
        view: "timeSeries",
        stacked: false,
        metrics: [
          ["AWS/ECS", "MemoryUtilization", "ServiceName", "${var.ecs_service_names["worker"]}", "ClusterName", "${var.ecs_cluster_name}"]
        ],
        region: "${var.aws_region}",
        period: 300,
        stat: "Average",
        yAxis: {
          left: {
            min: 0,
            max: 100
          }
        }
      }
    })
    
    alb_requests = jsonencode({
      type: "metric",
      width: 12,
      height: 6,
      properties: {
        title: "ALB Request Count",
        view: "timeSeries",
        stacked: false,
        metrics: [
          ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", "${var.alb_dns_name}"]
        ],
        region: "${var.aws_region}",
        period: 300,
        stat: "Sum"
      }
    })
    
    alb_5xx_errors = jsonencode({
      type: "metric",
      width: 12,
      height: 6,
      properties: {
        title: "ALB 5XX Errors",
        view: "timeSeries",
        stacked: false,
        metrics: [
          ["AWS/ApplicationELB", "HTTPCode_ELB_5XX_Count", "LoadBalancer", "${var.alb_dns_name}"]
        ],
        region: "${var.aws_region}",
        period: 300,
        stat: "Sum"
      }
    })
    
    alb_4xx_errors = jsonencode({
      type: "metric",
      width: 12,
      height: 6,
      properties: {
        title: "ALB 4XX Errors",
        view: "timeSeries",
        stacked: false,
        metrics: [
          ["AWS/ApplicationELB", "HTTPCode_ELB_4XX_Count", "LoadBalancer", "${var.alb_dns_name}"]
        ],
        region: "${var.aws_region}",
        period: 300,
        stat: "Sum"
      }
    })
    
    alb_response_time = jsonencode({
      type: "metric",
      width: 12,
      height: 6,
      properties: {
        title: "ALB Response Time",
        view: "timeSeries",
        stacked: false,
        metrics: [
          ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", "${var.alb_dns_name}"]
        ],
        region: "${var.aws_region}",
        period: 300,
        stat: "p95"
      }
    })
    
    db_cpu = jsonencode({
      type: "metric",
      width: 12,
      height: 6,
      properties: {
        title: "Database CPU Utilization",
        view: "timeSeries",
        stacked: false,
        metrics: [
          ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", "${element(split(":", var.db_instance_arn), 6)}"]
        ],
        region: "${var.aws_region}",
        period: 300,
        stat: "Average",
        yAxis: {
          left: {
            min: 0,
            max: 100
          }
        }
      }
    })
    
    db_connections = jsonencode({
      type: "metric",
      width: 12,
      height: 6,
      properties: {
        title: "Database Connections",
        view: "timeSeries",
        stacked: false,
        metrics: [
          ["AWS/RDS", "DatabaseConnections", "DBInstanceIdentifier", "${element(split(":", var.db_instance_arn), 6)}"]
        ],
        region: "${var.aws_region}",
        period: 300,
        stat: "Average"
      }
    })
    
    db_storage = jsonencode({
      type: "metric",
      width: 12,
      height: 6,
      properties: {
        title: "Database Free Storage Space",
        view: "timeSeries",
        stacked: false,
        metrics: [
          ["AWS/RDS", "FreeStorageSpace", "DBInstanceIdentifier", "${element(split(":", var.db_instance_arn), 6)}"]
        ],
        region: "${var.aws_region}",
        period: 300,
        stat: "Average"
      }
    })
  }
  
  # Lambda function code for Honeycomb exporter
  honeycomb_exporter_code = <<EOF
exports.handler = async (event) => {
  const https = require('https');
  const AWS = require('aws-sdk');
  const cloudwatch = new AWS.CloudWatch();
  
  // Get metrics from CloudWatch
  const metrics = await getCloudWatchMetrics();
  
  // Send metrics to Honeycomb
  await sendToHoneycomb(metrics);
  
  return { statusCode: 200, body: 'Metrics exported to Honeycomb' };
  
  async function getCloudWatchMetrics() {
    // Implementation to fetch metrics from CloudWatch
    // This is a simplified version
    const params = {
      MetricName: 'CPUUtilization',
      Namespace: 'AWS/ECS',
      Period: 300,
      StartTime: new Date(Date.now() - 15 * 60 * 1000),
      EndTime: new Date(),
      Statistics: ['Average']
    };
    
    const result = await cloudwatch.getMetricStatistics(params).promise();
    return result;
  }
  
  async function sendToHoneycomb(metrics) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        time: new Date().toISOString(),
        data: metrics,
        service_name: '${var.project_name}-${var.environment}'
      });
      
      const options = {
        hostname: 'api.honeycomb.io',
        port: 443,
        path: '/1/events/${var.project_name}-${var.environment}-metrics',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Honeycomb-Team': process.env.HONEYCOMB_API_KEY,
          'Content-Length': data.length
        }
      };
      
      const req = https.request(options, (res) => {
        let responseBody = '';
        res.on('data', (chunk) => { responseBody += chunk; });
        res.on('end', () => { resolve(responseBody); });
      });
      
      req.on('error', (error) => { reject(error); });
      req.write(data);
      req.end();
    });
  }
};
EOF
}

# SNS Topic for CloudWatch alarms
resource "aws_sns_topic" "alarm_topic" {
  name = "${var.project_name}-${var.environment}-alarms"
  tags = local.common_tags
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-${var.environment}-dashboard"
  dashboard_body = jsonencode({
    widgets = [
      jsondecode(local.dashboard_widgets.frontend_cpu),
      jsondecode(local.dashboard_widgets.api_cpu),
      jsondecode(local.dashboard_widgets.worker_cpu),
      jsondecode(local.dashboard_widgets.frontend_memory),
      jsondecode(local.dashboard_widgets.api_memory),
      jsondecode(local.dashboard_widgets.worker_memory),
      jsondecode(local.dashboard_widgets.alb_requests),
      jsondecode(local.dashboard_widgets.alb_5xx_errors),
      jsondecode(local.dashboard_widgets.alb_4xx_errors),
      jsondecode(local.dashboard_widgets.alb_response_time),
      jsondecode(local.dashboard_widgets.db_cpu),
      jsondecode(local.dashboard_widgets.db_connections),
      jsondecode(local.dashboard_widgets.db_storage)
    ]
  })
}

# ECS CPU and Memory alarms - Frontend Service
resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high_frontend" {
  alarm_name          = "${var.project_name}-${var.environment}-frontend-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = var.alarm_period
  statistic           = "Average"
  threshold           = var.cpu_utilization_threshold
  alarm_description   = "This metric monitors frontend ECS CPU utilization"
  alarm_actions       = local.alarm_actions
  ok_actions          = local.alarm_actions
  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = var.ecs_service_names["frontend"]
  }
  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "ecs_memory_high_frontend" {
  alarm_name          = "${var.project_name}-${var.environment}-frontend-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = var.alarm_period
  statistic           = "Average"
  threshold           = var.memory_utilization_threshold
  alarm_description   = "This metric monitors frontend ECS memory utilization"
  alarm_actions       = local.alarm_actions
  ok_actions          = local.alarm_actions
  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = var.ecs_service_names["frontend"]
  }
  tags = local.common_tags
}

# ECS CPU and Memory alarms - API Service
resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high_api" {
  alarm_name          = "${var.project_name}-${var.environment}-api-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = var.alarm_period
  statistic           = "Average"
  threshold           = var.cpu_utilization_threshold
  alarm_description   = "This metric monitors API ECS CPU utilization"
  alarm_actions       = local.alarm_actions
  ok_actions          = local.alarm_actions
  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = var.ecs_service_names["api"]
  }
  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "ecs_memory_high_api" {
  alarm_name          = "${var.project_name}-${var.environment}-api-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = var.alarm_period
  statistic           = "Average"
  threshold           = var.memory_utilization_threshold
  alarm_description   = "This metric monitors API ECS memory utilization"
  alarm_actions       = local.alarm_actions
  ok_actions          = local.alarm_actions
  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = var.ecs_service_names["api"]
  }
  tags = local.common_tags
}

# ECS CPU and Memory alarms - Worker Service
resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high_worker" {
  alarm_name          = "${var.project_name}-${var.environment}-worker-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = var.alarm_period
  statistic           = "Average"
  threshold           = var.cpu_utilization_threshold
  alarm_description   = "This metric monitors worker ECS CPU utilization"
  alarm_actions       = local.alarm_actions
  ok_actions          = local.alarm_actions
  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = var.ecs_service_names["worker"]
  }
  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "ecs_memory_high_worker" {
  alarm_name          = "${var.project_name}-${var.environment}-worker-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = var.alarm_period
  statistic           = "Average"
  threshold           = var.memory_utilization_threshold
  alarm_description   = "This metric monitors worker ECS memory utilization"
  alarm_actions       = local.alarm_actions
  ok_actions          = local.alarm_actions
  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = var.ecs_service_names["worker"]
  }
  tags = local.common_tags
}

# ALB alarms
resource "aws_cloudwatch_metric_alarm" "alb_5xx_error_high" {
  alarm_name          = "${var.project_name}-${var.environment}-alb-5xx-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "HTTPCode_ELB_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = var.alarm_period
  statistic           = "Sum"
  threshold           = lookup(var.error_5xx_threshold, var.environment, 10)
  alarm_description   = "This metric monitors ALB 5XX errors"
  alarm_actions       = local.alarm_actions
  ok_actions          = local.alarm_actions
  dimensions = {
    LoadBalancer = var.alb_dns_name
  }
  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "alb_4xx_error_high" {
  alarm_name          = "${var.project_name}-${var.environment}-alb-4xx-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "HTTPCode_ELB_4XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = var.alarm_period
  statistic           = "Sum"
  threshold           = lookup(var.error_4xx_threshold, var.environment, 50)
  alarm_description   = "This metric monitors ALB 4XX errors"
  alarm_actions       = local.alarm_actions
  ok_actions          = local.alarm_actions
  dimensions = {
    LoadBalancer = var.alb_dns_name
  }
  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "alb_response_time_high" {
  alarm_name          = "${var.project_name}-${var.environment}-alb-response-time-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = var.alarm_period
  extended_statistic  = "p95"
  threshold           = lookup(var.response_time_threshold, var.environment, 0.5)
  alarm_description   = "This metric monitors ALB p95 response time"
  alarm_actions       = local.alarm_actions
  ok_actions          = local.alarm_actions
  dimensions = {
    LoadBalancer = var.alb_dns_name
  }
  tags = local.common_tags
}

# RDS alarms
resource "aws_cloudwatch_metric_alarm" "db_cpu_high" {
  alarm_name          = "${var.project_name}-${var.environment}-db-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = var.alarm_period
  statistic           = "Average"
  threshold           = var.cpu_utilization_threshold
  alarm_description   = "This metric monitors RDS CPU utilization"
  alarm_actions       = local.alarm_actions
  ok_actions          = local.alarm_actions
  dimensions = {
    DBInstanceIdentifier = element(split(":", var.db_instance_arn), 6)
  }
  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "db_connections_high" {
  alarm_name          = "${var.project_name}-${var.environment}-db-connections-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = var.alarm_period
  statistic           = "Average"
  threshold           = lookup(var.db_connections_threshold, var.environment, 100)
  alarm_description   = "This metric monitors RDS connection count"
  alarm_actions       = local.alarm_actions
  ok_actions          = local.alarm_actions
  dimensions = {
    DBInstanceIdentifier = element(split(":", var.db_instance_arn), 6)
  }
  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "db_storage_low" {
  alarm_name          = "${var.project_name}-${var.environment}-db-storage-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = var.alarm_period
  statistic           = "Average"
  threshold           = lookup(var.db_storage_threshold, var.environment, 10) * 1024 * 1024 * 1024 # Convert GB to bytes
  alarm_description   = "This metric monitors RDS free storage space"
  alarm_actions       = local.alarm_actions
  ok_actions          = local.alarm_actions
  dimensions = {
    DBInstanceIdentifier = element(split(":", var.db_instance_arn), 6)
  }
  tags = local.common_tags
}

# Honeycomb integration via Lambda
resource "aws_cloudwatch_log_group" "honeycomb_logs" {
  name              = "/aws/lambda/${var.project_name}-${var.environment}-honeycomb-exporter"
  retention_in_days = var.log_retention_days
  tags              = local.common_tags
}

resource "aws_iam_role" "honeycomb_exporter_role" {
  name = "${var.project_name}-${var.environment}-honeycomb-exporter-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action = "sts:AssumeRole",
      Effect = "Allow",
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
  tags = local.common_tags
}

resource "aws_iam_policy" "honeycomb_exporter_policy" {
  name = "${var.project_name}-${var.environment}-honeycomb-exporter-policy"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        Effect   = "Allow",
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Action = [
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics"
        ],
        Effect   = "Allow",
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "honeycomb_exporter_policy_attachment" {
  role       = aws_iam_role.honeycomb_exporter_role.name
  policy_arn = aws_iam_policy.honeycomb_exporter_policy.arn
}

resource "archive_file" "honeycomb_exporter_zip" {
  type        = "zip"
  output_path = "${path.module}/honeycomb_exporter.zip"
  source {
    content  = local.honeycomb_exporter_code
    filename = "index.js"
  }
}

resource "aws_lambda_function" "honeycomb_exporter" {
  function_name    = "${var.project_name}-${var.environment}-honeycomb-exporter"
  role             = aws_iam_role.honeycomb_exporter_role.arn
  handler          = "index.handler"
  runtime          = "nodejs16.x"
  filename         = archive_file.honeycomb_exporter_zip.output_path
  source_code_hash = archive_file.honeycomb_exporter_zip.output_base64sha256
  timeout          = 30
  memory_size      = 128
  environment {
    variables = {
      HONEYCOMB_API_KEY = var.honeycomb_api_key
      ENVIRONMENT       = var.environment
      PROJECT_NAME      = var.project_name
    }
  }
  tags = local.common_tags
}

resource "aws_cloudwatch_event_rule" "honeycomb_exporter_schedule" {
  name                = "${var.project_name}-${var.environment}-honeycomb-export"
  description         = "Trigger Honeycomb metrics export on a schedule"
  schedule_expression = var.honeycomb_metrics_export_interval
  tags                = local.common_tags
}

resource "aws_cloudwatch_event_target" "honeycomb_exporter_target" {
  rule = aws_cloudwatch_event_rule.honeycomb_exporter_schedule.name
  arn  = aws_lambda_function.honeycomb_exporter.arn
}

resource "aws_lambda_permission" "honeycomb_exporter_permission" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.honeycomb_exporter.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.honeycomb_exporter_schedule.arn
}

# Only create email subscription for CloudWatch alarms in production environment
resource "aws_sns_topic_subscription" "email_alerts" {
  count     = var.environment == "prod" ? 1 : 0
  topic_arn = aws_sns_topic.alarm_topic.arn
  protocol  = "email"
  endpoint  = "alerts@${var.project_name}.com"
}