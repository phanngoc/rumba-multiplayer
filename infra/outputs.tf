output "instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.rumba_server.id
}

output "public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_eip.rumba_eip.public_ip
}

output "public_dns" {
  description = "Public DNS name of the EC2 instance"
  value       = aws_instance.rumba_server.public_dns
}

output "ssh_command" {
  description = "SSH command to connect to the instance"
  value       = "ssh -i ~/.ssh/id_rsa ec2-user@${aws_eip.rumba_eip.public_ip}"
}

output "frontend_url" {
  description = "URL to access the frontend"
  value       = "http://${aws_eip.rumba_eip.public_ip}:3000"
}

output "backend_url" {
  description = "URL to access the backend API"
  value       = "http://${aws_eip.rumba_eip.public_ip}:3005"
}

output "security_group_id" {
  description = "ID of the security group"
  value       = aws_security_group.rumba_sg.id
}

output "availability_zone" {
  description = "Availability zone where the instance is deployed"
  value       = aws_instance.rumba_server.availability_zone
}

output "instance_type" {
  description = "Instance type used"
  value       = aws_instance.rumba_server.instance_type
}

output "stop_instance_rule_arn" {
  description = "ARN of the EventBridge rule to stop instance"
  value       = aws_cloudwatch_event_rule.stop_instance_rule.arn
}

output "start_instance_rule_arn" {
  description = "ARN of the EventBridge rule to start instance"
  value       = aws_cloudwatch_event_rule.start_instance_rule.arn
}

output "stop_lambda_function_name" {
  description = "Name of the Lambda function to stop instance"
  value       = aws_lambda_function.stop_instance_lambda.function_name
}

output "start_lambda_function_name" {
  description = "Name of the Lambda function to start instance"
  value       = aws_lambda_function.start_instance_lambda.function_name
}