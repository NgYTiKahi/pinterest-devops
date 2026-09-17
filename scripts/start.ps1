param([switch]$SkipSeed)
$ErrorActionPreference = 'Stop'
Push-Location (Split-Path $PSScriptRoot -Parent)
try {
  docker info --format '{{.ServerVersion}}'
  if ($LASTEXITCODE -ne 0) { throw 'Open Docker Desktop (Linux containers) and wait for Engine Running.' }
  # Containerized Node means Node.js installation on host is optional.
  docker run --rm --mount "type=bind,source=$PWD,target=/workspace" -w /workspace node:24-alpine node scripts/setup.mjs --local
  if ($LASTEXITCODE -ne 0) { throw 'Could not create .env.' }
  docker compose config --quiet
  if ($LASTEXITCODE -ne 0) { throw 'Invalid Compose configuration.' }
  docker compose up -d --build --wait --wait-timeout 240
  if ($LASTEXITCODE -ne 0) { throw 'Startup failed. Run: docker compose logs --tail 100.' }
  if (-not $SkipSeed) {
    docker compose exec -T backend node src/seed.js
    if ($LASTEXITCODE -ne 0) { throw 'Database seed failed.' }
  }
  docker compose ps
  Write-Host 'App: http://localhost:8080 | Grafana: http://localhost:3000 | Prometheus: http://localhost:9090'
  Write-Host 'Grafana user: admin. Password: GRAFANA_ADMIN_PASSWORD in .env.'
} finally { Pop-Location }
