# system-tray.ps1 -- Windows system tray controller for realestatecrm
#
# Why: desktop control over all 12 platform services without a terminal.
# Starts/stops/restarts each component at BelowNormal CPU priority, shows
# per-service live status, opens logs, and can surgically quit all servers
# by bound TCP port PID. Zero external dependencies (PowerShell + WinForms).
#
# ASCII ONLY in this file (avoids Windows PowerShell 5.1 encoding traps).
#
# Usage:
#   npm run tray
#   powershell -ExecutionPolicy Bypass -File scripts\system-tray.ps1

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public static class TrayNative {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool DestroyIcon(IntPtr hIcon);
}
"@

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

# ---------------------------------------------------------------------------
# Service registry (12 services: Main CRM + Live Audio + 8 submodules)
# ---------------------------------------------------------------------------
$Services = [ordered]@{
    'main-crm' = @{
        Label = 'Main CRM (Next.js :3000)'
        Port = 3000
        Cmd = 'node node_modules\next\dist\bin\next start -p 3000'
        WorkDir = $Root
        HealthPath = '/auth/signin'
        Log = 'server.log'
        ErrLog = 'server-err.log'
    }
    'live-audio' = @{
        Label = 'Live Audio WS (:8090)'
        Port = 8090
        Cmd = 'node scripts\live-audio-server.mjs'
        WorkDir = $Root
        HealthPath = '/health'
        Log = 'live-audio.log'
        ErrLog = 'live-audio-err.log'
    }
    'leadg' = @{
        Label = 'LeadG (:3001)'
        Port = 3001
        Cmd = 'set PORT=3001 && set NEXTAUTH_SECRET=dev_secret_change_me && set NEXTAUTH_URL=http://localhost:3001 && node .next\standalone\server.js'
        WorkDir = (Join-Path $Root 'apps\leadg')
        HealthPath = '/auth/signin'
        Log = 'server.log'
        ErrLog = 'server-err.log'
    }
    'foreclosure' = @{
        Label = 'Foreclosure Workflow (:3002)'
        Port = 3002
        Cmd = 'set NODE_ENV=production && set PORT=3002 && set NEXTAUTH_SECRET=dev_secret_change_me && set NEXTAUTH_URL=http://localhost:3002 && node start-3002.js'
        WorkDir = (Join-Path $Root 'apps\foreclosureworkflow')
        HealthPath = '/login'
        Log = 'server.out.log'
        ErrLog = 'server.err5.log'
    }
    'contentplanner' = @{
        Label = 'Content Planner Web (:3003)'
        Port = 3003
        Cmd = 'node ..\..\node_modules\next\dist\bin\next start -p 3003'
        WorkDir = (Join-Path $Root 'apps\contentplanner\apps\web')
        HealthPath = '/'
        Log = 'server.log'
        ErrLog = 'server-err.log'
    }
    'contentplanner-api' = @{
        Label = 'Content Planner API (:3031)'
        Port = 3031
        Cmd = 'cmd /c start-api.bat'
        WorkDir = (Join-Path $Root 'apps\contentplanner\packages\api')
        HealthPath = '/health'
        Log = 'server.log'
        ErrLog = 'server-err.log'
    }
    'media-workflow' = @{
        Label = 'Media Workflow (:3004)'
        Port = 3004
        Cmd = 'set PORT=3004 && node dist\src\index.js'
        WorkDir = (Join-Path $Root 'apps\media-workflow')
        HealthPath = '/'
        Log = 'server.log'
        ErrLog = 'server-err.log'
    }
    'legacyleads' = @{
        Label = 'Legacy Leads Web (:3005)'
        Port = 3005
        Cmd = 'set NEXTAUTH_SECRET=dev_secret_change_me && set NEXTAUTH_URL=http://localhost:3005 && node node_modules\next\dist\bin\next start -p 3005'
        WorkDir = (Join-Path $Root 'apps\legacyleads\frontend')
        HealthPath = '/'
        Log = 'server.log'
        ErrLog = 'server-err.log'
    }
    'legacyleads-api' = @{
        Label = 'Legacy Leads API (:3006)'
        Port = 3006
        Cmd = 'set PORT=3006 && npx tsx src/index.ts'
        WorkDir = (Join-Path $Root 'apps\legacyleads\backend')
        HealthPath = '/health'
        Log = 'server.log'
        ErrLog = 'server-err.log'
    }
    'aicrm' = @{
        Label = 'AI CRM (:3007)'
        Port = 3007
        Cmd = 'node node_modules\next\dist\bin\next start -p 3007'
        WorkDir = (Join-Path $Root 'apps\aicrm')
        HealthPath = '/'
        Log = 'server.log'
        ErrLog = 'server-err.log'
    }
    'leadcaller' = @{
        Label = 'Lead Caller (:3008)'
        Port = 3008
        Cmd = 'node node_modules\next\dist\bin\next start -p 3008'
        WorkDir = (Join-Path $Root 'apps\leadcaller')
        HealthPath = '/'
        Log = 'server.log'
        ErrLog = 'server-err.log'
    }
    'prototype' = @{
        Label = 'Prototype API (:3009)'
        Port = 3009
        Cmd = 'set PORT=3009 && node dist\index.js'
        WorkDir = (Join-Path $Root 'apps\prototype\server')
        HealthPath = '/api/health'
        Log = 'server.log'
        ErrLog = 'server-err.log'
    }
}

