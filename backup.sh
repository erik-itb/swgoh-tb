#!/bin/bash

# Automated Backup Script for SWGOH RotE TB Application
# This script creates backups of the database and application data

set -e

# Configuration
BACKUP_DIR="./backups"
RETENTION_DAYS=7
COMPOSE_FILE="docker-compose.prod.yml"
DATE=$(date +%Y%m%d_%H%M%S)

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Load environment variables
if [ -f .env.prod ]; then
    source .env.prod
else
    log_error ".env.prod file not found"
    exit 1
fi

# Database backup
log_info "Creating database backup..."
BACKUP_FILE="$BACKUP_DIR/database_backup_$DATE.sql"

if docker-compose -f "$COMPOSE_FILE" ps postgres | grep -q "Up"; then
    docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_dump \
        -U "${POSTGRES_USER:-postgres}" \
        "${POSTGRES_DB:-swgoh_tb_prod}" > "$BACKUP_FILE"

    # Compress the backup
    gzip "$BACKUP_FILE"
    log_success "Database backup created: ${BACKUP_FILE}.gz"
else
    log_error "PostgreSQL container is not running"
    exit 1
fi

# Application data backup (if needed)
# Uncomment if you have persistent application data outside the database
# log_info "Creating application data backup..."
# tar -czf "$BACKUP_DIR/app_data_backup_$DATE.tar.gz" ./uploads ./logs 2>/dev/null || true

# Docker volumes backup
log_info "Creating Docker volumes backup..."
VOLUMES_BACKUP="$BACKUP_DIR/volumes_backup_$DATE.tar.gz"
docker run --rm \
    -v swgoh-rote-tb-recommended-squads_postgres_data_prod:/source:ro \
    -v "$(pwd)/$BACKUP_DIR":/backup \
    alpine tar -czf "/backup/volumes_backup_$DATE.tar.gz" -C /source .

log_success "Docker volumes backup created: $VOLUMES_BACKUP"

# Clean up old backups
log_info "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete

# Backup summary
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/*.gz 2>/dev/null | wc -l)
BACKUP_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)

log_success "Backup completed successfully!"
echo "  - Total backups: $BACKUP_COUNT"
echo "  - Backup directory size: $BACKUP_SIZE"
echo "  - Latest backup: $(ls -t "$BACKUP_DIR"/*.gz 2>/dev/null | head -1 | xargs basename)"

# Optional: Upload to remote storage
# Uncomment and configure if you want to upload backups to cloud storage
# upload_to_cloud() {
#     log_info "Uploading backup to cloud storage..."
#     # Example for Digital Ocean Spaces (requires s3cmd configured)
#     # s3cmd put "$BACKUP_DIR"/*_$DATE.* s3://your-backup-bucket/swgoh-tb/
#     #
#     # Example for rsync to remote server
#     # rsync -av "$BACKUP_DIR"/ user@backup-server:/backups/swgoh-tb/
# }
# upload_to_cloud