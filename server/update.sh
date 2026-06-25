#!/usr/bin/env bash
# Pull latest n8n image and restart with zero-downtime.
# Usage: bash update.sh

set -euo pipefail

echo "==> Pulling latest n8n image"
docker compose pull n8n

echo "==> Restarting n8n"
docker compose up -d --no-deps n8n

echo "==> Done"
docker compose ps n8n
