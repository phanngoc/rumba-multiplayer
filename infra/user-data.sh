#!/bin/bash

# Update system
yum update -y

# Install Docker
yum install -y docker
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Node.js 18.x
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# Install Git
yum install -y git

# Create application directory
mkdir -p /opt/rumba
chown ec2-user:ec2-user /opt/rumba

# Install PM2 globally for process management
npm install -g pm2

# Create systemd service for PM2
cat > /etc/systemd/system/pm2-ec2-user.service << 'EOF'
[Unit]
Description=PM2 process manager
Documentation=https://pm2.keymetrics.io/
After=network.target

[Service]
Type=forking
User=ec2-user
LimitNOFILE=infinity
LimitNPROC=infinity
LimitCORE=infinity
Environment=PATH=/usr/local/bin:/usr/bin:/bin
Environment=PM2_HOME=/home/ec2-user/.pm2
PIDFile=/home/ec2-user/.pm2/pm2.pid
Restart=on-failure

ExecStart=/usr/local/bin/pm2 resurrect
ExecReload=/usr/local/bin/pm2 reload all
ExecStop=/usr/local/bin/pm2 kill

[Install]
WantedBy=multi-user.target
EOF

systemctl enable pm2-ec2-user

# Install nginx for reverse proxy
yum install -y nginx
systemctl start nginx
systemctl enable nginx

# Create nginx configuration
cat > /etc/nginx/conf.d/rumba.conf << 'EOF'
upstream backend {
    server 127.0.0.1:3005;
}

upstream frontend {
    server 127.0.0.1:3000;
}

server {
    listen 80 default_server;
    server_name _;

    # Serve frontend on root
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API routes
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket for game
    location /socket.io/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Remove default nginx config
rm -f /etc/nginx/conf.d/default.conf

# Test and reload nginx
nginx -t && systemctl reload nginx

# Create deployment script
cat > /opt/rumba/deploy.sh << 'EOF'
#!/bin/bash
set -e

echo "Starting Rumba deployment..."

# Clone or update the repository
if [ ! -d "/opt/rumba/app" ]; then
    echo "Cloning repository..."
    git clone https://github.com/phanngoc/rumba-multiplayer.git /opt/rumba/app
else
    echo "Updating repository..."
    cd /opt/rumba/app
    git pull origin main
fi

cd /opt/rumba/app

# Deploy backend
echo "Deploying backend..."
cd rumba-backend
npm install --production
pm2 delete rumba-backend || true
pm2 start src/main.js --name "rumba-backend" -- --port 3005
pm2 save

# Deploy frontend
echo "Deploying frontend..."
cd ../rumba-frontend
npm install
npm run build
pm2 delete rumba-frontend || true
pm2 serve build 3000 --name "rumba-frontend"
pm2 save

echo "Deployment completed!"
echo "Frontend: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3000"
echo "Backend: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3005"
EOF

chmod +x /opt/rumba/deploy.sh
chown ec2-user:ec2-user /opt/rumba/deploy.sh

# Create a simple health check script
cat > /opt/rumba/health-check.sh << 'EOF'
#!/bin/bash
echo "=== Rumba Health Check ==="
echo "System Status:"
systemctl is-active docker nginx pm2-ec2-user

echo -e "\nPM2 Processes:"
su - ec2-user -c "pm2 list"

echo -e "\nPort Status:"
netstat -tlnp | grep -E ":80|:3000|:3005"

echo -e "\nDisk Usage:"
df -h /

echo -e "\nMemory Usage:"
free -h
EOF

chmod +x /opt/rumba/health-check.sh
chown ec2-user:ec2-user /opt/rumba/health-check.sh

# Log deployment completion
echo "$(date): User data script completed" >> /var/log/rumba-deployment.log