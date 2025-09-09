# Rumba Infrastructure Deployment

This directory contains the infrastructure code and deployment scripts for the Rumba puzzle game.

## 🏗️ Architecture

The deployment consists of:
- **EC2 Instance**: t2.micro (free tier eligible) running Amazon Linux 2023
- **Frontend**: Next.js application served on port 3000
- **Backend**: NestJS API server on port 3005
- **Database**: SQLite (file-based, stored on EC2 instance)
- **Reverse Proxy**: Nginx for routing and SSL termination
- **Process Management**: PM2 for Node.js processes

## 💰 Cost Optimization

- **EC2 t3.micro**: Free tier eligible (750 hours/month for first 12 months)
- **Elastic IP**: Free when associated with running instance
- **EBS Storage**: 30 GB free tier (we use 30 GB)
- **Data Transfer**: 1 GB free per month
- **SQLite**: No additional database costs

**Estimated monthly cost after free tier: $8-12**

## 🚀 Quick Deployment

### Prerequisites

1. **AWS CLI configured**:
   ```bash
   aws configure
   ```

2. **Terraform installed**:
   ```bash
   # macOS
   brew install terraform
   
   # Ubuntu/Debian
   wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor | sudo tee /usr/share/keyrings/hashicorp-archive-keyring.gpg
   echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
   sudo apt update && sudo apt install terraform
   ```

3. **SSH Key Pair**:
   ```bash
   ssh-keygen -t rsa -b 4096 -f ~/.ssh/rumba-key
   ```

### Deployment Steps

1. **Clone and setup**:
   ```bash
   git clone <your-repo>
   cd rumba/infra
   ```

2. **Configure variables**:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your settings
   ```

3. **Deploy infrastructure**:
   ```bash
   terraform init
   terraform plan
   terraform apply
   ```

4. **Connect and deploy application**:
   ```bash
   # Get connection info
   terraform output
   
   # SSH to instance
   ssh -i ~/.ssh/rumba-key ec2-user@<public-ip>
   
   # Deploy the application
   sudo /opt/rumba/deploy.sh
   ```

## 📁 File Structure

```
infra/
├── main.tf              # Main Terraform configuration
├── variables.tf         # Input variables
├── outputs.tf           # Output values
├── user-data.sh         # EC2 initialization script
├── nginx.conf           # Nginx configuration
├── deploy-docker.sh     # Docker deployment script
├── terraform.tfvars.example
└── README.md           # This file
```

## 🔧 Configuration Options

### terraform.tfvars

```hcl
# AWS Configuration
aws_region = "us-east-1"          # Change to your preferred region

# EC2 Configuration  
instance_type = "t3.micro"        # Free tier eligible

# SSH Configuration
key_name        = "rumba-key"
public_key_path = "~/.ssh/rumba-key.pub"

# Environment
environment = "production"

# Optional: Custom domain
domain_name = "your-domain.com"   # If you have a domain
```

## 🐋 Docker Deployment (Alternative)

For containerized deployment:

1. **Build and run locally**:
   ```bash
   cd rumba
   docker-compose up --build
   ```

2. **Deploy to EC2 with Docker**:
   ```bash
   # After infrastructure deployment
   scp -i ~/.ssh/rumba-key docker-compose.yml ec2-user@<public-ip>:/opt/rumba/
   ssh -i ~/.ssh/rumba-key ec2-user@<public-ip>
   cd /opt/rumba
   ./deploy-docker.sh
   ```

## 🔍 Monitoring & Maintenance

### Health Checks
```bash
# SSH to instance
ssh -i ~/.ssh/rumba-key ec2-user@<public-ip>

# Run health check
/opt/rumba/health-check.sh
```

### View Logs
```bash
# PM2 logs
pm2 logs

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -f
```

### Application Management
```bash
# Restart services
pm2 restart all

# Update application
cd /opt/rumba/app && git pull
/opt/rumba/deploy.sh

# Check processes
pm2 list
```

## 🔒 Security Features

- **Security Groups**: Restricts access to necessary ports only
- **SSH Key Authentication**: No password authentication
- **Nginx Rate Limiting**: Prevents abuse
- **Process Isolation**: Non-root user for applications
- **Encrypted Storage**: EBS volumes are encrypted

## 🌐 SSL/HTTPS Setup (Optional)

### Using Let's Encrypt (Recommended)

1. **Point your domain to the Elastic IP**
2. **Install Certbot**:
   ```bash
   sudo yum install -y certbot python3-certbot-nginx
   ```

3. **Get certificate**:
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

4. **Auto-renewal**:
   ```bash
   sudo crontab -e
   # Add: 0 12 * * * /usr/bin/certbot renew --quiet
   ```

## 🛠️ Troubleshooting

### Common Issues

1. **Connection Timeout**:
   - Check security group rules
   - Verify Elastic IP association
   - Check if services are running: `pm2 list`

2. **Application Not Starting**:
   - Check logs: `pm2 logs`
   - Verify Node.js installation: `node --version`
   - Check disk space: `df -h`

3. **Database Issues**:
   - Check SQLite file permissions
   - Verify application has write access to `/opt/rumba/app/rumba-backend/`

### Support Commands

```bash
# Resource usage
htop
df -h
free -h

# Network connectivity
netstat -tlnp
ss -tlnp

# Process management
pm2 monit
systemctl status nginx
```

## 📊 Scaling Options

### Vertical Scaling (Upgrade Instance)
```bash
# Stop instance, change instance type in AWS console, start instance
terraform apply -var="instance_type=t3.small"
```

### Add Monitoring (CloudWatch)
- Enable detailed monitoring in EC2 console
- Set up CloudWatch alarms for CPU/Memory
- Configure log shipping to CloudWatch Logs

## 🗑️ Cleanup

To destroy the infrastructure:
```bash
terraform destroy
```

**Warning**: This will delete all resources including the database!

## 📝 Notes

- SQLite database is stored on the EBS volume
- Regular backups recommended for production use
- Consider upgrading to RDS for high availability
- Monitor costs in AWS Billing console