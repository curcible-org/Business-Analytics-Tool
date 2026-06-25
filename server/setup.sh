#!/usr/bin/env bash
# Run once on a fresh AlmaLinux 9 VPS as root.
# Usage: bash setup.sh

set -euo pipefail

echo "==> Installing Docker"
dnf install -y dnf-plugins-core
dnf config-manager --add-repo https://download.docker.com/linux/rhel/docker-ce.repo
dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
systemctl enable --now docker

echo "==> Opening firewall ports"
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload

echo "==> Cloning / copying server config"
mkdir -p /opt/curcible-server
cp docker-compose.yml Caddyfile /opt/curcible-server/

echo ""
echo "Done. Next steps:"
echo "  1. cd /opt/curcible-server"
echo "  2. cp /path/to/.env.example .env && nano .env   (fill in real values)"
echo "  3. bash deploy.sh"
