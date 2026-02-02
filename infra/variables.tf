variable "aws_region" {
  description = "AWS Region to deploy to"
  default     = "us-east-2"
}

variable "project_name" {
  description = "Name of the project"
  default     = "SketchFlow"
}

variable "db_password" {
  description = "Master password for the RDS database"
  type        = string
  sensitive   = true
}

variable "public_key" {
  description = "SSH Public Key for EC2 access"
  type        = string
}
