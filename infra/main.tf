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

# IAM role for EventBridge to manage EC2 instances
resource "aws_iam_role" "eventbridge_ec2_role" {
  name = "eventbridge-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "eventbridge-ec2-role"
  }
}

# IAM policy for EventBridge to start/stop EC2 instances
resource "aws_iam_policy" "eventbridge_ec2_policy" {
  name        = "eventbridge-ec2-policy"
  description = "Policy for EventBridge to start/stop EC2 instances"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:StartInstances",
          "ec2:StopInstances",
          "ec2:DescribeInstances"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name = "eventbridge-ec2-policy"
  }
}

# Attach policy to role
resource "aws_iam_role_policy_attachment" "eventbridge_ec2_policy_attachment" {
  role       = aws_iam_role.eventbridge_ec2_role.name
  policy_arn = aws_iam_policy.eventbridge_ec2_policy.arn
}

# EventBridge rule to stop EC2 instance at 21:00 (9 PM) daily
resource "aws_cloudwatch_event_rule" "stop_instance_rule" {
  name                = "stop-rumba-instance"
  description         = "Stop Rumba EC2 instance at 21:00 daily"
  schedule_expression = "cron(0 21 * * ? *)"  # 21:00 UTC daily

  tags = {
    Name = "stop-rumba-instance-rule"
  }
}

# Lambda function to stop EC2 instance
resource "aws_lambda_function" "stop_instance_lambda" {
  function_name    = "stop-rumba-instance"
  role            = aws_iam_role.lambda_ec2_role.arn
  handler         = "index.handler"
  runtime         = "python3.9"
  timeout         = 30

  filename         = data.archive_file.stop_lambda_zip.output_path
  source_code_hash = data.archive_file.stop_lambda_zip.output_base64sha256

  environment {
    variables = {
      INSTANCE_ID = aws_instance.rumba_server.id
    }
  }

  tags = {
    Name = "stop-rumba-instance-lambda"
  }
}

# Lambda function to start EC2 instance
resource "aws_lambda_function" "start_instance_lambda" {
  function_name    = "start-rumba-instance"
  role            = aws_iam_role.lambda_ec2_role.arn
  handler         = "index.handler"
  runtime         = "python3.9"
  timeout         = 30

  filename         = data.archive_file.start_lambda_zip.output_path
  source_code_hash = data.archive_file.start_lambda_zip.output_base64sha256

  environment {
    variables = {
      INSTANCE_ID = aws_instance.rumba_server.id
    }
  }

  tags = {
    Name = "start-rumba-instance-lambda"
  }
}

# Create zip file for stop Lambda function
data "archive_file" "stop_lambda_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda/stop_instance.py"
  output_path = "${path.module}/lambda/stop_instance.zip"
}

# Create zip file for start Lambda function
data "archive_file" "start_lambda_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda/start_instance.py"
  output_path = "${path.module}/lambda/start_instance.zip"
}

# IAM role for Lambda functions
resource "aws_iam_role" "lambda_ec2_role" {
  name = "lambda-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "lambda-ec2-role"
  }
}

# IAM policy for Lambda to start/stop EC2 instances
resource "aws_iam_policy" "lambda_ec2_policy" {
  name        = "lambda-ec2-policy"
  description = "Policy for Lambda to start/stop EC2 instances"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:StartInstances",
          "ec2:StopInstances",
          "ec2:DescribeInstances"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name = "lambda-ec2-policy"
  }
}

# Attach policy to Lambda role
resource "aws_iam_role_policy_attachment" "lambda_ec2_policy_attachment" {
  role       = aws_iam_role.lambda_ec2_role.name
  policy_arn = aws_iam_policy.lambda_ec2_policy.arn
}

# EventBridge target to stop EC2 instance
resource "aws_cloudwatch_event_target" "stop_instance_target" {
  rule      = aws_cloudwatch_event_rule.stop_instance_rule.name
  target_id = "StopInstanceTarget"
  arn       = aws_lambda_function.stop_instance_lambda.arn
}

# Permission for EventBridge to invoke Lambda
resource "aws_lambda_permission" "allow_eventbridge_stop" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.stop_instance_lambda.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.stop_instance_rule.arn
}

# EventBridge rule to start EC2 instance at 08:00 (8 AM) daily
resource "aws_cloudwatch_event_rule" "start_instance_rule" {
  name                = "start-rumba-instance"
  description         = "Start Rumba EC2 instance at 08:00 daily"
  schedule_expression = "cron(0 8 * * ? *)"  # 08:00 UTC daily

  tags = {
    Name = "start-rumba-instance-rule"
  }
}

# EventBridge target to start EC2 instance
resource "aws_cloudwatch_event_target" "start_instance_target" {
  rule      = aws_cloudwatch_event_rule.start_instance_rule.name
  target_id = "StartInstanceTarget"
  arn       = aws_lambda_function.start_instance_lambda.arn
}

# Permission for EventBridge to invoke Lambda
resource "aws_lambda_permission" "allow_eventbridge_start" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.start_instance_lambda.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.start_instance_rule.arn
}

# Data source to get current AWS account ID
data "aws_caller_identity" "current" {}