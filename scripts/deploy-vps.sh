#!/usr/bin/env bash
# Run on VPS AFTER Ansible bootstrap. Args are immutable GHCR image names.
set -euo pipefail
cd /opt/pins/app
backend=${1:?backend image required}
frontend=${2:?frontend image required}
[[ "$backend" =~ ^ghcr.io/[a-z0-9._/-]+:[a-f0-9]{40}$ ]] || { echo 'Invalid backend image'; exit 2; }
[[ "$frontend" =~ ^ghcr.io/[a-z0-9._/-]+:[a-f0-9]{40}$ ]] || { echo 'Invalid frontend image'; exit 2; }
exec 9>/opt/pins/deploy.lock
flock -n 9 || { echo 'Another deployment is running'; exit 1; }
umask 077
cp .env .env.previous
rollback() {
  trap - ERR
  cp .env.previous .env
  docker compose up -d --no-build --wait --wait-timeout 240 || true
  echo 'Deployment failed; previous image configuration restored.' >&2
  exit 1
}
trap rollback ERR
# Secrets stay in the original .env and are never printed.
sed -i "s|^BACKEND_IMAGE=.*|BACKEND_IMAGE=$backend|;s|^FRONTEND_IMAGE=.*|FRONTEND_IMAGE=$frontend|" .env
docker compose config --quiet
docker compose pull backend frontend
docker compose up -d --no-build --wait --wait-timeout 240
curl --fail --retry 5 --retry-delay 3 http://127.0.0.1/api/health/ready
trap - ERR
echo 'Deployment verified. Rollback config: /opt/pins/app/.env.previous'
