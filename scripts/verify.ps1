$ErrorActionPreference = 'Stop'
Push-Location (Split-Path $PSScriptRoot -Parent)
try {
  docker compose config --quiet
  if ($LASTEXITCODE -ne 0) { throw 'Invalid compose configuration' }
  $runningServices = @(docker compose ps --services --status running)
  if ($LASTEXITCODE -ne 0) { throw 'Cannot read Docker service status. Check Docker Desktop and Docker permissions.' }
  $requiredServices = @('frontend', 'backend', 'mongodb', 'prometheus', 'grafana', 'node-exporter', 'mongodb-exporter')
  $missingServices = @($requiredServices | Where-Object { $_ -notin $runningServices })
  if ($missingServices.Count -gt 0) {
    docker compose ps -a
    throw ('Services not running: ' + ($missingServices -join ', ') + '. Run scripts/start.ps1 first; if startup fails, inspect docker compose logs --tail 100.')
  }
  docker compose exec -T frontend nginx -t
  if ($LASTEXITCODE -ne 0) { throw 'Nginx check failed. See the Docker/nginx output above.' }
  docker compose exec -T prometheus promtool check config /etc/prometheus/prometheus.yml
  if ($LASTEXITCODE -ne 0) { throw 'Invalid Prometheus configuration' }
  $frontendId = docker compose ps -q frontend
  if (-not $frontendId) { throw 'Frontend is not running' }
  docker run --rm --network "container:$frontendId" --mount "type=bind,source=$PWD/scripts,target=/scripts,readonly" node:24-alpine node /scripts/smoke.mjs http://127.0.0.1:8080
  if ($LASTEXITCODE -ne 0) { throw 'Smoke test failed' }
  $promPort = 9090
  $line = Get-Content .env | Where-Object { $_ -match '^PROMETHEUS_PORT=' }
  if ($line) { $promPort = [int]($line -split '=',2)[1] }
  $targets = @()
  for ($attempt = 0; $attempt -lt 12; $attempt++) {
    $targets = (Invoke-RestMethod "http://127.0.0.1:$promPort/api/v1/targets").data.activeTargets
    if ($targets.Count -ge 4 -and -not ($targets | Where-Object health -ne 'up')) { break }
    Start-Sleep -Seconds 5
  }
  $targets | Select-Object @{n='Job';e={$_.labels.job}},health,lastError | Format-Table
  if ($targets.Count -lt 4 -or ($targets | Where-Object health -ne 'up')) { throw 'Monitoring targets are not UP. Wait 30 seconds and retry.' }
  $result = (Invoke-RestMethod "http://127.0.0.1:$promPort/api/v1/query?query=mongodb_up").data.result
  if (-not $result -or $result[0].value[1] -ne '1') { throw 'mongodb_up != 1' }
  Write-Host 'PASS: Compose, Nginx, Prometheus, application smoke, all 4 targets, MongoDB UP.'
} finally { Pop-Location }
