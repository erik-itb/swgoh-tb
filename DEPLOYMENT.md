# Production Deployment Guide - Digital Ocean VPS

This guide walks you through deploying the SWGOH Rise of the Empire TB Tracker to a Digital Ocean VPS.

## Prerequisites

### Server Requirements
- **Minimum**: 1 CPU, 2GB RAM, 25GB SSD
- **Recommended**: 2 CPU, 4GB RAM, 50GB SSD
- **Operating System**: Ubuntu 20.04 LTS or later

### Software Requirements
- Docker Engine 20.10+
- Docker Compose 2.0+
- Git
- SSL Certificate (optional but recommended)

## Initial Server Setup

### 1. Create Digital Ocean Droplet
```bash
# Create a new Ubuntu 20.04 droplet via Digital Ocean dashboard
# Choose appropriate size based on requirements above
# Enable monitoring and backups (recommended)
```

### 2. Connect to Server
```bash
ssh root@your_server_ip
```

### 3. Update System
```bash
apt update && apt upgrade -y
apt install -y git curl wget htop
```

### 4. Install Docker
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Enable Docker service
systemctl enable docker
systemctl start docker

# Verify installation
docker --version
docker-compose --version
```

### 5. Create Application User (Recommended)
```bash
# Create non-root user for application
adduser swgoh
usermod -aG docker swgoh
usermod -aG sudo swgoh

# Switch to application user
su - swgoh
```

## Application Deployment

### 1. Clone Repository
```bash
cd /home/swgoh
git clone https://github.com/yourusername/swgoh-rote-tb-recommended-squads.git
cd swgoh-rote-tb-recommended-squads
```

### 2. Configure Environment
```bash
# Copy environment template
cp .env.prod.example .env.prod

# Edit production environment
nano .env.prod
```

#### Required Environment Variables
```bash
# Database Configuration
POSTGRES_DB=swgoh_tb_prod
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-super-secure-password-here

# JWT Secrets (Generate strong 64+ character strings)
JWT_SECRET=your-super-long-jwt-secret-key
JWT_REFRESH_SECRET=your-super-long-refresh-secret-key

# Domain Configuration
CORS_ORIGIN=https://yourdomain.com
VITE_API_URL=https://yourdomain.com/api
```

#### Generate Strong Secrets
```bash
# Generate JWT secrets (run these commands and copy output)
openssl rand -base64 64
openssl rand -base64 64
```

### 3. Deploy Application
```bash
# Make deployment script executable
chmod +x deploy.sh

# Run deployment (first time)
./deploy.sh

# Or skip backup for first deployment
./deploy.sh --skip-backup
```

### 4. Verify Deployment
```bash
# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Test application
curl http://localhost/health
curl http://localhost/api/health
```

## SSL/HTTPS Setup (Recommended)

### Option 1: Let's Encrypt with Certbot
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Stop nginx temporarily
docker-compose -f docker-compose.prod.yml stop frontend

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com

# Start nginx again
docker-compose -f docker-compose.prod.yml start frontend
```

### Option 2: Cloudflare (Recommended for simplicity)
1. Point your domain to Digital Ocean IP
2. Enable Cloudflare proxy
3. Use Flexible SSL mode initially
4. Application will be accessible via HTTPS automatically

## Monitoring and Maintenance

### Health Checks
```bash
# Check all services
./deploy.sh --status

# Individual service health
docker-compose -f docker-compose.prod.yml exec backend curl http://localhost:3000/health
docker-compose -f docker-compose.prod.yml exec frontend curl http://localhost:80/health
```

### Log Management
```bash
# View real-time logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f postgres

# Clear logs (if they get too large)
docker-compose -f docker-compose.prod.yml logs --no-log-prefix | head -n 0
```

### Database Management

#### Backup Database
```bash
# Manual backup
mkdir -p backups
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres swgoh_tb_prod > backups/backup-$(date +%Y%m%d_%H%M%S).sql
```

#### Restore Database
```bash
# Stop application
docker-compose -f docker-compose.prod.yml stop backend frontend

# Restore from backup
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres swgoh_tb_prod < backups/backup-YYYYMMDD_HHMMSS.sql

# Start application
docker-compose -f docker-compose.prod.yml start backend frontend
```

#### Database Migrations
```bash
# Run new migrations
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Reset database (DANGER - will delete all data)
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate reset --force
```

## Updates and Maintenance

### Application Updates
```bash
# Pull latest code
git pull origin main

# Redeploy with backup
./deploy.sh

# Or without backup for minor updates
./deploy.sh --skip-backup
```

### System Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Restart if kernel was updated
sudo reboot
```

### Docker Maintenance
```bash
# Clean up unused resources
docker system prune -f

# Remove unused images
docker image prune -f

# Remove unused volumes (be careful!)
docker volume prune -f
```

## Performance Optimization

### Small VPS Optimization (1-2GB RAM)
```bash
# Add swap file if not present
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### PostgreSQL Tuning
The production Docker Compose file includes optimized PostgreSQL settings for small VPS environments:
- `shared_buffers=256MB`
- `effective_cache_size=512MB`
- `max_connections=100`

### Resource Monitoring
```bash
# Monitor resource usage
htop

# Monitor Docker resources
docker stats

# Check disk usage
df -h
du -sh /var/lib/docker
```

## Troubleshooting

### Common Issues

#### Out of Memory
```bash
# Check memory usage
free -h

# Add more swap or upgrade VPS
# Restart services to free memory
docker-compose -f docker-compose.prod.yml restart
```

#### Database Connection Errors
```bash
# Check if PostgreSQL is running
docker-compose -f docker-compose.prod.yml ps postgres

# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres

# Restart database
docker-compose -f docker-compose.prod.yml restart postgres
```

#### Application Won't Start
```bash
# Check service logs
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend

# Verify environment variables
docker-compose -f docker-compose.prod.yml exec backend env | grep -E "JWT|DATABASE"

# Rebuild and restart
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

### Emergency Procedures

#### Complete Reset
```bash
# DANGER: This will delete all data
docker-compose -f docker-compose.prod.yml down -v
docker system prune -af
./deploy.sh --skip-backup
```

#### Rollback to Previous Version
```bash
# Stop current version
docker-compose -f docker-compose.prod.yml down

# Checkout previous version
git checkout HEAD~1

# Deploy previous version
./deploy.sh --skip-backup
```

## Security Considerations

### Firewall Setup
```bash
# Enable UFW firewall
sudo ufw enable

# Allow SSH
sudo ufw allow ssh

# Allow HTTP/HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Check status
sudo ufw status
```

### Regular Security Updates
```bash
# Set up automatic security updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### Access Control
- Use SSH keys instead of passwords
- Disable root SSH access
- Use fail2ban for brute force protection
- Regular security audits

## Backup Strategy

### Automated Backups
```bash
# Add to crontab for automatic daily backups
crontab -e

# Add this line for daily backups at 2 AM
0 2 * * * cd /home/swgoh/swgoh-rote-tb-recommended-squads && ./backup.sh
```

### Off-site Backups
- Upload backups to Digital Ocean Spaces
- Use GitHub for code backups
- Consider database managed services for critical data

## Support and Monitoring

### Log Aggregation
Consider setting up centralized logging with:
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Grafana + Prometheus
- Simple log forwarding to external services

### Alerting
Set up alerts for:
- High memory usage
- Disk space low
- Application errors
- Database connection failures

### Performance Monitoring
- Application Performance Monitoring (APM)
- Database query monitoring
- User experience monitoring