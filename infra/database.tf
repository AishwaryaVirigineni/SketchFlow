# 1. Database Security Group
resource "aws_security_group" "db_sg" {
  name        = "${var.project_name}-db-sg"
  description = "Allow Postgres access from EC2 only"

  # Allow access ONLY from the Backend Security Group
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.backend_sg.id]
  }

  tags = {
    Name = "${var.project_name}-db-sg"
  }
}

# 2. RDS Instance
resource "aws_db_instance" "default" {
  allocated_storage      = 20
  db_name                = "whiteboard"
  engine                 = "postgres"
  engine_version         = "16.3"
  instance_class         = "db.t3.micro"
  username               = "postgres"
  password               = var.db_password
  parameter_group_name   = "default.postgres16"
  skip_final_snapshot    = true
  publicly_accessible    = true  # Set to FALSE for better security (but true for dev access)
  vpc_security_group_ids = [aws_security_group.db_sg.id]

  tags = {
    Name = "${var.project_name}-RDS"
  }
}

output "db_endpoint" {
  value = aws_db_instance.default.endpoint
}