$ServiceMenuItems = @{}

# ---------------------------------------------------------------------------
# Fast non-blocking port & PID helpers (single netstat pass per poll tick)
# ---------------------------------------------------------------------------

function Get-ListeningPortMap {
    $map = @{}
    $lines = netstat -ano | Select-String 'LISTENING'
    foreach ($line in $lines) {
        $parts = ($line.ToString() -split '\s+') | Where-Object { $_ -ne '' }
        if ($parts.Count -ge 5) {
            $localAddr = $parts[1]
            $colonIdx = $localAddr.LastIndexOf(':')
            if ($colonIdx -ge 0) {
                $portStr = $localAddr.Substring($colonIdx + 1)
                $portNum = 0
                $pidNum = 0
                if ([int]::TryParse($portStr, [ref]$portNum) -and [int]::TryParse($parts[-1], [ref]$pidNum)) {
                    if (-not $map.ContainsKey($portNum)) {
                        $map[$portNum] = $pidNum
                    }
                }
            }
        }
    }
    return $map
}

function Get-PortPid {
    param([int]$Port)
    if (-not $Port) { return $null }
    $map = Get-ListeningPortMap
    if ($map.ContainsKey($Port)) { return $map[$Port] }
    return $null
}

function Test-ServiceHealthy {
    param([hashtable]$Svc, [hashtable]$PortMap = $null)
    if (-not $PortMap) { $PortMap = Get-ListeningPortMap }
    if (-not $PortMap.ContainsKey($Svc.Port)) { return $false }
    return $true
}

function Refresh-TrayStatus {
    $portMap = Get-ListeningPortMap
    $up = 0
    foreach ($k in $Services.Keys) {
        $svc = $Services[$k]
        $isUp = $portMap.ContainsKey($svc.Port)
        if ($isUp) { $up++ }
        if ($ServiceMenuItems.ContainsKey($k)) {
            $prefix = if ($isUp) { '[ON]  ' } else { '[OFF] ' }
            $ServiceMenuItems[$k].Text = $prefix + $svc.Label
        }
    }
    $state = if ($up -eq 0) { 'stopped' } elseif ($up -eq $Services.Count) { 'running' } else { 'partial' }

    $bmp = New-Object System.Drawing.Bitmap(16, 16)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = 'AntiAlias'
    $color = switch ($state) {
        'running'  { [System.Drawing.Color]::FromArgb(255, 34, 197, 94) }
        'partial'  { [System.Drawing.Color]::FromArgb(255, 234, 179, 8) }
        default    { [System.Drawing.Color]::FromArgb(255, 239, 68, 68) }
    }
    $brush = New-Object System.Drawing.SolidBrush($color)
    $g.FillEllipse($brush, 1, 1, 14, 14)
    $brush.Dispose()
    $g.Dispose()

    $hIcon = $bmp.GetHicon()
    $newIcon = [System.Drawing.Icon]::FromHandle($hIcon)
    $cloned = [System.Drawing.Icon]$newIcon.Clone()
    [void][TrayNative]::DestroyIcon($hIcon)
    $newIcon.Dispose()
    $bmp.Dispose()

    $old = $tray.Icon
    $tray.Icon = $cloned
    if ($old) { $old.Dispose() }

    $tray.Text = ("realestatecrm [{0}] {1}/{2} services" -f $state, $up, $Services.Count)
}

