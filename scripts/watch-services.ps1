# watch-services.ps1 -- health watchdog for all 12 realestatecrm services
# Probes all 12 service ports every 60s and restarts any that are down at BelowNormal priority.
# Run: powershell -ExecutionPolicy Bypass -File scripts\watch-services.ps1
# Kill: Ctrl+C or stop the PowerShell process.

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

$services = @(
  @{ Name = 'Main CRM';       Port = 3000; WorkDir = $Root;                                               Cmd = 'node node_modules\next\dist\bin\next start -p 3000'; Log = 'server.log'; ErrLog = 'server-err.log' },
  @{ Name = 'Live Audio';     Port = 8090; WorkDir = $Root;                                               Cmd = 'node scripts\live-audio-server.mjs'; Log = 'live-audio.log'; ErrLog = 'live-audio-err.log' },
  @{ Name = 'LeadG';          Port = 3001; WorkDir = (Join-Path $Root 'apps\leadg');                      Cmd = 'set PORT=3001 && set NEXTAUTH_SECRET=dev_secret_change_me && set NEXTAUTH_URL=http://localhost:3001 && node .next\standalone\server.js'; Log = 'server.log'; ErrLog = 'server-err.log' },
  @{ Name = 'Foreclosure';    Port = 3002; WorkDir = (Join-Path $Root 'apps\foreclosureworkflow');        Cmd = 'set NODE_ENV=production && set PORT=3002 && set NEXTAUTH_SECRET=dev_secret_change_me && set NEXTAUTH_URL=http://localhost:3002 && node start-3002.js'; Log = 'server.out.log'; ErrLog = 'server.err5.log' },
  @{ Name = 'CP Web';         Port = 3003; WorkDir = (Join-Path $Root 'apps\contentplanner\apps\web');    Cmd = 'node ..\..\node_modules\next\dist\bin\next start -p 3003'; Log = 'server.log'; ErrLog = 'server-err.log' },
  @{ Name = 'CP API';         Port = 3031; WorkDir = (Join-Path $Root 'apps\contentplanner\packages\api'); Cmd = 'cmd /c start-api.bat'; Log = 'server.log'; ErrLog = 'server-err.log' },
  @{ Name = 'Media Workflow'; Port = 3004; WorkDir = (Join-Path $Root 'apps\media-workflow');             Cmd = 'set PORT=3004 && node dist\src\index.js'; Log = 'server.log'; ErrLog = 'server-err.log' },
  @{ Name = 'LL Web';         Port = 3005; WorkDir = (Join-Path $Root 'apps\legacyleads\frontend');       Cmd = 'set NEXTAUTH_SECRET=dev_secret_change_me && set NEXTAUTH_URL=http://localhost:3005 && node node_modules\next\dist\bin\next start -p 3005'; Log = 'server.log'; ErrLog = 'server-err.log' },
  @{ Name = 'LL API';         Port = 3006; WorkDir = (Join-Path $Root 'apps\legacyleads\backend');        Cmd = 'set PORT=3006 && npx tsx src/index.ts'; Log = 'server.log'; ErrLog = 'server-err.log' },
  @{ Name = 'AI CRM';         Port = 3007; WorkDir = (Join-Path $Root 'apps\aicrm');                      Cmd = 'node node_modules\next\dist\bin\next start -p 3007'; Log = 'server.log'; ErrLog = 'server-err.log' },
  @{ Name = 'Lead Caller';    Port = 3008; WorkDir = (Join-Path $Root 'apps\leadcaller');                 Cmd = 'node node_modules\next\dist\bin\next start -p 3008'; Log = 'server.log'; ErrLog = 'server-err.log' },
  @{ Name = 'Prototype API';  Port = 3009; WorkDir = (Join-Path $Root 'apps\prototype\server');           Cmd = 'set PORT=3009 && node dist\index.js'; Log = 'server.log'; ErrLog = 'server-err.log' }
)

function Test-Port([int]$port) {
  try {
    $c = New-Object System.Net.Sockets.TcpClient
    $iar = $c.BeginConnect('127.0.0.1', $port, $null, $null)
    $ok = $iar.AsyncWaitHandle.WaitOne(400, $false)
    if ($ok -and $c.Connected) {
      $c.EndConnect($iar)
      $c.Close()
      return $true
    }
    $c.Close()
    return $false
  } catch { return $false }
}

function Start-WatchedService($svc) {
  $logPath = Join-Path $svc.WorkDir $svc.Log
  $errPath = Join-Path $svc.WorkDir $svc.ErrLog
  Write-Host "  >> Restarting $($svc.Name) on port $($svc.Port) [BelowNormal]..."
  $proc = Start-Process -FilePath 'cmd.exe' `
    -ArgumentList '/c', ($svc.Cmd + ' > "' + $logPath + '" 2> "' + $errPath + '"') `
    -WorkingDirectory $svc.WorkDir `
    -WindowStyle Hidden `
    -PassThru
  try {
    if ($proc -and -not $proc.HasExited) {
      $proc.PriorityClass = 'BelowNormal'
    }
  } catch { }
}

Write-Host "=== Service Watchdog (12 services) started at $(Get-Date -Format 'HH:mm:ss') ==="
Write-Host "Checking every 60 seconds. Ctrl+C to stop.`n"

while ($true) {
  $down = @()
  foreach ($svc in $services) {
    if (-not (Test-Port $svc.Port)) {
      $down += $svc
    }
  }

  if ($down.Count -eq 0) {
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] All $($services.Count) services healthy."
  } else {
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $($down.Count) service(s) DOWN:"
    foreach ($svc in $down) {
      Write-Host "  - $($svc.Name) (port $($svc.Port)) is DOWN"
      Start-WatchedService $svc
    }
    Write-Host "  Waiting 15s for startup..."
    Start-Sleep -Seconds 15
    foreach ($svc in $down) {
      $up = Test-Port $svc.Port
      $status = if ($up) { 'UP' } else { 'STILL DOWN' }
      Write-Host "  - $($svc.Name): $status"
    }
  }

  Start-Sleep -Seconds 60
}
