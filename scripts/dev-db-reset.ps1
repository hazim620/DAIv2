# Create local dev DB from scratch (drops existing data, runs schema + migrations)
# Run from project root: .\scripts\dev-db-reset.ps1

Set-Location $PSScriptRoot\..

Write-Host "Stopping containers and removing volume..." -ForegroundColor Yellow
docker compose down -v

Write-Host "Starting Postgres (init script runs schema + migration on first start)..." -ForegroundColor Green
docker compose up -d

Write-Host ""
Write-Host "If tables are still missing, run: npm run migrate:dev" -ForegroundColor Yellow
Write-Host "  (ensure .env has DB_HOST=localhost, DB_NAME=dai_dev, DB_USER=dai_dev_user, DB_PASSWORD=dai_dev_password, DB_SSL=false)" -ForegroundColor Gray
Write-Host ""
Write-Host "Done. DB is dai_dev, user dai_dev_user." -ForegroundColor Cyan
