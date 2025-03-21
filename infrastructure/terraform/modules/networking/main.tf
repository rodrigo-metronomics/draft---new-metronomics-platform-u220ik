# AWS Provider requirements
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

# Data sources for AWS availability zones and current region
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_region" "current" {}

# Local variables for resource naming and CIDR calculation
locals {
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
  
  # Calculate the number of availability zones to use
  az_count = min(var.availability_zones, length(data.aws_availability_zones.available.names))
  
  # Calculate CIDR blocks for different subnet tiers
  public_subnet_cidrs       = [for i in range(local.az_count) : cidrsubnet(var.vpc_cidr, 8, i)]
  private_app_subnet_cidrs  = [for i in range(local.az_count) : cidrsubnet(var.vpc_cidr, 8, i + local.az_count)]
  private_data_subnet_cidrs = [for i in range(local.az_count) : cidrsubnet(var.vpc_cidr, 8, i + (2 * local.az_count))]
}

# Main VPC
resource "aws_vpc" "vpc" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = var.enable_dns_hostnames
  enable_dns_support   = var.enable_dns_support
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-vpc"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# Public subnets
resource "aws_subnet" "public_subnet" {
  count                   = local.az_count
  vpc_id                  = aws_vpc.vpc.id
  cidr_block              = local.public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-public-${data.aws_availability_zones.available.names[count.index]}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
    Tier        = "public"
  }
}

# Private application tier subnets
resource "aws_subnet" "private_app_subnet" {
  count                   = local.az_count
  vpc_id                  = aws_vpc.vpc.id
  cidr_block              = local.private_app_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = false
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-private-app-${data.aws_availability_zones.available.names[count.index]}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
    Tier        = "private-app"
  }
}

# Private data tier subnets
resource "aws_subnet" "private_data_subnet" {
  count                   = local.az_count
  vpc_id                  = aws_vpc.vpc.id
  cidr_block              = local.private_data_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = false
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-private-data-${data.aws_availability_zones.available.names[count.index]}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
    Tier        = "private-data"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "internet_gateway" {
  vpc_id = aws_vpc.vpc.id
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-igw"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# Public route table
resource "aws_route_table" "public_route_table" {
  vpc_id = aws_vpc.vpc.id
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-public-rt"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
    Tier        = "public"
  }
}

# Public route to internet
resource "aws_route" "public_internet_route" {
  route_table_id         = aws_route_table.public_route_table.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.internet_gateway.id
}

# Associate public subnets with the public route table
resource "aws_route_table_association" "public_route_table_association" {
  count          = local.az_count
  subnet_id      = aws_subnet.public_subnet[count.index].id
  route_table_id = aws_route_table.public_route_table.id
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "eip" {
  count = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : local.az_count) : 0
  vpc   = true
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-eip-${count.index}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# NAT Gateways
resource "aws_nat_gateway" "nat_gateway" {
  count         = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : local.az_count) : 0
  allocation_id = aws_eip.eip[count.index].id
  subnet_id     = aws_subnet.public_subnet[count.index].id
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-nat-${count.index}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# Private application route tables
resource "aws_route_table" "private_app_route_table" {
  count  = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : local.az_count) : local.az_count
  vpc_id = aws_vpc.vpc.id
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-private-app-rt-${count.index}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
    Tier        = "private-app"
  }
}

# Private application routes to NAT Gateway
resource "aws_route" "private_app_nat_route" {
  count                  = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : local.az_count) : 0
  route_table_id         = aws_route_table.private_app_route_table[count.index].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = var.single_nat_gateway ? aws_nat_gateway.nat_gateway[0].id : aws_nat_gateway.nat_gateway[count.index].id
}

# Associate private application subnets with their route tables
resource "aws_route_table_association" "private_app_route_table_association" {
  count          = local.az_count
  subnet_id      = aws_subnet.private_app_subnet[count.index].id
  route_table_id = var.enable_nat_gateway ? (var.single_nat_gateway ? aws_route_table.private_app_route_table[0].id : aws_route_table.private_app_route_table[count.index].id) : aws_route_table.private_app_route_table[count.index].id
}

# Private data route tables
resource "aws_route_table" "private_data_route_table" {
  count  = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : local.az_count) : local.az_count
  vpc_id = aws_vpc.vpc.id
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-private-data-rt-${count.index}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
    Tier        = "private-data"
  }
}

# Private data routes to NAT Gateway
resource "aws_route" "private_data_nat_route" {
  count                  = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : local.az_count) : 0
  route_table_id         = aws_route_table.private_data_route_table[count.index].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = var.single_nat_gateway ? aws_nat_gateway.nat_gateway[0].id : aws_nat_gateway.nat_gateway[count.index].id
}

