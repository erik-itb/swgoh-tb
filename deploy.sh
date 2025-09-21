#!/bin/bash

# Production Deployment Script for Digital Ocean VPS
# This script deploys the SWGOH RotE TB application to a production environment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="swgoh-rote-tb"
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.prod"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    # Check if Docker Compose is available (plugin or standalone)
    if docker compose version &> /dev/null; then
        log_info "Using Docker Compose plugin (recommended for Ubuntu 24.04+)"
        DOCKER_COMPOSE_CMD="docker compose"
    elif command -v docker-compose &> /dev/null; then
        log_info "Using Docker Compose standalone (legacy)"
        DOCKER_COMPOSE_CMD="docker-compose"
    else
        log_error "Docker Compose is not installed. Please install Docker Compose or Docker Compose plugin."
        exit 1
    fi

    # Check if .env.prod exists
    if [ ! -f "$ENV_FILE" ]; then
        log_error "Production environment file $ENV_FILE not found."
        log_info "Please copy .env.prod.example to $ENV_FILE and configure it."
        exit 1
    fi

    # Check if required environment variables are set
    source "$ENV_FILE"
    if [ -z "$POSTGRES_PASSWORD" ] || [ -z "$JWT_SECRET" ] || [ -z "$JWT_REFRESH_SECRET" ]; then
        log_error "Required environment variables are not set in $ENV_FILE"
        log_info "Please ensure POSTGRES_PASSWORD, JWT_SECRET, and JWT_REFRESH_SECRET are configured."
        exit 1
    fi

    log_success "Prerequisites check passed."
}

backup_database() {
    log_info "Creating database backup..."

    # Create backup directory if it doesn't exist
    mkdir -p ./backups

    # Create timestamped backup
    BACKUP_FILE="./backups/backup-$(date +%Y%m%d_%H%M%S).sql"

    # Check if database container is running
    if $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" ps postgres | grep -q "Up"; then
        $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" exec -T postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "$BACKUP_FILE"
        log_success "Database backup created: $BACKUP_FILE"
    else
        log_warning "Database container not running. Skipping backup."
    fi
}

deploy_application() {
    log_info "Starting deployment process..."

    # Pull latest images and build
    log_info "Building application images..."
    $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" build --no-cache

    # Stop existing containers
    log_info "Stopping existing containers..."
    $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" down

    # Start services with health checks
    log_info "Starting services..."
    $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" up -d

    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."

    max_attempts=30
    attempt=1

    while [ $attempt -le $max_attempts ]; do
        if $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" ps | grep -q "unhealthy"; then
            log_warning "Some services are still starting... (attempt $attempt/$max_attempts)"
            sleep 10
            ((attempt++))
        else
            break
        fi
    done

    if [ $attempt -gt $max_attempts ]; then
        log_error "Services failed to start properly. Check logs with: $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE logs"
        exit 1
    fi

    log_success "All services are running and healthy."
}

run_database_migrations() {
    log_info "Running database migrations..."

    # Wait for database to be ready
    sleep 5

    # Run Prisma migrations
    $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" exec backend npx prisma migrate deploy

    # Optionally seed the database (only on first deployment)
    read -p "Do you want to seed the database with sample data? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Seeding database..."
        $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" exec backend npm run db:seed
        log_success "Database seeded successfully."
    fi
}

cleanup() {
    log_info "Cleaning up unused Docker resources..."

    # Remove unused images
    docker image prune -f

    # Remove unused volumes (be careful with this in production)
    read -p "Do you want to remove unused Docker volumes? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker volume prune -f
    fi

    log_success "Cleanup completed."
}

show_status() {
    log_info "Deployment Status:"
    echo
    $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" ps
    echo

    log_info "Application URLs:"
    echo "Frontend: http://$(hostname -I | awk '{print $1}')"
    echo "Backend API: http://$(hostname -I | awk '{print $1}'):3000"
    echo

    log_info "Useful commands:"
    echo "  View logs: $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE logs -f"
    echo "  Restart services: $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE restart"
    echo "  Stop services: $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE down"
    echo "  View service status: $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE ps"
}

# Main deployment process
main() {
    log_info "Starting deployment of $APP_NAME..."
    echo

    check_prerequisites

    # Create backup if database exists
    if [ "$1" != "--skip-backup" ]; then
        backup_database
    fi

    deploy_application
    run_database_migrations
    cleanup

    echo
    log_success "Deployment completed successfully!"
    echo
    show_status
}

# Handle script arguments
case "$1" in
    --help|-h)
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --help, -h          Show this help message"
        echo "  --skip-backup       Skip database backup before deployment"
        echo "  --status            Show current deployment status"
        echo ""
        echo "Examples:"
        echo "  $0                  Full deployment with backup"
        echo "  $0 --skip-backup    Deploy without creating backup"
        echo "  $0 --status         Show current status"
        ;;
    --status)
        show_status
        ;;
    *)
        main "$@"
        ;;
esac