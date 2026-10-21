# start-all.ps1 — Start all realestatecrm services with correct ports and env
#
# Why: each service needs specific PORT env vars and some need NEXTAUTH_SECRET.
# This script starts all 9 services with the correct configuration.
# Canonical service definitions live in scripts/system-tray.ps1 (tray UI) and
# start-all.bat (plain cmd launcher); keep all three in sync.
#
# Usage: powershell -ExecutionPolicy Bypass -File start-all.ps1

$Root = $PSScriptRoot

function Start-Service($name, $port, $cmd, $workDir) {
    # Check if already running
    $listening = netstat -ano | Select-String ":$port\s.*LISTENING"
    if ($listening) {
        Write-Host "  $name (port ${port}): already running" -ForegroundColor Yellow
        return
    }

    Write-Host "  $name (port ${port}): starting..." -ForegroundColor Cyan
    Start-Process -FilePath "cmd.exe" `
        -ArgumentList "/c", "$cmd" `
        -WorkingDirectory (Join-Path $Root $workDir) `
        -WindowStyle Hidden
}

Write-Host "Starting all realestatecrm services..." -ForegroundColor Green

# Port 3000 — Main CRM
Start-Service "main-crm" 3000 "node node_modules\next\dist\bin\next start -p 3000" "."

# Port 8090 — Live Audio WebSocket
Start-Service "live-audio" 8090 "node scripts\live-audio-server.mjs" "."

# Port 3001 — LeadG (standalone Next.js server)
Start-Service "leadg" 3001 "set PORT=3001 && node .next\standalone\server.js" "apps\leadg"

# Port 3002 — Foreclosure Workflow (needs NEXTAUTH_SECRET)
Start-Service "foreclosure" 3002 "set NODE_ENV=production && set PORT=3002 && set NEXTAUTH_SECRET=dev_secret_change_me && set NEXTAUTH_URL=http://localhost:3002 && node start-3002.js" "apps\foreclosureworkflow"

# Port 3003 — ContentPlanner Web
Start-Service "contentplanner" 3003 "node ..\..\node_modules\next\dist\bin\next start -p 3003" "apps\contentplanner\apps\web"

# Port 3031 — ContentPlanner API
Start-Service "contentplanner-api" 3031 "cmd /c start-api.bat" "apps\contentplanner\packages\api"

# Port 3004 — Media Workflow API
Start-Service "media-workflow" 3004 "node dist\src\index.js" "apps\media-workflow"

# Port 3005 — LegacyLeads Frontend
Start-Service "legacyleads" 3005 "set NEXTAUTH_SECRET=dev_secret_change_me && set NEXTAUTH_URL=http://localhost:3005 && node node_modules\next\dist\bin\next start -p 3005" "apps\legacyleads\frontend"

# Port 3006 — LegacyLeads API
Start-Service "legacyleads-api" 3006 "set PORT=3006 && npx tsx src/index.ts" "apps\legacyleads\backend"

# Wait and verify
Write-Host ""
Write-Host "Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host "=== Service Status ===" -ForegroundColor Green
foreach ($port in @(3000,3001,3002,3003,3031,3004,3005,3006,8090)) {
    $listening = netstat -ano | Select-String ":$port\s.*LISTENING"
    if ($listening) {
        Write-Host "  Port ${port}: RUNNING" -ForegroundColor Green
    } else {
        Write-Host "  Port ${port}: NOT RUNNING" -ForegroundColor Red
    }
}
