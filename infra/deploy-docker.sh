#!/bin/bash
set -e

# Deployment script using Docker Compose
echo "🚀 Starting Rumba Docker deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Navigate to project root
cd "$(dirname "$0")/.."

echo -e "${YELLOW}📦 Building and starting containers...${NC}"

# Stop existing containers
docker-compose down --remove-orphans

# Build and start containers
docker-compose up --build -d

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for services to be healthy...${NC}"

# Wait for backend
echo "Waiting for backend..."
timeout 60 bash -c 'until docker exec rumba-backend curl -f http://localhost:3005 &>/dev/null; do sleep 2; done'

# Wait for frontend
echo "Waiting for frontend..."
timeout 60 bash -c 'until docker exec rumba-frontend curl -f http://localhost:3000 &>/dev/null; do sleep 2; done'

# Show container status
echo -e "\n${GREEN}✅ Deployment completed!${NC}"
docker-compose ps

# Get public IP if on EC2
PUBLIC_IP=""
if curl -m 5 -s http://169.254.169.254/latest/meta-data/public-ipv4 &>/dev/null; then
    PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
    echo -e "\n${GREEN}🌐 Application URLs:${NC}"
    echo -e "Frontend: http://${PUBLIC_IP}"
    echo -e "Backend:  http://${PUBLIC_IP}:3005"
else
    echo -e "\n${GREEN}🌐 Local Application URLs:${NC}"
    echo -e "Frontend: http://localhost"
    echo -e "Backend:  http://localhost:3005"
fi

# Show logs for debugging
echo -e "\n${YELLOW}📋 Recent logs:${NC}"
docker-compose logs --tail=10

echo -e "\n${GREEN}🎉 Rumba is now running!${NC}"
echo "To view logs: docker-compose logs -f"
echo "To stop: docker-compose down"