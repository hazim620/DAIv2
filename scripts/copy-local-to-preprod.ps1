# Copy local dev DB (Docker, port 5432) to preprod (localhost:5433, dai_preprod)
# Target JDBC: jdbc:postgresql://localhost:5433/dai_preprod?ssl_mode=require
#
# Prereqs:
#   - Docker running, local dev DB up (docker compose up -d)
#   - Preprod Postgres running on localhost:5433; database "dai_preprod" must exist
#     (Create it if needed: psql -h localhost -p 5433 -U postgres -c "CREATE DATABASE dai_preprod;")
# Set preprod credentials (or you will be prompted):
#   $env:PREPROD_DB_USER = "your_preprod_user"
#   $env:PREPROD_DB_PASSWORD = "your_preprod_password"
#
# Run from project root: .\scripts\copy-local-to-preprod.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

$preprodUser = $env:PREPROD_DB_USER
$preprodPass = $env:PREPROD_DB_PASSWORD
if (-not $preprodUser) { $preprodUser = Read-Host "Preprod DB user" }
if (-not $preprodPass) { $preprodPass = Read-Host "Preprod DB password" -AsSecureString; $preprodPass = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($preprodPass)) }

$backupFile = "preprod-restore-$(Get-Date -Format 'yyyyMMdd-HHmmss').sql"

Write-Host "Dumping local dev DB (dai_dev from container)..." -ForegroundColor Cyan
docker exec dai-postgres-dev pg_dump -U dai_dev_user -d dai_dev --no-owner --no-acl -F p 2>&1 | Set-Content -Path $backupFile -Encoding utf8
if ($LASTEXITCODE -ne 0) {
  Write-Host "Dump failed. Is the container 'dai-postgres-dev' running? (docker compose up -d)" -ForegroundColor Red
  exit 1
}

Write-Host "Restoring to preprod (localhost:5433/dai_preprod)..." -ForegroundColor Cyan
# Use Docker postgres client to connect to host:5433 (host.docker.internal), sslmode=require
$safePass = [uri]::EscapeDataString($preprodPass)
$connStr = "postgresql://${preprodUser}:${safePass}@host.docker.internal:5433/dai_preprod?sslmode=require"
docker run --rm -v "${PWD}:/data" postgres:17 psql $connStr -f "/data/$backupFile" 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host "Restore failed. Check preprod is running on 5433, database dai_preprod exists, and credentials." -ForegroundColor Red
  exit 1
}

Write-Host "Done. Backup kept as $backupFile (you can delete it)." -ForegroundColor Green