# -- service control -------------------------------------------------------

function Start-TrayService {
    param([string]$Key, [switch]$Quiet)
    $svc = $Services[$Key]
    if (Test-ServiceHealthy -Svc $svc) {
        if (-not $Quiet) {
            $tray.ShowBalloonTip(1500, 'realestatecrm', ($svc.Label + ' already running'), [System.Windows.Forms.ToolTipIcon]::Info)
        }
        return
    }
    $logPath = Join-Path $svc.WorkDir $svc.Log
    $errPath = Join-Path $svc.WorkDir $svc.ErrLog
    $proc = Start-Process -FilePath 'cmd.exe' `
        -ArgumentList ('/c', ($svc.Cmd + ' > "' + $logPath + '" 2> "' + $errPath + '"')) `
        -WorkingDirectory $svc.WorkDir -WindowStyle Hidden -PassThru
    try {
        if ($proc -and -not $proc.HasExited) {
            $proc.PriorityClass = 'BelowNormal'
        }
    } catch { }

    if (-not $Quiet) {
        for ($i = 0; $i -lt 15; $i++) {
            Start-Sleep -Milliseconds 750
            if (Test-ServiceHealthy -Svc $svc) { break }
        }
        if (Test-ServiceHealthy -Svc $svc) {
            $tray.ShowBalloonTip(2000, 'realestatecrm', ($svc.Label + ' is running'), [System.Windows.Forms.ToolTipIcon]::Info)
        } else {
            $tray.ShowBalloonTip(3000, 'realestatecrm', ($svc.Label + ' failed to start -- check ' + $svc.ErrLog), [System.Windows.Forms.ToolTipIcon]::Error)
        }
    }
    Refresh-TrayStatus
}

function Stop-TrayService {
    param([string]$Key, [switch]$Quiet)
    $svc = $Services[$Key]
    $procPid = Get-PortPid -Port $svc.Port
    if ($procPid -and $procPid -ne $PID) {
        # Surgical: only kill the exact PID bound to this service's TCP port.
        Stop-Process -Id $procPid -Force -ErrorAction SilentlyContinue
        if (-not $Quiet) {
            $tray.ShowBalloonTip(1500, 'realestatecrm', ($svc.Label + ' stopped (PID ' + $procPid + ')'), [System.Windows.Forms.ToolTipIcon]::Info)
        }
    } elseif (-not $Quiet) {
        $tray.ShowBalloonTip(1500, 'realestatecrm', ($svc.Label + ' was not running'), [System.Windows.Forms.ToolTipIcon]::Warning)
    }
    Refresh-TrayStatus
}

function Start-AllServices {
    foreach ($k in $Services.Keys) { Start-TrayService -Key $k -Quiet }
    Start-Sleep -Seconds 4
    Refresh-TrayStatus
    $tray.ShowBalloonTip(2000, 'realestatecrm', 'Launched all 12 services (BelowNormal priority).', [System.Windows.Forms.ToolTipIcon]::Info)
}

function Stop-AllServices {
    foreach ($k in $Services.Keys) { Stop-TrayService -Key $k -Quiet }
    Start-Sleep -Milliseconds 500
    Refresh-TrayStatus
}

