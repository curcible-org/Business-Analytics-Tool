#!/usr/bin/env bash
# Run from /opt/curcible-server to start or update n8n.
# Usage: bash deploy.sh

set -euo pipefail

if [ ! -f .env ]; then
  echo "ERROR: .env not found. Copy .env.example and fill in values first."
  exit 1
fi

echo "==> Pulling latest images"
docker compose pull

echo "==> Starting services"
docker compose up -d

echo "==> Status"
docker compose ps

echo ""
echo "n8n is starting at https://$(grep N8N_HOST .env | cut -d= -f2)"
echo "Caddy SSL provisioning may take ~30 seconds on first run."
