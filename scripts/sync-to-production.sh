#!/bin/bash

##############################################################################
# Asset Sync to Production Script
# Synchronizes assets from development to production environment
##############################################################################

set -euo pipefail

# Configuration (update these for your production environment)
PROD_SERVER="${PROD_SERVER:-user@your-production-server}"
PROD_PATH="${PROD_PATH:-/var/www/tb-tracker}"
LOCAL_ASSETS_DIR="${PWD}/assets"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."

    # Check if assets directory exists
    if [[ ! -d "$LOCAL_ASSETS_DIR" ]]; then
        error "Assets directory not found: $LOCAL_ASSETS_DIR"
        exit 1
    fi

    # Check if rsync is available
    if ! command -v rsync &> /dev/null; then
        error "rsync is required but not installed"
        exit 1
    fi

    # Check SSH connectivity
    log "Testing SSH connection to production server..."
    if ! ssh -o ConnectTimeout=10 -o BatchMode=yes "$PROD_SERVER" exit 2>/dev/null; then
        error "Cannot connect to production server: $PROD_SERVER"
        error "Please ensure SSH key authentication is set up"
        exit 1
    fi

    success "Prerequisites check passed"
}

# Create backup of existing assets on production
create_backup() {
    log "Creating backup of existing production assets..."

    local backup_name="assets_backup_$(date +%Y%m%d_%H%M%S)"

    ssh "$PROD_SERVER" "
        cd $PROD_PATH
        if [[ -d assets ]]; then
            cp -r assets backups/$backup_name
            echo 'Backup created: $backup_name'
        else
            echo 'No existing assets to backup'
        fi
    "

    success "Backup completed"
}

# Clean old backups
cleanup_old_backups() {
    log "Cleaning up old backups (older than $BACKUP_RETENTION_DAYS days)..."

    ssh "$PROD_SERVER" "
        cd $PROD_PATH/backups
        find . -name 'assets_backup_*' -type d -mtime +$BACKUP_RETENTION_DAYS -exec rm -rf {} + 2>/dev/null || true
        echo 'Old backups cleaned up'
    "
}

# Validate assets before sync
validate_assets() {
    log "Validating local assets..."

    local total_files=$(find "$LOCAL_ASSETS_DIR" -type f | wc -l)
    local total_size=$(du -sh "$LOCAL_ASSETS_DIR" | cut -f1)

    log "Found $total_files files, total size: $total_size"

    # Check for essential directories
    local required_dirs=(
        "units/portraits"
        "units/icons"
        "planets/backgrounds"
    )

    for dir in "${required_dirs[@]}"; do
        if [[ ! -d "$LOCAL_ASSETS_DIR/$dir" ]]; then
            warning "Required directory missing: $dir"
        fi
    done

    # Check for manifest file
    if [[ -f "$LOCAL_ASSETS_DIR/manifest.json" ]]; then
        log "Asset manifest found"
    else
        warning "Asset manifest not found - generating..."
        cd tools/asset-processor && node process-assets.js
    fi
}

# Sync assets to production
sync_assets() {
    log "Synchronizing assets to production..."

    # Ensure remote assets directory exists
    ssh "$PROD_SERVER" "mkdir -p $PROD_PATH/assets"

    # Sync with rsync
    rsync -avz \
        --progress \
        --delete \
        --exclude="*.tmp" \
        --exclude="processing/*" \
        --exclude=".DS_Store" \
        --exclude="Thumbs.db" \
        "$LOCAL_ASSETS_DIR/" \
        "$PROD_SERVER:$PROD_PATH/assets/"

    if [[ $? -eq 0 ]]; then
        success "Asset sync completed successfully"
    else
        error "Asset sync failed"
        exit 1
    fi
}

# Update production database
update_production_database() {
    log "Updating production asset database..."

    ssh "$PROD_SERVER" "
        cd $PROD_PATH

        # Refresh asset cache
        if command -v npm &> /dev/null; then
            npm run asset:refresh-db 2>/dev/null || echo 'Asset refresh command not available'
        fi

        # Restart application if needed
        if command -v pm2 &> /dev/null; then
            pm2 reload all 2>/dev/null || echo 'PM2 not available for restart'
        fi
    "
}

# Verify sync integrity
verify_sync() {
    log "Verifying sync integrity..."

    local local_count=$(find "$LOCAL_ASSETS_DIR" -type f | wc -l)
    local remote_count=$(ssh "$PROD_SERVER" "find $PROD_PATH/assets -type f | wc -l")

    log "Local files: $local_count"
    log "Remote files: $remote_count"

    if [[ "$local_count" -eq "$remote_count" ]]; then
        success "File count verification passed"
    else
        warning "File count mismatch - please verify manually"
    fi
}

# Generate sync report
generate_report() {
    log "Generating sync report..."

    local report_file="sync_report_$(date +%Y%m%d_%H%M%S).txt"

    cat > "$report_file" << EOF
Asset Sync Report
================
Date: $(date)
Local Assets: $LOCAL_ASSETS_DIR
Production Server: $PROD_SERVER
Production Path: $PROD_PATH

Summary:
- Local files: $(find "$LOCAL_ASSETS_DIR" -type f | wc -l)
- Local size: $(du -sh "$LOCAL_ASSETS_DIR" | cut -f1)
- Sync status: SUCCESS
- Backup created: YES

Next Steps:
1. Verify application functionality
2. Monitor asset loading performance
3. Check error logs for any issues

EOF

    success "Sync report saved: $report_file"
}

# Main execution
main() {
    log "Starting asset sync to production..."
    log "Production server: $PROD_SERVER"
    log "Production path: $PROD_PATH"

    # Confirmation prompt
    if [[ "${1:-}" != "--force" ]]; then
        echo -n "This will sync assets to production. Continue? (y/N): "
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            log "Sync cancelled by user"
            exit 0
        fi
    fi

    check_prerequisites
    validate_assets
    create_backup
    sync_assets
    update_production_database
    verify_sync
    cleanup_old_backups
    generate_report

    success "Asset sync to production completed successfully!"
    log "Please verify application functionality and monitor for any issues"
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [--force] [--help]"
        echo ""
        echo "Options:"
        echo "  --force    Skip confirmation prompt"
        echo "  --help     Show this help message"
        echo ""
        echo "Environment Variables:"
        echo "  PROD_SERVER              Production server (default: user@your-production-server)"
        echo "  PROD_PATH               Production path (default: /var/www/tb-tracker)"
        echo "  BACKUP_RETENTION_DAYS   Backup retention (default: 7)"
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac