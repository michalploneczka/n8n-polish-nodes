#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="docker-compose.test.yml"
PROJECT_NAME="n8n-e2e-test"

cleanup() {
  echo "Tearing down test containers..."
  docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" down --volumes --remove-orphans 2>/dev/null || true
}
trap cleanup EXIT

echo "Building all packages..."
pnpm run build:all

echo "Starting n8n test container..."
docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d --wait

echo "Running E2E tests..."
CEIDG_API_KEY="${CEIDG_API_KEY:-}" \
SMSAPI_TOKEN="${SMSAPI_TOKEN:-}" \
CENEO_API_KEY="${CENEO_API_KEY:-}" \
GUS_REGON_KEY="${GUS_REGON_KEY:-abcde12345abcde12345}" \
LINKERCLOUD_API_KEY="${LINKERCLOUD_API_KEY:-}" \
LINKERCLOUD_DOMAIN="${LINKERCLOUD_DOMAIN:-}" \
npx jest --config jest.config.e2e.js "$@"

echo "E2E tests passed!"
