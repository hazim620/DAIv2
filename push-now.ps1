# Clear all proxy settings
$env:HTTP_PROXY = $null
$env:HTTPS_PROXY = $null
$env:http_proxy = $null
$env:https_proxy = $null
$env:NO_PROXY = "*"
$env:GIT_HTTP_PROXY = ""
$env:GIT_HTTPS_PROXY = ""

# Set git config to bypass proxy
git config --local http.proxy ""
git config --local https.proxy ""
git config --local http.sslBackend openssl

# Push
git push origin main
