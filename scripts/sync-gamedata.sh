#!/bin/bash

# SWGoH GameData Sync Script for Production
# This script fetches the latest game data and updates the database

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
GAMEDATA_DIR="$PROJECT_ROOT/data/gamedata"
LOG_FILE="$PROJECT_ROOT/logs/gamedata-sync.log"

# Ensure directories exist
mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "$GAMEDATA_DIR"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "🚀 Starting SWGoH GameData sync..."

# Step 1: Backup current data
log "📂 Backing up current data..."
if [ -d "$GAMEDATA_DIR" ]; then
    cp -r "$GAMEDATA_DIR" "$GAMEDATA_DIR.backup.$(date +%Y%m%d_%H%M%S)" || {
        log "❌ Failed to backup current data"
        exit 1
    }
    log "✅ Data backed up successfully"
fi

# Step 2: Fetch latest gamedata
log "📦 Fetching latest gamedata..."
cd "$SCRIPT_DIR/gamedata-import"
node fetch-gamedata.js || {
    log "❌ Failed to fetch gamedata"
    exit 1
}
log "✅ GameData fetched successfully"

# Step 3: Import to database
log "💾 Importing to database..."
cd "$SCRIPT_DIR/gamedata-import"
npx tsx import-to-database.ts || {
    log "❌ Failed to import to database"
    exit 1
}
log "✅ Database import completed"

# Step 4: Verify import
log "🔍 Verifying import..."
cd "$SCRIPT_DIR/gamedata-import"
npx tsx check-import-results.ts || {
    log "❌ Import verification failed"
    exit 1
}
log "✅ Import verification passed"

# Step 5: Cleanup old backups (keep last 5)
log "🧹 Cleaning up old backups..."
find "$PROJECT_ROOT/data" -name "gamedata.backup.*" -type d | sort -r | tail -n +6 | xargs rm -rf
log "✅ Cleanup completed"

log "🎉 GameData sync completed successfully!"

# Optional: Send notification (uncomment if needed)
# curl -X POST "YOUR_WEBHOOK_URL" -H "Content-Type: application/json" -d "{\"text\":\"SWGoH GameData sync completed successfully!\"}"