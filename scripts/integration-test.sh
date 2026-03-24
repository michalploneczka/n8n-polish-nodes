#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="docker-compose.test.yml"
PROJECT_NAME="n8n-integration-test"

cleanup() {
  echo "Tearing down test containers..."
  docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" down --volumes --remove-orphans 2>/dev/null || true
}
trap cleanup EXIT

echo "Building all packages..."
pnpm run build:all

echo "Starting n8n test container..."
docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d --wait

echo "Running integration tests..."
npx jest --config jest.config.integration.js

echo "Integration tests passed!"
