# Script to push DAI platform to GitHub
# Run this after resolving the git lock file issue

Write-Host "Adding all files..." -ForegroundColor Green
git add .

Write-Host "Committing changes..." -ForegroundColor Green
git commit -m "Add DAI learning platform with customer pages, landing page, login/signup, and Arabic/English support"

Write-Host "Pushing to GitHub..." -ForegroundColor Green
git push origin main

Write-Host "Done! Your code is now on GitHub." -ForegroundColor Green
Write-Host "Repository: https://github.com/hazim620/DAIv2.git" -ForegroundColor Cyan
