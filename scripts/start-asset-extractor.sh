#!/bin/bash

# Start swgoh-ae2 asset extractor container
# Creates a temporary container that we can access via API

set -e

CONTAINER_NAME="swgoh-ae2-temp"
PORT="3001"

echo "Starting swgoh-ae2 asset extractor..."

# Stop and remove existing container if it exists
if docker ps -a | grep -q $CONTAINER_NAME; then
    echo "Stopping existing container..."
    docker stop $CONTAINER_NAME || true
    docker rm $CONTAINER_NAME || true
fi

# Start the container
echo "Starting new container on port $PORT..."
docker run --name=$CONTAINER_NAME \
  -d \
  --restart unless-stopped \
  -p $PORT:8080 \
  ghcr.io/swgoh-utils/swgoh-ae2:latest

echo "Container started. API available at http://localhost:$PORT"
echo "Swagger documentation: http://localhost:$PORT/swagger"

# Wait for container to be ready
echo "Waiting for API to be ready..."
for i in {1..30}; do
    if curl -s -f http://localhost:$PORT/health > /dev/null 2>&1; then
        echo "API is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "API failed to start within 30 seconds"
        exit 1
    fi
    sleep 1
done

echo "Asset extractor is ready for use!"