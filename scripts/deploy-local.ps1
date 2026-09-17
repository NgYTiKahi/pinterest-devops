param([string]$DeployDir = "$env:USERPROFILE/Documents/PinsDeploy")
$ErrorActionPreference = 'Stop'
$source = Split-Path $PSScriptRoot -Parent
$destination = [IO.Path]::GetFullPath($DeployDir)
if ($destination -eq [IO.Path]::GetFullPath($source)) { throw 'DeployDir must be separate from CI checkout.' }
New-Item -ItemType Directory -Force $destination | Out-Null
# No /MIR: preserve .env, data and user-created files in the deployment directory.
robocopy $source $destination /E /XD node_modules .git .terraform dist .deploy /XF .env *.tfstate* *.tfvars /NFL /NDL /NJH /NJS
if ($LASTEXITCODE -ge 8) { throw "Copy failed: $LASTEXITCODE" }
& (Join-Path $destination 'scripts/start.ps1') -SkipSeed
& (Join-Path $destination 'scripts/verify.ps1')
