variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "project_name" {
  description = "Name of the project for resource naming and tagging"
  type        = string
  default     = "metronomics"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "aws_region" {
  description = "AWS region where the networking resources will be deployed"
  type        = string
  default     = "us-east-1"
}

variable "availability_zones" {
  description = "Number of availability zones to use for subnet distribution"
  type        = number
  default     = 2
  
  validation {
    condition     = var.availability_zones > 0 && var.availability_zones <= 3
    error_message = "Number of availability zones must be between 1 and 3."
  }
}

variable "trusted_ip_ranges" {
  description = "List of trusted CIDR blocks for SSH access to bastion host"
  type        = list(string)
  default     = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
}

variable "enable_nat_gateway" {
  description = "Whether to create NAT Gateways for private subnets"
  type        = bool
  default     = true
}

variable "single_nat_gateway" {
  description = "Whether to create a single NAT Gateway for all private subnets"
  type        = bool
  default     = false
}

variable "enable_vpn_gateway" {
  description = "Whether to create a VPN Gateway"
  type        = bool
  default     = false
}

variable "enable_dns_hostnames" {
  description = "Whether to enable DNS hostnames in the VPC"
  type        = bool
  default     = true
}

variable "enable_dns_support" {
  description = "Whether to enable DNS support in the VPC"
  type        = bool
  default     = true
}

variable "enable_vpc_flow_logs" {
  description = "Whether to enable VPC Flow Logs for network traffic analysis"
  type        = bool
  default     = true
}

variable "vpc_flow_logs_retention_days" {
  description = "Number of days to retain VPC Flow Logs"
  type        = number
  default     = 30
}

variable "create_database_subnet_group" {
  description = "Whether to create a database subnet group"
  type        = bool
  default     = true
}

variable "create_database_subnet_route_table" {
  description = "Whether to create a separate route table for database subnets"
  type        = bool
  default     = true
}

variable "create_database_internet_gateway_route" {
  description = "Whether to create an internet gateway route for database subnets"
  type        = bool
  default     = false
}

variable "create_database_nat_gateway_route" {
  description = "Whether to create a NAT gateway route for database subnets"
  type        = bool
  default     = true
}

variable "enable_s3_endpoint" {
  description = "Whether to create a VPC endpoint for S3"
  type        = bool
  default     = true
}

variable "enable_dynamodb_endpoint" {
  description = "Whether to create a VPC endpoint for DynamoDB"
  type        = bool
  default     = false
}

variable "enable_public_subnet_network_acls" {
  description = "Whether to create network ACLs for public subnets"
  type        = bool
  default     = true
}

variable "enable_private_subnet_network_acls" {
  description = "Whether to create network ACLs for private subnets"
  type        = bool
  default     = true
}

variable "enable_database_subnet_network_acls" {
  description = "Whether to create network ACLs for database subnets"
  type        = bool
  default     = true
}

variable "public_subnet_tags" {
  description = "Additional tags for public subnets"
  type        = map(string)
  default     = {}
}

variable "private_subnet_tags" {
  description = "Additional tags for private subnets"
  type        = map(string)
  default     = {}
}

variable "database_subnet_tags" {
  description = "Additional tags for database subnets"
  type        = map(string)
  default     = {}
}

variable "vpc_tags" {
  description = "Additional tags for the VPC"
  type        = map(string)
  default     = {}
}

variable "igw_tags" {
  description = "Additional tags for the internet gateway"
  type        = map(string)
  default     = {}
}

variable "nat_gateway_tags" {
  description = "Additional tags for the NAT gateways"
  type        = map(string)
  default     = {}
}

variable "nat_eip_tags" {
  description = "Additional tags for the NAT EIPs"
  type        = map(string)
  default     = {}
}

variable "vpc_flow_log_tags" {
  description = "Additional tags for the VPC Flow Logs"
  type        = map(string)
  default     = {}
}

variable "vpc_endpoint_tags" {
  description = "Additional tags for the VPC Endpoints"
  type        = map(string)
  default     = {}
}

variable "route_table_tags" {
  description = "Additional tags for the route tables"
  type        = map(string)
  default     = {}
}

variable "security_group_tags" {
  description = "Additional tags for the security groups"
  type        = map(string)
  default     = {}
}