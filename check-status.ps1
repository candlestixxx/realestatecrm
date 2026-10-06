# check-status.ps1 — Quick health check for all realestatecrm services
#
# Usage: powershell -ExecutionPolicy Bypass -File check-status.ps1

$services = @(
    @{ Name = "Main CRM"; Port = 3000; Path = "/" },
    @{ Name = "LeadG"; Port = 3001; Path = "/" },
    @{ Name = "Foreclosure"; Port = 3002; Path = "/" },
    @{ Name = "ContentPlanner"; Port = 3003; Path = "/" },
    @{ Name = "Media Workflow"; Port = 3004; Path = "/" },
    @{ Name = "LegacyLeads Web"; Port = 3005; Path = "/" },
    @{ Name = "LegacyLeads API"; Port = 3006; Path = "/health" },
    @{ Name = "Live Audio WS"; Port = 8090; Path = "/health" }
)

Write-Host "=== realestatecrm Service Status ===" -ForegroundColor Cyan
Write-Host ""

foreach ($svc in $services) {
    $listening = netstat -ano | Select-String ":$($svc.Port).*LISTENING"
    if (-not $listening) {
        Write-Host ("  {0,-20} Port {1,-5} DOWN" -f $svc.Name, $svc.Port) -ForegroundColor Red
        continue
    }
    
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:$($svc.Port)$($svc.Path)" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
        Write-Host ("  {0,-20} Port {1,-5} HTTP {2}" -f $svc.Name, $svc.Port, $r.StatusCode) -ForegroundColor Green
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        if ($code) {
            Write-Host ("  {0,-20} Port {1,-5} HTTP {2}" -f $svc.Name, $svc.Port, $code) -ForegroundColor Yellow
        } else {
            Write-Host ("  {0,-20} Port {1,-5} ERROR" -f $svc.Name, $svc.Port) -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "Logs: logs/ directory at project root" -ForegroundColor Gray
Write-Host "Tray:  npm run tray (Start/Stop/Restart/Quit)" -ForegroundColor Gray