# ---------------------------------------------------------------------------
# Tray icon & context menu
# ---------------------------------------------------------------------------

$tray = New-Object System.Windows.Forms.NotifyIcon
$tray.Icon = [System.Drawing.SystemIcons]::Application
$tray.Visible = $true

$menu = New-Object System.Windows.Forms.ContextMenuStrip

$miOpenLocal = $menu.Items.Add('Open Local Dashboard (localhost:3000)')
$miOpenLocal.Add_Click({ Start-Process 'http://localhost:3000' })

$miOpenProd = $menu.Items.Add('Open Live Production (excellegacyrealtygroup.site)')
$miOpenProd.Add_Click({ Start-Process 'https://excellegacyrealtygroup.site' })

$menu.Items.Add((New-Object System.Windows.Forms.ToolStripSeparator))

foreach ($k in $Services.Keys) {
    $svc = $Services[$k]
    $sub = New-Object System.Windows.Forms.ToolStripMenuItem('[OFF] ' + $svc.Label)
    $ServiceMenuItems[$k] = $sub

    $sOpen = $sub.DropDownItems.Add('Open in Browser (:' + $svc.Port + ')')
    $portCopy = $svc.Port
    $sOpen.Add_Click({ Start-Process ('http://localhost:' + $portCopy) }.GetNewClosure())

    $sub.DropDownItems.Add((New-Object System.Windows.Forms.ToolStripSeparator))

    $s1 = $sub.DropDownItems.Add('Start')
    $key1 = $k
    $s1.Add_Click({ Start-TrayService -Key $key1 }.GetNewClosure())

    $s2 = $sub.DropDownItems.Add('Stop')
    $key2 = $k
    $s2.Add_Click({ Stop-TrayService -Key $key2 }.GetNewClosure())

    $s3 = $sub.DropDownItems.Add('Restart')
    $key3 = $k
    $s3.Add_Click({
        Stop-TrayService -Key $key3 -Quiet
        Start-Sleep -Seconds 1
        Start-TrayService -Key $key3
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

$miStartAll = $menu.Items.Add('Start All 12 Services')
$miStartAll.Add_Click({ Start-AllServices })

$miStopAll = $menu.Items.Add('Stop All 12 Services')
$miStopAll.Add_Click({ Stop-AllServices })

$miWatchdog = $menu.Items.Add('Start Watchdog (60s auto-restart)')
$miWatchdog.Add_Click({
    $wdProc = Start-Process -FilePath 'powershell.exe' -ArgumentList '-ExecutionPolicy','Bypass','-File', (Join-Path $Root 'scripts\watch-services.ps1') -WindowStyle Minimized -PassThru
    try { if ($wdProc -and -not $wdProc.HasExited) { $wdProc.PriorityClass = 'BelowNormal' } } catch { }
})

$menu.Items.Add((New-Object System.Windows.Forms.ToolStripSeparator))

$miExit = $menu.Items.Add('Exit Tray (keep servers running)')
$miExit.Add_Click({
    $timer.Stop()
    $tray.Visible = $false
    $tray.Dispose()
    [System.Windows.Forms.Application]::Exit()
})

$miQuit = $menu.Items.Add('Quit All Servers and Exit')
$miQuit.Add_Click({
    $timer.Stop()
    Stop-AllServices
    $tray.Visible = $false
    $tray.Dispose()
    [System.Windows.Forms.Application]::Exit()
})

$tray.ContextMenuStrip = $menu
$tray.Add_DoubleClick({ Start-Process 'http://localhost:3000' })

# ---------------------------------------------------------------------------
# Health poller (fast single-netstat check every 10s, zero UI freeze)
# ---------------------------------------------------------------------------

$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 10000
$timer.Add_Tick({ Refresh-TrayStatus })
$timer.Start()

Refresh-TrayStatus
$tray.ShowBalloonTip(3000, 'realestatecrm', 'Tray active (12 services). Right-click for controls.', [System.Windows.Forms.ToolTipIcon]::Info)

[System.Windows.Forms.Application]::Run()
