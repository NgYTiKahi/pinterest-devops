#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
docker info >/dev/null
docker run --rm --user "$(id -u):$(id -g)" -v "$PWD:/workspace" -w /workspace node:24-alpine node scripts/setup.mjs --local
docker compose config --quiet
docker compose up -d --build --wait --wait-timeout 240
docker compose exec -T backend node src/seed.js
docker compose ps
printf '%s\n' 'App: http://localhost:8080 | Grafana: http://localhost:3000 | Prometheus: http://localhost:9090'
