# system-tray.ps1 -- Windows system tray controller for realestatecrm
#
# Why: the project had no desktop way to see or control the running services.
# This tray icon starts/stops/restarts each component and can quit the servers
# without a terminal. Zero dependencies (pure PowerShell + .NET WinForms).
#
# ASCII ONLY in this file. A previous version used an em-dash (U+2014) which
# got mangled to a control character on write, terminating a double-quoted
# string early and cascading into parse errors across the rest of the script.
# Do not reintroduce non-ASCII punctuation here.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts\system-tray.ps1
#
# Menu:
#   Open Dashboard
#   --- services (each: Start / Stop / Restart) ---
#   View Logs / View Error Logs
#   --- ---
#   Start All / Stop All
#   Exit Tray (keep servers running)
#   Quit All Servers and Exit
#
# Icon color reflects aggregate state: green = all healthy, yellow = partial
# or starting, red = all stopped.

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

# ---------------------------------------------------------------------------
# Service registry
#
# Key        = menu label
# Port       = TCP port used for health probing and surgical PID lookup.
#              $null means "no fixed port" (health check is process-only).
# Cmd        = command line used to launch the service.
# WorkDir    = directory to launch from.
# HealthPath = HTTP path probed on 127.0.0.1:$Port to confirm readiness.
#              $null means "process alive is enough".
# ---------------------------------------------------------------------------
$Services = [ordered]@{
    'main-crm' = @{
        Label = 'Main CRM (Next.js)'
        Port = 3000
        Cmd = 'node node_modules\next\dist\bin\next start -p 3000'
        WorkDir = $Root
        HealthPath = '/auth/signin'
        Log = 'server.log'
        ErrLog = 'server-err.log'
    }
    'live-audio' = @{
        Label = 'Live Audio (WebSocket)'
        Port = 8090
        Cmd = 'node scripts\live-audio-server.mjs'
        WorkDir = $Root
        HealthPath = $null
        Log = 'live-audio.log'
        ErrLog = 'live-audio-err.log'
    }
    'leadg' = @{
        Label = 'LeadG'
        Port = 3001
        Cmd = 'node node_modules\next\dist\bin\next start -p 3001'
        WorkDir = (Join-Path $Root 'apps\leadg')
        HealthPath = '/auth/signin'
        Log = 'server.log'
        ErrLog = 'server-err.log'
    }
    'foreclosure' = @{
        Label = 'Foreclosure Workflow'
        Port = 3002
        Cmd = 'node server.js'
        WorkDir = (Join-Path $Root 'apps\foreclosureworkflow')
        HealthPath = '/login'
        Log = 'server.log'
        ErrLog = 'server-err.log'
    }
    'contentplanner' = @{
        Label = 'Content Planner (web)'
        Port = 3003
        Cmd = 'node node_modules\next\dist\bin\next start -p 3003'
        WorkDir = (Join-Path $Root 'apps\contentplanner\apps\web')
        HealthPath = '/'
        Log = 'server.log'
        ErrLog = 'server-err.log'
    }
    'media-workflow' = @{
        Label = 'Media Workflow API'
        Port = 3004
        Cmd = 'node dist\src\index.js'
        WorkDir = (Join-Path $Root 'apps\media-workflow')
        HealthPath = $null
        Log = 'server.log'
        ErrLog = 'server-err.log'
    }
    'legacyleads' = @{
        Label = 'Legacy Leads (frontend)'
        Port = 3005
        Cmd = 'set NEXTAUTH_SECRET=dev_secret_change_me && set NEXTAUTH_URL=http://localhost:3005 && node node_modules\next\dist\bin\next start -p 3005'
        WorkDir = (Join-Path $Root 'apps\legacyleads\frontend')
        HealthPath = '/'
        Log = 'server.log'
        ErrLog = 'server-err.log'
    }
    'legacyleads-api' = @{
        Label = 'Legacy Leads (API)'
        Port = 3006
        Cmd = 'set PORT=3006 && npx tsx src/index.ts'
        WorkDir = (Join-Path $Root 'apps\legacyleads\backend')
        HealthPath = '/health'
        Log = 'server.log'
        ErrLog = 'server-err.log'
    }
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

function Get-PortPid {
    param([int]$Port)
    if (-not $Port) { return $null }
    $lines = netstat -ano | Select-String ":$Port\s.*LISTENING"
    if ($lines) {
        $parts = ($lines[0].ToString() -split '\s+') | Where-Object { $_ -ne '' }
        return [int]$parts[-1]
    }
    return $null
}

function Test-ServiceHealthy {
    param([hashtable]$Svc)
    if (-not $Svc.Port) { return [bool](Get-PortPid -Port 0) }
    if ($Svc.HealthPath) {
        try {
            $r = Invoke-WebRequest -Uri ("http://127.0.0.1:{0}{1}" -f $Svc.Port, $Svc.HealthPath) `
                -UseBasicParsing -TimeoutSec 3
            return ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500)
        } catch {
            # 401/405 still prove the HTTP server is up.
            if ($_.Exception.Response -and [int]$_.Exception.Response.StatusCode -ge 200) {
                return $true
            }
            return [bool](Get-PortPid -Port $Svc.Port)
        }
    }
    return [bool](Get-PortPid -Port $Svc.Port)
}

function Get-AggregateState {
    $up = 0
    foreach ($k in $Services.Keys) {
        if (Test-ServiceHealthy -Svc $Services[$k]) { $up++ }
    }
    if ($up -eq 0) { return 'stopped' }
    if ($up -eq $Services.Count) { return 'running' }
    return 'partial'
}

# -- icon drawing (pure ASCII source) --------------------------------------

function Update-Icon {
    param([string]$State)
    $bmp = New-Object System.Drawing.Bitmap(16, 16)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = 'AntiAlias'
    $color = switch ($State) {
        'running'  { [System.Drawing.Color]::FromArgb(255, 34, 197, 94) }
        'partial'  { [System.Drawing.Color]::FromArgb(255, 234, 179, 8) }
        'starting' { [System.Drawing.Color]::FromArgb(255, 234, 179, 8) }
        default    { [System.Drawing.Color]::FromArgb(255, 239, 68, 68) }
    }
    $g.FillEllipse((New-Object System.Drawing.SolidBrush($color)), 1, 1, 14, 14)
    $g.Dispose()
    $icon = [System.Drawing.Icon]::FromHandle($bmp.GetHicon())
    if ($tray.Icon) { $old = $tray.Icon }
    $tray.Icon = $icon
    if ($old) { $old.Dispose() }

    $up = 0
    foreach ($k in $Services.Keys) { if (Test-ServiceHealthy -Svc $Services[$k]) { $up++ } }
    $tray.Text = ("realestatecrm [{0}] {1}/{2} services" -f $State, $up, $Services.Count)
}

# -- service control -------------------------------------------------------

function Start-Service {
    param([string]$Key)
    $svc = $Services[$Key]
    if (Test-ServiceHealthy -Svc $svc) {
        $tray.ShowBalloonTip(1500, 'realestatecrm', ($svc.Label + ' already running'), [System.Windows.Forms.ToolTipIcon]::Info)
        return
    }
    $logPath = Join-Path $svc.WorkDir $svc.Log
    $errPath = Join-Path $svc.WorkDir $svc.ErrLog
    # Redirect via cmd.exe so output survives the launcher exiting.
    Start-Process -FilePath 'cmd.exe' `
        -ArgumentList ('/c', ($svc.Cmd + ' > "' + $logPath + '" 2> "' + $errPath + '"')) `
        -WorkingDirectory $svc.WorkDir -WindowStyle Hidden

    $deadline = 20
    for ($i = 0; $i -lt $deadline; $i++) {
        Start-Sleep -Seconds 1
        if (Test-ServiceHealthy -Svc $svc) { break }
    }
    if (Test-ServiceHealthy -Svc $svc) {
        $tray.ShowBalloonTip(2000, 'realestatecrm', ($svc.Label + ' is running'), [System.Windows.Forms.ToolTipIcon]::Info)
    } else {
        $tray.ShowBalloonTip(3000, 'realestatecrm', ($svc.Label + ' failed to start -- check ' + $svc.ErrLog), [System.Windows.Forms.ToolTipIcon]::Error)
    }
    Update-Icon (Get-AggregateState)
}

function Stop-Service {
    param([string]$Key)
    $svc = $Services[$Key]
    $procPid = $null
    if ($svc.Port) { $procPid = Get-PortPid -Port $svc.Port }
    if ($procPid) {
        # Surgical: only the PID bound to this service's port. Never kill by image name.
        Stop-Process -Id $procPid -Force -ErrorAction SilentlyContinue
        $tray.ShowBalloonTip(1500, 'realestatecrm', ($svc.Label + ' stopped (PID ' + $procPid + ')'), [System.Windows.Forms.ToolTipIcon]::Info)
    } else {
        $tray.ShowBalloonTip(1500, 'realestatecrm', ($svc.Label + ' was not running'), [System.Windows.Forms.ToolTipIcon]::Warning)
    }
    Update-Icon (Get-AggregateState)
}

function Start-AllServices {
    foreach ($k in $Services.Keys) { Start-Service -Key $k }
}

function Stop-AllServices {
    foreach ($k in $Services.Keys) { Stop-Service -Key $k }
    Update-Icon 'stopped'
}

# ---------------------------------------------------------------------------
# Tray icon
# ---------------------------------------------------------------------------

$tray = New-Object System.Windows.Forms.NotifyIcon
$tray.Icon = [System.Drawing.SystemIcons]::Application
$tray.Visible = $true

$menu = New-Object System.Windows.Forms.ContextMenuStrip

$miOpen = $menu.Items.Add('Open Dashboard')
$miOpen.Add_Click({ Start-Process 'http://localhost:3000' })

$menu.Items.Add((New-Object System.Windows.Forms.ToolStripSeparator))

# One submenu per service: Start / Stop / Restart
foreach ($k in $Services.Keys) {
    $svc = $Services[$k]
    $sub = New-Object System.Windows.Forms.ToolStripMenuItem($svc.Label)

    $s1 = $sub.DropDownItems.Add('Start')
    $key1 = $k
    $s1.Add_Click({ Start-Service -Key $key1 }.GetNewClosure())

    $s2 = $sub.DropDownItems.Add('Stop')
    $key2 = $k
    $s2.Add_Click({ Stop-Service -Key $key2 }.GetNewClosure())

    $s3 = $sub.DropDownItems.Add('Restart')
    $key3 = $k
    $s3.Add_Click({
        Stop-Service -Key $key3
        Start-Sleep -Seconds 2
        Start-Service -Key $key3
    }.GetNewClosure())

    $sub.DropDownItems.Add((New-Object System.Windows.Forms.ToolStripSeparator))

    $s4 = $sub.DropDownItems.Add('View Logs')
    $logPath = Join-Path $svc.WorkDir $svc.Log
    $s4.Add_Click({ if (Test-Path $logPath) { notepad $logPath } else { [System.Windows.Forms.MessageBox]::Show('No log yet: ' + $logPath) } }.GetNewClosure())

    $s5 = $sub.DropDownItems.Add('View Error Logs')
    $errPath = Join-Path $svc.WorkDir $svc.ErrLog
    $s5.Add_Click({ if (Test-Path $errPath) { notepad $errPath } else { [System.Windows.Forms.MessageBox]::Show('No error log yet: ' + $errPath) } }.GetNewClosure())

    [void]$menu.Items.Add($sub)
}

$menu.Items.Add((New-Object System.Windows.Forms.ToolStripSeparator))

$miStartAll = $menu.Items.Add('Start All Services')
$miStartAll.Add_Click({ Start-AllServices })

$miStopAll = $menu.Items.Add('Stop All Services')
$miStopAll.Add_Click({ Stop-AllServices })

$menu.Items.Add((New-Object System.Windows.Forms.ToolStripSeparator))

$miExit = $menu.Items.Add('Exit Tray (keep servers running)')
$miExit.Add_Click({
    $tray.Visible = $false
    $tray.Dispose()
    [System.Windows.Forms.Application]::Exit()
})

$miQuit = $menu.Items.Add('Quit All Servers and Exit')
$miQuit.Add_Click({
    Stop-AllServices
    $tray.Visible = $false
    $tray.Dispose()
    [System.Windows.Forms.Application]::Exit()
})

$tray.ContextMenuStrip = $menu
$tray.Add_DoubleClick({ Start-Process 'http://localhost:3000' })

# ---------------------------------------------------------------------------
# Health poller
# ---------------------------------------------------------------------------

$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 10000
$timer.Add_Tick({ Update-Icon (Get-AggregateState) })
$timer.Start()

Update-Icon (Get-AggregateState)
$tray.ShowBalloonTip(3000, 'realestatecrm', 'Tray active. Right-click for per-service controls.', [System.Windows.Forms.ToolTipIcon]::Info)

[System.Windows.Forms.Application]::Run()
