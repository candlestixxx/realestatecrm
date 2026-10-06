# start-all.ps1 — Start all realestatecrm services with correct ports and env
#
# Why: each service needs specific PORT env vars and some need NEXTAUTH_SECRET.
# This script starts all 8 services with the correct configuration.
# All service state is in the system tray (scripts/system-tray.ps1) or here.
#
# Usage: powershell -ExecutionPolicy Bypass -File start-all.ps1

$Root = $PSScriptRoot
$logDir = Join-Path $Root "logs"
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory $logDir | Out-Null }

function Start-Service($name, $port, $cmd, $workDir, $extraEnv) {
    $logOut = Join-Path $logDir "$name.out.log"
    $logErr = Join-Path $logDir "$name.err.log"
    
    # Check if already running
    $listening = netstat -ano | Select-String ":$port.*LISTENING"
    if ($listening) {
        Write-Host "  $name (port ${port}): already running" -ForegroundColor Yellow
        return
    }
    
    Write-Host "  $name (port ${port}): starting..." -ForegroundColor Cyan
    $envArgs = @()
    if ($extraEnv) {
        foreach ($kv in $extraEnv.GetEnumerator()) {
            $envArgs += "set $($kv.Key)=$($kv.Value) && "
        }
    }
    $fullCmd = ($envArgs -join "") + $cmd
    
    Start-Process -FilePath "cmd.exe" `
        -ArgumentList "/c", "$fullCmd > `"$logOut`" 2> `"$logErr`"" `
        -WorkingDirectory (Join-Path $Root $workDir) `
        -WindowStyle Hidden
}

Write-Host "Starting all realestatecrm services..." -ForegroundColor Green

# Port 3000 — Main CRM
Start-Service "main-crm" 3000 "node node_modules\next\dist\bin\next start -p 3000" "." @{}

# Port 3001 — LeadG
Start-Service "leadg" 3001 "node node_modules\next\dist\bin\next start -p 3001" "apps\leadg" @{}

# Port 3002 — Foreclosure Workflow (needs NEXTAUTH_SECRET)
Start-Service "foreclosure" 3002 "node start-3002.js" "apps\foreclosureworkflow" @{
    NODE_ENV = "production"
    PORT = "3002"
    NEXTAUTH_SECRET = "dev_secret_change_me"
    NEXTAUTH_URL = "http://localhost:3002"
}

# Port 3003 — ContentPlanner
Start-Service "contentplanner" 3003 "npx next start -p 3003" "apps\contentplanner\apps\web" @{}

# Port 3004 — Media Workflow
Start-Service "media-workflow" 3004 "node dist\index.js" "apps\media-workflow" @{ PORT = "3004" }

# Port 3005 — LegacyLeads Frontend
Start-Service "legacyleads-web" 3005 "npx next start -p 3005" "apps\legacyleads\frontend" @{
    NEXTAUTH_SECRET = "dev_secret_change_me"
    NEXTAUTH_URL = "http://localhost:3005"
}

# Port 3006 — LegacyLeads Backend
Start-Service "legacyleads-api" 3006 "npx tsx src/index.ts" "apps\legacyleads\backend" @{ PORT = "3006" }

# Port 8090 — Live Audio WebSocket
Start-Service "live-audio" 8090 "node scripts\live-audio-server.mjs" "." @{}

# Wait and verify
Write-Host ""
Write-Host "Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host "=== Service Status ===" -ForegroundColor Green
foreach ($port in @(3000,3001,3002,3003,3004,3005,3006,8090)) {
    $listening = netstat -ano | Select-String ":$port.*LISTENING"
    if ($listening) {
        Write-Host "  Port ${port}: RUNNING" -ForegroundColor Green
    } else {
        Write-Host "  Port ${port}: NOT RUNNING" -ForegroundColor Red
    }
}
