#!/bin/bash

##############################################################################
# Asset Health Monitoring Script
# Monitors asset health and performance in production
##############################################################################

set -euo pipefail

# Configuration
HEALTH_ENDPOINT="${HEALTH_ENDPOINT:-http://localhost:5000/api/assets/health}"
ALERT_THRESHOLD_FAILURES="${ALERT_THRESHOLD_FAILURES:-10}"
ALERT_THRESHOLD_CACHE_MISS="${ALERT_THRESHOLD_CACHE_MISS:-50}"
LOG_FILE="${LOG_FILE:-/var/log/swgoh/asset-health.log}"
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"
EMAIL_RECIPIENTS="${EMAIL_RECIPIENTS:-}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging
log() {
    local message="[$(date +'%Y-%m-%d %H:%M:%S')] $1"
    echo -e "${BLUE}$message${NC}"
    [[ -n "${LOG_FILE:-}" ]] && echo "$message" >> "$LOG_FILE"
}

error() {
    local message="[ERROR] $1"
    echo -e "${RED}$message${NC}" >&2
    [[ -n "${LOG_FILE:-}" ]] && echo "[$(date +'%Y-%m-%d %H:%M:%S')] $message" >> "$LOG_FILE"
}

success() {
    local message="[SUCCESS] $1"
    echo -e "${GREEN}$message${NC}"
    [[ -n "${LOG_FILE:-}" ]] && echo "[$(date +'%Y-%m-%d %H:%M:%S')] $message" >> "$LOG_FILE"
}

warning() {
    local message="[WARNING] $1"
    echo -e "${YELLOW}$message${NC}"
    [[ -n "${LOG_FILE:-}" ]] && echo "[$(date +'%Y-%m-%d %H:%M:%S')] $message" >> "$LOG_FILE"
}

# Check if health endpoint is accessible
check_endpoint() {
    log "Checking health endpoint: $HEALTH_ENDPOINT"

    if ! curl -f -s "$HEALTH_ENDPOINT" > /dev/null; then
        error "Health endpoint is not accessible"
        return 1
    fi

    success "Health endpoint is accessible"
    return 0
}

# Get asset health data
get_health_data() {
    local health_data
    health_data=$(curl -s "$HEALTH_ENDPOINT" 2>/dev/null || echo '{}')

    if [[ -z "$health_data" || "$health_data" == '{}' ]]; then
        error "Failed to retrieve health data"
        return 1
    fi

    echo "$health_data"
}

# Check asset availability
check_asset_availability() {
    local health_data="$1"

    local total=$(echo "$health_data" | jq -r '.total // 0')
    local active=$(echo "$health_data" | jq -r '.active // 0')
    local inactive=$((total - active))

    log "Asset availability check:"
    log "  Total assets: $total"
    log "  Active assets: $active"
    log "  Inactive assets: $inactive"

    if [[ $inactive -gt $ALERT_THRESHOLD_FAILURES ]]; then
        warning "High number of inactive assets: $inactive (threshold: $ALERT_THRESHOLD_FAILURES)"
        return 1
    fi

    success "Asset availability is healthy"
    return 0
}

# Check cache performance
check_cache_performance() {
    log "Checking cache performance..."

    # Check memory cache stats
    local cache_endpoint="${HEALTH_ENDPOINT/health/stats}"
    local cache_data
    cache_data=$(curl -s "$cache_endpoint" 2>/dev/null || echo '{}')

    if [[ "$cache_data" != '{}' ]]; then
        local hit_rate=$(echo "$cache_data" | jq -r '.hitRate // 0')
        local miss_rate=$(echo "$cache_data" | jq -r '.missRate // 0')
        local cache_size=$(echo "$cache_data" | jq -r '.size // 0')

        log "Cache performance:"
        log "  Hit rate: ${hit_rate}%"
        log "  Miss rate: ${miss_rate}%"
        log "  Cache size: $cache_size entries"

        if (( $(echo "$miss_rate > $ALERT_THRESHOLD_CACHE_MISS" | bc -l) )); then
            warning "High cache miss rate: ${miss_rate}% (threshold: ${ALERT_THRESHOLD_CACHE_MISS}%)"
            return 1
        fi

        success "Cache performance is healthy"
    else
        warning "Cache performance data not available"
    fi

    return 0
}

# Check asset freshness
check_asset_freshness() {
    local health_data="$1"

    local recently_updated=$(echo "$health_data" | jq -r '.recentlyUpdated // 0')
    local total=$(echo "$health_data" | jq -r '.total // 1')
    local freshness_percentage=$((recently_updated * 100 / total))

    log "Asset freshness check:"
    log "  Recently updated: $recently_updated"
    log "  Freshness percentage: ${freshness_percentage}%"

    if [[ $freshness_percentage -lt 10 ]]; then
        warning "Low asset freshness: ${freshness_percentage}% (consider updating assets)"
        return 1
    fi

    success "Asset freshness is acceptable"
    return 0
}

