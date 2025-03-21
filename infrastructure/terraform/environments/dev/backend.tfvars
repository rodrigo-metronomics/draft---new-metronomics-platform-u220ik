bucket         = "metronomics-terraform-state-dev"
key            = "terraform.tfstate"
region         = "us-east-1"
dynamodb_table = "metronomics-terraform-locks-dev"
encrypt        = true
profile        = "dev"
# Used with: terraform init -backend-config=environments/dev/backend.tfvars