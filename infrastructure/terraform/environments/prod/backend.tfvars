bucket         = "metronomics-terraform-state-prod"
region         = "us-east-1"
dynamodb_table = "metronomics-terraform-locks-prod"
encrypt        = true
profile        = "prod"
key            = "terraform.tfstate"

# Used with: terraform init -backend-config=environments/prod/backend.tfvars