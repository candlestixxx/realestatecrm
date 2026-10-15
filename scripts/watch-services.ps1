# watch-services.ps1 -- health watchdog for realestatecrm services
# Probes all 9 service ports every 60s and restarts any that are down.
# Run: powershell -ExecutionPolicy Bypass -File scripts\watch-services.ps1
# Kill: Ctrl+C or kill the PowerShell process.

$services = @(
  @{ Name = 'Main CRM';        Port = 3000;  WorkDir = 'C:\Users\hyper\workspace\realestatecrm';                        Cmd = 'node node_modules\next\dist\bin\next start -p 3000' },
  @{ Name = 'Live Audio';      Port = 8090;  WorkDir = 'C:\Users\hyper\workspace\realestatecrm';                        Cmd = 'node scripts\live-audio-server.mjs' },
  @{ Name = 'LeadG';           Port = 3001;  WorkDir = 'C:\Users\hyper\workspace\realestatecrm\apps\leadg';              Cmd = 'node node_modules\next\dist\bin\next start -p 3001' },
  @{ Name = 'Foreclosure';     Port = 3002;  WorkDir = 'C:\Users\hyper\workspace\realestatecrm\apps\foreclosureworkflow'; Cmd = 'set NODE_ENV=production && set PORT=3002 && set NEXTAUTH_SECRET=dev_secret_change_me && set NEXTAUTH_URL=http://localhost:3002 && node start-3002.js' },
  @{ Name = 'CP Web';          Port = 3003;  WorkDir = 'C:\Users\hyper\workspace\realestatecrm\apps\contentplanner\apps\web'; Cmd = 'node ..\..\node_modules\next\dist\bin\next start -p 3003' },
  @{ Name = 'CP API';          Port = 3031;  WorkDir = 'C:\Users\hyper\workspace\realestatecrm\apps\contentplanner\packages\api'; Cmd = 'cmd /c start-api.bat' },
  @{ Name = 'Media Workflow';  Port = 3004;  WorkDir = 'C:\Users\hyper\workspace\realestatecrm\apps\media-workflow';      Cmd = 'set PORT=3004 && node dist\src\index.js' },
  @{ Name = 'LL Web';          Port = 3005;  WorkDir = 'C:\Users\hyper\workspace\realestatecrm\apps\legacyleads\frontend'; Cmd = 'set NEXTAUTH_SECRET=dev_secret_change_me && set NEXTAUTH_URL=http://localhost:3005 && node node_modules\next\dist\bin\next start -p 3005' },
  @{ Name = 'LL API';          Port = 3006;  WorkDir = 'C:\Users\hyper\workspace\realestatecrm\apps\legacyleads\backend';  Cmd = 'set PORT=3006 && npx tsx src/index.ts' }
)

function Test-Port([int]$port) {
  try {
    $c = New-Object System.Net.Sockets.TcpClient
    $c.Connect('127.0.0.1', $port)
    $c.Close()
    return $true
  } catch { return $false }
}

function Start-Service($svc) {
  Write-Host "  >> Restarting $($svc.Name) on port $($svc.Port)..."
  Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', $svc.Cmd -WorkingDirectory $svc.WorkDir -WindowStyle Minimized
}

Write-Host "=== Service Watchdog started at $(Get-Date -Format 'HH:mm:ss') ==="
Write-Host "Checking every 60 seconds. Ctrl+C to stop.`n"

while ($true) {
  $down = @()
  foreach ($svc in $services) {
    if (-not (Test-Port $svc.Port)) {
      $down += $svc
    }
  }

  if ($down.Count -eq 0) {
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] All 9 services healthy."
  } else {
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $($down.Count) service(s) DOWN:"
    foreach ($svc in $down) {
      Write-Host "  - $($svc.Name) (port $($svc.Port)) is DOWN"
      Start-Service $svc
    }
    Write-Host "  Waiting 20s for startup..."
    Start-Sleep -Seconds 20
    foreach ($svc in $down) {
      $up = Test-Port $svc.Port
      $status = if ($up) { 'UP' } else { 'STILL DOWN' }
      Write-Host "  - $($svc.Name): $status"
    }
  }

  Start-Sleep -Seconds 60
}
