# VPC outputs
output "vpc_id" {
  description = "ID of the created VPC"
  value       = aws_vpc.vpc.id
}

output "vpc_cidr" {
  description = "CIDR block of the created VPC"
  value       = aws_vpc.vpc.cidr_block
}

# Subnet outputs
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

# Security group outputs
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

# Routing outputs
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

# Gateway outputs
output "nat_gateway_ids" {
  description = "List of IDs of NAT gateways"
  value       = aws_nat_gateway.nat_gateway[*].id
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.internet_gateway.id
}

# Availability zone output
output "availability_zones" {
  description = "List of availability zones used"
  value       = data.aws_availability_zones.available.names
}

# VPC Endpoint outputs
output "vpc_endpoint_s3_id" {
  description = "ID of the S3 VPC endpoint"
  value       = aws_vpc_endpoint.vpc_endpoint_s3.id
}

# Network ACL outputs
output "network_acl_public_id" {
  description = "ID of the network ACL for public subnets"
  value       = aws_network_acl.network_acl_public.id
}

output "network_acl_private_app_id" {
  description = "ID of the network ACL for private application subnets"
  value       = aws_network_acl.network_acl_private_app.id
}

output "network_acl_private_data_id" {
  description = "ID of the network ACL for private data subnets"
  value       = aws_network_acl.network_acl_private_data.id
}

# Flow log outputs
output "vpc_flow_log_id" {
  description = "ID of the VPC Flow Log (if enabled)"
  value       = var.enable_vpc_flow_logs ? aws_flow_log.vpc_flow_log[0].id : ""
}

output "vpc_flow_log_group_name" {
  description = "Name of the CloudWatch Log Group for VPC Flow Logs (if enabled)"
  value       = var.enable_vpc_flow_logs ? aws_cloudwatch_log_group.vpc_flow_log[0].name : ""
}