# 1. Security Group (Firewall)
resource "aws_security_group" "backend_sg" {
  name        = "${var.project_name}-backend-sg"
  description = "Allow SSH and App Traffic"

  # Allow SSH (Port 22) from anywhere (Use your specific IP in production!)
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow Backend Traffic (Port 4000)
  ingress {
    from_port   = 4000
    to_port     = 4000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow All Outbound Access
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-backend-sg"
  }
}

# 2. Key Pair (SSH Key)
resource "aws_key_pair" "deployer" {
  key_name   = "${var.project_name}-key"
  public_key = var.public_key
}

# 3. EC2 Instance (The Server)
resource "aws_instance" "app_server" {
  ami           = "ami-0ea3c35c5c3284d96" # Ubuntu 22.04 LTS (us-east-2) - UPDATE IF REGION CHANGES
  instance_type = "t2.micro"

  key_name      = aws_key_pair.deployer.key_name
  vpc_security_group_ids = [aws_security_group.backend_sg.id]

  # User Data script to Auto-Install Docker
  user_data = <<-EOF
              #!/bin/bash
              sudo apt update
              sudo apt install -y docker.io redis-server
              sudo usermod -aG docker ubuntu
              sudo service redis-server start
              EOF

  tags = {
    Name = "${var.project_name}-Backend"
  }
}

output "instance_ip" {
  value = aws_instance.app_server.public_ip
}
