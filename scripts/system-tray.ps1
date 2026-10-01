# system-tray.ps1 — Windows system tray controller for realestatecrm
#
# Why: the project had no way to see or control the running server from the
# desktop. This tray icon provides start/stop/restart/open/quit without a
# terminal. It is intentionally zero-dependency (pure PowerShell + .NET
# WinForms) so it works on any Windows box with PowerShell 5.1+.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts\system-tray.ps1
#
# Tray menu:
#   • Open Dashboard      — launches http://localhost:3000 in default browser
#   • Start Server        — boots `next start -p 3000` if not already running
#   • Stop Server         — surgical: kills only the PID listening on :3000
#   • Restart Server      — stop then start
#   • View Logs           — opens server.log in the default text editor
#   • Exit Tray           — removes the tray icon (server keeps running)
#   • Quit Servers & Exit — stops the server AND removes the tray icon
#
# The icon color reflects state: green = healthy, yellow = starting,
# red = stopped/unhealthy.

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Drawing.SystemIcons

$Port = 3000
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$LogFile = Join-Path $Root 'server.log'
$ErrFile = Join-Path $Root 'server-err.log'

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

function Get-ServerPid {
    $lines = netstat -ano | Select-String ":$Port\s.*LISTENING"
    if ($lines) {
        $pid = ($lines[0].ToString() -split '\s+')[-1]
        return [int]$pid
    }
    return $null
}

function Test-ServerHealthy {
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/auth/signin" -UseBasicParsing -TimeoutSec 3
        return $r.StatusCode -eq 200
    } catch {
        return $false
    }
}

function Update-Icon {
    param([string]$State)
    $bmp = New-Object System.Drawing.Bitmap(16, 16)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = 'AntiAlias'
    $color = switch ($State) {
        'running'  { [System.Drawing.Color]::FromArgb(255, 34, 197, 94) }   # green
        'starting' { [System.Drawing.Color]::FromArgb(255, 234, 179, 8) }   # yellow
        default    { [System.Drawing.Color]::FromArgb(255, 239, 68, 68) }   # red
    }
    $g.FillEllipse((New-Object System.Drawing.SolidBrush($color)), 1, 1, 14, 14)
    $g.Dispose()
    $icon = [System.Drawing.Icon]::FromHandle($bmp.GetHicon())
    $tray.Icon = $icon
    $tray.Text = "realestatecrm — $State (:$Port)"
}

function Start-Server {
    Update-Icon 'starting'
    $tray.ShowBalloonTip(2000, 'realestatecrm', 'Starting server on port ' + $Port, [System.Windows.Forms.ToolTipIcon]::Info)
    Start-Process -FilePath 'cmd.exe' `
        -ArgumentList "/c","node node_modules\next\dist\bin\next start -p $Port > server.log 2> server-err.log" `
        -WorkingDirectory $Root -WindowStyle Hidden
    # Poll for up to 15s
    for ($i = 0; $i -lt 15; $i++) {
        Start-Sleep -Seconds 1
        if (Test-ServerHealthy) { break }
    }
    if (Test-ServerHealthy) {
        Update-Icon 'running'
        $tray.ShowBalloonTip(2000, 'realestatecrm', 'Server is running', [System.Windows.Forms.ToolTipIcon]::Info)
    } else {
        Update-Icon 'stopped'
        $tray.ShowBalloonTip(3000, 'realestatecrm', 'Server failed to start — check server-err.log', [System.Windows.Forms.ToolTipIcon]::Error)
    }
}

function Stop-Server {
    $pid = Get-ServerPid
    if ($pid) {
        # Surgical kill: only the PID bound to our port. Never taskkill /IM node.exe.
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        $tray.ShowBalloonTip(2000, 'realestatecrm', "Stopped server (PID $pid)", [System.Windows.Forms.ToolTipIcon]::Info)
    } else {
        $tray.ShowBalloonTip(2000, 'realestatecrm', 'No server running on port ' + $Port, [System.Windows.Forms.ToolTipIcon]::Warning)
    }
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
$miOpen.Add_Click({ Start-Process "http://localhost:$Port" })

$miStart = $menu.Items.Add('Start Server')
$miStart.Add_Click({ Start-Server })

$miStop = $menu.Items.Add('Stop Server')
$miStop.Add_Click({ Stop-Server })

$miRestart = $menu.Items.Add('Restart Server')
$miRestart.Add_Click({
    Stop-Server
    Start-Sleep -Seconds 2
    Start-Server
})

$menu.Items.Add((New-Object System.Windows.Forms.ToolStripSeparator))

$miLogs = $menu.Items.Add('View Logs')
$miLogs.Add_Click({ notepad $LogFile })

$miErrLogs = $menu.Items.Add('View Error Logs')
$miErrLogs.Add_Click({ notepad $ErrFile })

$menu.Items.Add((New-Object System.Windows.Forms.ToolStripSeparator))

$miExit = $menu.Items.Add('Exit Tray (keep server)')
$miExit.Add_Click({
    $tray.Visible = $false
    $tray.Dispose()
    [System.Windows.Forms.Application]::Exit()
})

$miQuit = $menu.Items.Add('Quit Servers && Exit')
$miQuit.Add_Click({
    Stop-Server
    $tray.Visible = $false
    $tray.Dispose()
    [System.Windows.Forms.Application]::Exit()
})

$tray.ContextMenuStrip = $menu

# Double-click opens the dashboard
$tray.Add_DoubleClick({ Start-Process "http://localhost:$Port" })

# ---------------------------------------------------------------------------
# Health poller — updates icon every 10 seconds
# ---------------------------------------------------------------------------

$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 10000
$timer.Add_Tick({
    if (Test-ServerHealthy) { Update-Icon 'running' }
    else {
        $pid = Get-ServerPid
        if ($pid) { Update-Icon 'starting' } else { Update-Icon 'stopped' }
    }
})
$timer.Start()

# Initial state
if (Test-ServerHealthy) { Update-Icon 'running' }
else {
    $pid = Get-ServerPid
    if ($pid) { Update-Icon 'starting' } else { Update-Icon 'stopped' }
}

# Show initial balloon
$tray.ShowBalloonTip(3000, 'realestatecrm', 'Tray icon active. Right-click for controls.', [System.Windows.Forms.ToolTipIcon]::Info)

# Message loop — keeps the tray alive
[System.Windows.Forms.Application]::Run()
