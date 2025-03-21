# Provider configuration for the Metronomics Platform infrastructure
terraform {
  required_version = ">= 1.0.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.0"
    }
    template = {
      source  = "hashicorp/template"
      version = "~> 2.0"
    }
  }
}

# AWS provider for the primary region
provider "aws" {
  region  = var.aws_region
  profile = var.environment
  
  default_tags {
    tags = {
      Environment = var.environment
      Project     = "Metronomics"
      ManagedBy   = "Terraform"
    }
  }
}

# AWS provider for the secondary region (used for disaster recovery)
provider "aws" {
  alias   = "secondary"
  region  = var.secondary_aws_region
  profile = var.environment
  
  default_tags {
    tags = {
      Environment = var.environment
      Project     = "Metronomics"
      ManagedBy   = "Terraform"
      Region      = "Secondary"
    }
  }
}

# Additional utility providers
provider "random" {}

provider "null" {}

provider "local" {}

provider "template" {}