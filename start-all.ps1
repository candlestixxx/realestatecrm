# start-all.ps1 -- Start all 12 realestatecrm services with correct ports, logs, and BelowNormal priority
#
# Why: each service needs specific PORT env vars and some need NEXTAUTH_SECRET.
# Canonical service definitions stay aligned across start-all.ps1, start-all.bat,
# scripts/watch-services.ps1, and scripts/system-tray.ps1.
#
# Usage: powershell -ExecutionPolicy Bypass -File start-all.ps1

$Root = $PSScriptRoot

function Start-PlatformService($name, $port, $cmd, $workDir, $logFile = "server.log", $errFile = "server-err.log") {
    $listening = netstat -ano | Select-String ":$port\s.*LISTENING"
    if ($listening) {
        Write-Host "  $name (port ${port}): already running" -ForegroundColor Yellow
        return
    }

    $fullWorkDir = Join-Path $Root $workDir
    $logPath = Join-Path $fullWorkDir $logFile
    $errPath = Join-Path $fullWorkDir $errFile

    Write-Host "  $name (port ${port}): starting [BelowNormal]..." -ForegroundColor Cyan
    $proc = Start-Process -FilePath "cmd.exe" `
        -ArgumentList "/c", "$cmd > `"$logPath`" 2> `"$errPath`"" `
        -WorkingDirectory $fullWorkDir `
        -WindowStyle Hidden `
        -PassThru
    try {
        if ($proc -and -not $proc.HasExited) {
            $proc.PriorityClass = 'BelowNormal'
        }
    } catch { }
}

Write-Host "Starting all 12 realestatecrm services..." -ForegroundColor Green

# Port 3000 -- Main CRM
Start-PlatformService "main-crm" 3000 "node node_modules\next\dist\bin\next start -p 3000" "."

# Port 8090 -- Live Audio WebSocket
Start-PlatformService "live-audio" 8090 "node scripts\live-audio-server.mjs" "." "live-audio.log" "live-audio-err.log"

# Port 3001 -- LeadG (standalone Next.js server)
Start-PlatformService "leadg" 3001 "set PORT=3001 && set NEXTAUTH_SECRET=dev_secret_change_me && set NEXTAUTH_URL=http://localhost:3001 && node .next\standalone\server.js" "apps\leadg"

# Port 3002 -- Foreclosure Workflow
Start-PlatformService "foreclosure" 3002 "set NODE_ENV=production && set PORT=3002 && set NEXTAUTH_SECRET=dev_secret_change_me && set NEXTAUTH_URL=http://localhost:3002 && node start-3002.js" "apps\foreclosureworkflow" "server.out.log" "server.err5.log"

# Port 3003 -- ContentPlanner Web
Start-PlatformService "contentplanner" 3003 "node ..\..\node_modules\next\dist\bin\next start -p 3003" "apps\contentplanner\apps\web"

# Port 3031 -- ContentPlanner API
Start-PlatformService "contentplanner-api" 3031 "cmd /c start-api.bat" "apps\contentplanner\packages\api"

# Port 3004 -- Media Workflow API
Start-PlatformService "media-workflow" 3004 "set PORT=3004 && node dist\src\index.js" "apps\media-workflow"

# Port 3005 -- LegacyLeads Frontend
Start-PlatformService "legacyleads" 3005 "set NEXTAUTH_SECRET=dev_secret_change_me && set NEXTAUTH_URL=http://localhost:3005 && node node_modules\next\dist\bin\next start -p 3005" "apps\legacyleads\frontend"

# Port 3006 -- LegacyLeads API
Start-PlatformService "legacyleads-api" 3006 "set PORT=3006 && npx tsx src/index.ts" "apps\legacyleads\backend"

# Port 3007 -- AI CRM
Start-PlatformService "aicrm" 3007 "node node_modules\next\dist\bin\next start -p 3007" "apps\aicrm"

# Port 3008 -- Lead Caller
Start-PlatformService "leadcaller" 3008 "node node_modules\next\dist\bin\next start -p 3008" "apps\leadcaller"

# Port 3009 -- Prototype API
Start-PlatformService "prototype" 3009 "set PORT=3009 && node dist\index.js" "apps\prototype\server"

Write-Host ""
Write-Host "Waiting 15s for services to bind..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host "=== Service Status ===" -ForegroundColor Green
$snapshot = netstat -ano
foreach ($port in @(3000,3001,3002,3003,3031,3004,3005,3006,3007,3008,3009,8090)) {
    $listening = $snapshot | Select-String ":$port\s.*LISTENING"
    if ($listening) {
        Write-Host ("  Port {0,-5}: RUNNING" -f $port) -ForegroundColor Green
    } else {
        Write-Host ("  Port {0,-5}: NOT RUNNING" -f $port) -ForegroundColor Red
    }
}