# Associate private data subnets with their route tables
resource "aws_route_table_association" "private_data_route_table_association" {
  count          = local.az_count
  subnet_id      = aws_subnet.private_data_subnet[count.index].id
  route_table_id = var.enable_nat_gateway ? (var.single_nat_gateway ? aws_route_table.private_data_route_table[0].id : aws_route_table.private_data_route_table[count.index].id) : aws_route_table.private_data_route_table[count.index].id
}

# Application security group
resource "aws_security_group" "app_security_group" {
  name        = "${var.project_name}-${var.environment}-app-sg"
  description = "Security group for application tier resources"
  vpc_id      = aws_vpc.vpc.id
  
  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_security_group.id]
  }
  
  ingress {
    description     = "HTTPS from ALB"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_security_group.id]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-app-sg"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# Database security group
resource "aws_security_group" "db_security_group" {
  name        = "${var.project_name}-${var.environment}-db-sg"
  description = "Security group for database tier resources"
  vpc_id      = aws_vpc.vpc.id
  
  ingress {
    description     = "PostgreSQL from App tier"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app_security_group.id]
  }
  
  ingress {
    description     = "Redis from App tier"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.app_security_group.id]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-db-sg"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# ALB security group
resource "aws_security_group" "alb_security_group" {
  name        = "${var.project_name}-${var.environment}-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.vpc.id
  
  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-alb-sg"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# Bastion security group
resource "aws_security_group" "bastion_security_group" {
  name        = "${var.project_name}-${var.environment}-bastion-sg"
  description = "Security group for bastion host"
  vpc_id      = aws_vpc.vpc.id
  
  ingress {
    description = "SSH from trusted IPs"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.trusted_ip_ranges
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-bastion-sg"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# VPC Flow Log CloudWatch Log Group
resource "aws_cloudwatch_log_group" "vpc_flow_log" {
  count             = var.enable_vpc_flow_logs ? 1 : 0
  name              = "/aws/vpc-flow-log/${var.project_name}-${var.environment}"
  retention_in_days = var.vpc_flow_logs_retention_days
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-vpc-flow-log-group"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# IAM Role for VPC Flow Logs
resource "aws_iam_role" "vpc_flow_log_role" {
  count = var.enable_vpc_flow_logs ? 1 : 0
  name  = "${var.project_name}-${var.environment}-vpc-flow-log-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
      }
    ]
  })
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-vpc-flow-log-role"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# IAM Policy for VPC Flow Logs
resource "aws_iam_role_policy" "vpc_flow_log_policy" {
  count = var.enable_vpc_flow_logs ? 1 : 0
  name  = "${var.project_name}-${var.environment}-vpc-flow-log-policy"
  role  = aws_iam_role.vpc_flow_log_role[0].id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

# VPC Flow Logs
resource "aws_flow_log" "vpc_flow_log" {
  count                = var.enable_vpc_flow_logs ? 1 : 0
  log_destination_type = "cloud-watch-logs"
  log_destination      = aws_cloudwatch_log_group.vpc_flow_log[0].arn
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.vpc.id
  iam_role_arn         = aws_iam_role.vpc_flow_log_role[0].arn
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-vpc-flow-log"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# S3 VPC Endpoint
resource "aws_vpc_endpoint" "vpc_endpoint_s3" {
  vpc_id          = aws_vpc.vpc.id
  service_name    = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids = concat(
    [aws_route_table.public_route_table.id],
    aws_route_table.private_app_route_table[*].id,
    aws_route_table.private_data_route_table[*].id
  )
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-s3-endpoint"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# Network ACL for public subnets
resource "aws_network_acl" "network_acl_public" {
  vpc_id     = aws_vpc.vpc.id
  subnet_ids = aws_subnet.public_subnet[*].id
  
  ingress {
    rule_no    = 100
    action     = "allow"
    protocol   = "tcp"
    from_port  = 80
    to_port    = 80
    cidr_block = "0.0.0.0/0"
  }
  
  ingress {
    rule_no    = 110
    action     = "allow"
    protocol   = "tcp"
    from_port  = 443
    to_port    = 443
    cidr_block = "0.0.0.0/0"
  }
  
  ingress {
    rule_no    = 120
    action     = "allow"
    protocol   = "tcp"
    from_port  = 22
    to_port    = 22
    cidr_block = "0.0.0.0/0"
  }
  
  ingress {
    rule_no    = 130
    action     = "allow"
    protocol   = "tcp"
    from_port  = 1024
    to_port    = 65535
    cidr_block = "0.0.0.0/0"
  }
  
  egress {
    rule_no    = 100
    action     = "allow"
    protocol   = "-1"
    from_port  = 0
    to_port    = 0
    cidr_block = "0.0.0.0/0"
  }
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-public-nacl"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# Network ACL for private application subnets
resource "aws_network_acl" "network_acl_private_app" {
  vpc_id     = aws_vpc.vpc.id
  subnet_ids = aws_subnet.private_app_subnet[*].id
  
  ingress {
    rule_no    = 100
    action     = "allow"
    protocol   = "tcp"
    from_port  = 80
    to_port    = 80
    cidr_block = var.vpc_cidr
  }
  
  ingress {
    rule_no    = 110
    action     = "allow"
    protocol   = "tcp"
    from_port  = 443
    to_port    = 443
    cidr_block = var.vpc_cidr
  }
  
  ingress {
    rule_no    = 120
    action     = "allow"
    protocol   = "tcp"
    from_port  = 22
    to_port    = 22
    cidr_block = var.vpc_cidr
  }
  
  ingress {
    rule_no    = 130
    action     = "allow"
    protocol   = "tcp"
    from_port  = 1024
    to_port    = 65535
    cidr_block = "0.0.0.0/0"
  }
  
  egress {
    rule_no    = 100
    action     = "allow"
    protocol   = "-1"
    from_port  = 0
    to_port    = 0
    cidr_block = "0.0.0.0/0"
  }
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-private-app-nacl"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# Network ACL for private data subnets
resource "aws_network_acl" "network_acl_private_data" {
  vpc_id     = aws_vpc.vpc.id
  subnet_ids = aws_subnet.private_data_subnet[*].id
  
  ingress {
    rule_no    = 100
    action     = "allow"
    protocol   = "tcp"
    from_port  = 5432
    to_port    = 5432
    cidr_block = var.vpc_cidr
  }
  
  ingress {
    rule_no    = 110
    action     = "allow"
    protocol   = "tcp"
    from_port  = 6379
    to_port    = 6379
    cidr_block = var.vpc_cidr
  }
  
  ingress {
    rule_no    = 120
    action     = "allow"
    protocol   = "tcp"
    from_port  = 1024
    to_port    = 65535
    cidr_block = var.vpc_cidr
  }
  
  egress {
    rule_no    = 100
    action     = "allow"
    protocol   = "tcp"
    from_port  = 1024
    to_port    = 65535
    cidr_block = "0.0.0.0/0"
  }
  
  egress {
    rule_no    = 110
    action     = "allow"
    protocol   = "tcp"
    from_port  = 80
    to_port    = 80
    cidr_block = "0.0.0.0/0"
  }
  
  egress {
    rule_no    = 120
    action     = "allow"
    protocol   = "tcp"
    from_port  = 443
    to_port    = 443
    cidr_block = "0.0.0.0/0"
  }
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-private-data-nacl"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# Output values for use in other modules
output "vpc_id" {
  description = "ID of the created VPC"
  value       = aws_vpc.vpc.id
}

output "vpc_cidr" {
  description = "CIDR block of the created VPC"
  value       = aws_vpc.vpc.cidr_block
}

output "public_subnet_ids" {
  description = "List of IDs of public subnets"
  value       = aws_subnet.public_subnet[*].id
}

output "private_app_subnet_ids" {
  description = "List of IDs of private application tier subnets"
  value       = aws_subnet.private_app_subnet[*].id
}

output "private_data_subnet_ids" {
  description = "List of IDs of private data tier subnets"
  value       = aws_subnet.private_data_subnet[*].id
}

output "public_subnet_cidrs" {
  description = "List of CIDR blocks of public subnets"
  value       = aws_subnet.public_subnet[*].cidr_block
}

output "private_app_subnet_cidrs" {
  description = "List of CIDR blocks of private application tier subnets"
  value       = aws_subnet.private_app_subnet[*].cidr_block
}

output "private_data_subnet_cidrs" {
  description = "List of CIDR blocks of private data tier subnets"
  value       = aws_subnet.private_data_subnet[*].cidr_block
}

output "app_security_group_id" {
  description = "ID of the application security group"
  value       = aws_security_group.app_security_group.id
}

output "db_security_group_id" {
  description = "ID of the database security group"
  value       = aws_security_group.db_security_group.id
}

output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb_security_group.id
}

output "bastion_security_group_id" {
  description = "ID of the bastion host security group"
  value       = aws_security_group.bastion_security_group.id
}

output "public_route_table_id" {
  description = "ID of the public route table"
  value       = aws_route_table.public_route_table.id
}

output "private_app_route_table_ids" {
  description = "List of IDs of private application route tables"
  value       = aws_route_table.private_app_route_table[*].id
}

output "private_data_route_table_ids" {
  description = "List of IDs of private data route tables"
  value       = aws_route_table.private_data_route_table[*].id
}

output "nat_gateway_ids" {
  description = "List of IDs of NAT gateways"
  value       = aws_nat_gateway.nat_gateway[*].id
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.internet_gateway.id
}

output "availability_zones" {
  description = "List of availability zones used"
  value       = data.aws_availability_zones.available.names
}