# Test sample asset downloads
test_sample_downloads() {
    log "Testing sample asset downloads..."

    local test_assets=(
        "/api/assets/unit/DARTHVADER/portrait"
        "/api/assets/unit/LUKESKYWALKER/icon"
        "/api/assets/fallback/character-portrait.png"
    )

    local failures=0

    for asset in "${test_assets[@]}"; do
        local full_url="${HEALTH_ENDPOINT%/api/assets/health}$asset"

        if curl -f -s -I "$full_url" > /dev/null; then
            log "  ✓ $asset"
        else
            error "  ✗ $asset"
            ((failures++))
        fi
    done

    if [[ $failures -gt 0 ]]; then
        warning "Some sample assets failed to download ($failures/${#test_assets[@]})"
        return 1
    fi

    success "All sample assets downloaded successfully"
    return 0
}

# Generate health report
generate_health_report() {
    local health_data="$1"
    local report_file="asset_health_$(date +%Y%m%d_%H%M%S).json"

    local report=$(cat << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "endpoint": "$HEALTH_ENDPOINT",
  "health_data": $health_data,
  "checks": {
    "endpoint_accessible": true,
    "asset_availability": "healthy",
    "cache_performance": "healthy",
    "asset_freshness": "acceptable",
    "sample_downloads": "healthy"
  },
  "thresholds": {
    "max_failures": $ALERT_THRESHOLD_FAILURES,
    "max_cache_miss_rate": $ALERT_THRESHOLD_CACHE_MISS
  }
}
EOF
)

    echo "$report" > "$report_file"
    log "Health report generated: $report_file"
}

# Send alert notification
send_alert() {
    local message="$1"
    local severity="${2:-warning}"

    log "Sending alert notification: $message"

    # Slack notification
    if [[ -n "$SLACK_WEBHOOK" ]]; then
        local color="warning"
        [[ "$severity" == "error" ]] && color="danger"
        [[ "$severity" == "success" ]] && color="good"

        curl -X POST -H 'Content-type: application/json' \
            --data "{
                \"text\": \"Asset Health Alert\",
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"text\": \"$message\",
                    \"ts\": $(date +%s)
                }]
            }" \
            "$SLACK_WEBHOOK" 2>/dev/null || true
    fi

    # Email notification
    if [[ -n "$EMAIL_RECIPIENTS" ]] && command -v mail &> /dev/null; then
        echo "$message" | mail -s "SWGoH Asset Health Alert" "$EMAIL_RECIPIENTS" || true
    fi
}

# Main health check
run_health_check() {
    log "Starting asset health check..."

    local overall_status="healthy"
    local alerts=()

    # Check endpoint accessibility
    if ! check_endpoint; then
        overall_status="critical"
        alerts+=("Health endpoint is not accessible")
        send_alert "Asset health endpoint is not accessible at $HEALTH_ENDPOINT" "error"
        return 1
    fi

    # Get health data
    local health_data
    health_data=$(get_health_data)
    if [[ $? -ne 0 ]]; then
        overall_status="critical"
        alerts+=("Failed to retrieve health data")
        send_alert "Failed to retrieve asset health data" "error"
        return 1
    fi

    # Run individual checks
    if ! check_asset_availability "$health_data"; then
        overall_status="warning"
        alerts+=("Asset availability issues detected")
    fi

    if ! check_cache_performance; then
        [[ "$overall_status" != "critical" ]] && overall_status="warning"
        alerts+=("Cache performance issues detected")
    fi

    if ! check_asset_freshness "$health_data"; then
        [[ "$overall_status" != "critical" ]] && overall_status="warning"
        alerts+=("Asset freshness issues detected")
    fi

    if ! test_sample_downloads; then
        overall_status="warning"
        alerts+=("Sample asset download issues detected")
    fi

    # Generate report
    generate_health_report "$health_data"

    # Send alerts if needed
    if [[ ${#alerts[@]} -gt 0 ]]; then
        local alert_message="Asset health check completed with issues:\\n$(printf '%s\\n' "${alerts[@]}")"
        send_alert "$alert_message" "$overall_status"
    fi

    # Summary
    case "$overall_status" in
        "healthy")
            success "Asset health check completed - all systems healthy"
            ;;
        "warning")
            warning "Asset health check completed with warnings"
            ;;
        "critical")
            error "Asset health check completed with critical issues"
            return 1
            ;;
    esac

    return 0
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [--continuous] [--help]"
        echo ""
        echo "Options:"
        echo "  --continuous    Run continuously (every 5 minutes)"
        echo "  --help         Show this help message"
        echo ""
        echo "Environment Variables:"
        echo "  HEALTH_ENDPOINT               Health endpoint URL"
        echo "  ALERT_THRESHOLD_FAILURES      Alert threshold for failures"
        echo "  ALERT_THRESHOLD_CACHE_MISS    Alert threshold for cache miss rate"
        echo "  LOG_FILE                      Log file path"
        echo "  SLACK_WEBHOOK                 Slack webhook URL for notifications"
        echo "  EMAIL_RECIPIENTS              Email recipients for alerts"
        exit 0
        ;;
    --continuous)
        log "Starting continuous health monitoring (5-minute intervals)"
        while true; do
            run_health_check
            log "Waiting 5 minutes for next check..."
            sleep 300
        done
        ;;
    *)
        run_health_check
        ;;
esac