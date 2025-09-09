terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Data source for the latest Amazon Linux 2023 AMI
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Default VPC
data "aws_vpc" "default" {
  default = true
}

# Get availability zones that support t3.micro
data "aws_availability_zones" "available" {
  state = "available"
  filter {
    name   = "opt-in-status"
    values = ["opt-in-not-required"]
  }
}

# Default subnets in supported availability zones
data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
  filter {
    name   = "availability-zone"
    values = ["us-east-1a", "us-east-1b", "us-east-1c", "us-east-1d", "us-east-1f"]
  }
}

# Security group for the Rumba application
resource "aws_security_group" "rumba_sg" {
  name_prefix = "rumba-sg-"
  description = "Security group for Rumba application"
  vpc_id      = data.aws_vpc.default.id

  # HTTP access for frontend
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP access"
  }

  # HTTPS access for frontend
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS access"
  }

  # Frontend port (3000)
  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Frontend access"
  }

  # Backend API port (3005)
  ingress {
    from_port   = 3005
    to_port     = 3005
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Backend API access"
  }

  # SSH access
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "SSH access"
  }

  # All outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = {
    Name = "rumba-security-group"
  }
}

# Key pair for EC2 access
resource "aws_key_pair" "rumba_key" {
  key_name   = var.key_name
  public_key = file(var.public_key_path)

  tags = {
    Name = "rumba-key-pair"
  }
}

# EC2 instance for Rumba application
resource "aws_instance" "rumba_server" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type

  # Use the first available subnet in a supported AZ
  subnet_id = data.aws_subnets.default.ids[0]

  vpc_security_group_ids = [aws_security_group.rumba_sg.id]
  key_name               = aws_key_pair.rumba_key.key_name

  # User data script for initial setup
  user_data = file("${path.module}/user-data.sh")

  # Root volume configuration
  root_block_device {
    volume_type = "gp3"
    volume_size = 30
    encrypted   = true
  }

  tags = {
    Name        = "rumba-server"
    Environment = var.environment
    Project     = "rumba"
  }

  # Create tags for easier identification
  volume_tags = {
    Name = "rumba-server-root"
  }
}

# Elastic IP for the EC2 instance
resource "aws_eip" "rumba_eip" {
  instance = aws_instance.rumba_server.id
  domain   = "vpc"

  tags = {
    Name = "rumba-server-eip"
  }

  depends_on = [aws_instance.rumba_server]
}