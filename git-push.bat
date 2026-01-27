@echo off
set HTTP_PROXY=
set HTTPS_PROXY=
set http_proxy=
set https_proxy=
set NO_PROXY=*
cd /d "%~dp0"
git -c http.proxy= -c https.proxy= push origin main
pause
