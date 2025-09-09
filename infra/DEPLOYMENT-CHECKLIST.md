# 🚀 Rumba Deployment Checklist

## Pre-Deployment ✅

- [ ] AWS CLI configured with valid credentials
- [ ] Terraform installed (version >= 1.0)
- [ ] SSH key pair generated (`~/.ssh/rumba-key`)
- [ ] Domain name (optional, for SSL)
- [ ] Repository access configured

## Infrastructure Deployment ✅

- [ ] Copy `terraform.tfvars.example` to `terraform.tfvars`
- [ ] Edit `terraform.tfvars` with your configuration
- [ ] Run `terraform init` in `/infra` directory
- [ ] Run `terraform plan` to review changes
- [ ] Run `terraform apply` to deploy infrastructure
- [ ] Note down the public IP from outputs

## Application Deployment ✅

- [ ] SSH to EC2 instance: `ssh -i ~/.ssh/rumba-key ec2-user@<public-ip>`
- [ ] Clone your repository to `/opt/rumba/app`
- [ ] Run deployment script: `sudo /opt/rumba/deploy.sh`
- [ ] Verify backend health: `curl http://localhost:3005`
- [ ] Verify frontend health: `curl http://localhost:3000`
- [ ] Check PM2 processes: `pm2 list`

## Domain & SSL Setup (Optional) ✅

- [ ] Point domain A record to Elastic IP
- [ ] Install certbot: `sudo yum install -y certbot python3-certbot-nginx`
- [ ] Get SSL certificate: `sudo certbot --nginx -d your-domain.com`
- [ ] Test SSL renewal: `sudo certbot renew --dry-run`
- [ ] Setup auto-renewal cron job

## Testing & Verification ✅

- [ ] Frontend loads properly
- [ ] Backend API responds
- [ ] WebSocket connections work (multiplayer)
- [ ] Game creation and joining works
- [ ] Database saves moves correctly
- [ ] Nginx proxying works correctly

## Production Readiness ✅

- [ ] Set up CloudWatch monitoring
- [ ] Configure automated backups for SQLite
- [ ] Set up log rotation
- [ ] Test disaster recovery procedure
- [ ] Document maintenance procedures
- [ ] Set up alerting for downtime

## Security Review ✅

- [ ] Security groups properly configured
- [ ] SSH access restricted (consider VPN)
- [ ] SSL certificate valid and auto-renewing
- [ ] Application runs as non-root user
- [ ] Sensitive data properly secured
- [ ] Regular security updates scheduled

## Cost Monitoring ✅

- [ ] Set up AWS billing alerts
- [ ] Monitor free tier usage
- [ ] Review monthly costs
- [ ] Optimize resource usage if needed

## Backup & Recovery ✅

- [ ] Database backup strategy implemented
- [ ] Test restore procedures
- [ ] Document recovery steps
- [ ] Set up automated backups

---

## Quick Commands Reference

```bash
# Infrastructure
cd infra
terraform init
terraform apply

# Application Management
pm2 list
pm2 restart all
pm2 logs

# Health Check
/opt/rumba/health-check.sh

# View Logs
sudo tail -f /var/log/nginx/access.log
pm2 logs rumba-backend
pm2 logs rumba-frontend

# System Status
systemctl status nginx
docker ps  # if using Docker
```

## Emergency Contacts & Documentation

- AWS Support: [AWS Console](https://console.aws.amazon.com)
- Domain Registrar: _[Add your registrar info]_
- SSL Certificate: Let's Encrypt (auto-renewing)
- Repository: _[Add your Git repository URL]_

---

**Last Updated**: $(date)
**Deployed By**: _[Your name/team]_