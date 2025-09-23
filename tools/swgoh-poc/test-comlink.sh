#!/bin/bash
set -e

echo "🚀 Testing SWGoH Comlink API..."

# Wait for service to be ready
echo "⏳ Waiting for Comlink to start..."
sleep 10

# Test basic health/status
echo "🔍 Testing basic connectivity..."
curl -f http://localhost:5000/ || echo "❌ Root endpoint failed"

# Test API endpoints
echo "📊 Testing API endpoints..."

# Try to get game data
echo "Getting game data..."
curl -s "http://localhost:5000/api/data" | jq . > logs/gamedata-test.json || echo "❌ Game data endpoint failed"

# Try to get metadata
echo "Getting metadata..."
curl -s "http://localhost:5000/api/metadata" | jq . > logs/metadata-test.json || echo "❌ Metadata endpoint failed"

# List available endpoints
echo "Getting available endpoints..."
curl -s "http://localhost:5000/api" | jq . > logs/api-endpoints.json || echo "❌ API list failed"

echo "✅ Comlink API tests completed. Check logs/ for results."