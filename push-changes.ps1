# Script to commit and push changes to GitHub
# Run this AFTER resolving the git lock file issue

Write-Host "Checking git status..." -ForegroundColor Cyan
git status

Write-Host "`nCommitting staged changes..." -ForegroundColor Green
git commit -m "Update project with new features and components"

Write-Host "`nPushing to GitHub..." -ForegroundColor Green
git push origin main

Write-Host "`nDone! Your changes are now on GitHub." -ForegroundColor Green
Write-Host "Repository: https://github.com/hazim620/DAIv2.git" -ForegroundColor Cyan
