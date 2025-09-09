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