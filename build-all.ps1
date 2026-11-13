# build-all.ps1 -- Build all components of the RealEstateCRM platform
#
# Why: building each submodule individually is tedious and error-prone.
# This script builds the main CRM and all 8 submodules in dependency order,
# running every heavyweight child process at BelowNormal CPU priority so builds
# never wedge the desktop. Nondestructive -- never cleans or purges built binaries.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File build-all.ps1 [-SkipInstall] [-Only <name>]

param(
    [switch]$SkipInstall,
    [string]$Only = ""
)

$Root = $PSScriptRoot
$results = @()

function Invoke-BelowNormal($workDir, $cmdLine) {
    $outLog = Join-Path $env:TEMP ("ercm-build-" + [Guid]::NewGuid().ToString("N") + ".log")
    $errLog = $outLog + ".err"
    $batFile = $outLog + ".cmd"
    $batBody = @(
        "@echo off",
        "if not defined DATABASE_URL set DATABASE_URL=file:./dev.db",
        "call $cmdLine > `"$outLog`" 2> `"$errLog`"",
        "exit /b %ERRORLEVEL%"
    ) -join "`r`n"
    Set-Content -Path $batFile -Value $batBody -Encoding ASCII

    $proc = Start-Process -FilePath "cmd.exe" `
        -ArgumentList "/c", $batFile `
        -WorkingDirectory $workDir `
        -WindowStyle Hidden `
        -PassThru
    try {
        if ($proc -and -not $proc.HasExited) {
            $proc.PriorityClass = 'BelowNormal'
        }
    } catch { }
    $proc.WaitForExit()
    $code = $proc.ExitCode
    $combined = @()
    if (Test-Path $outLog) { $combined += Get-Content $outLog -Tail 20 -ErrorAction SilentlyContinue }
    if (Test-Path $errLog) { $combined += Get-Content $errLog -Tail 20 -ErrorAction SilentlyContinue }
    Remove-Item $batFile, $outLog, $errLog -Force -ErrorAction SilentlyContinue
    return @{ ExitCode = $code; Tail = $combined }
}

function Build-Component($name, $path, $installCmd, $prebuildCmd, $buildCmd) {
    if ($Only -and $name -notlike "*$Only*" -and $path -notlike "*$Only*") {
        return
    }
    $targetDir = Join-Path $Root $path
    Write-Host ""
    Write-Host "=== Building $name ($path) [BelowNormal] ===" -ForegroundColor Cyan

    if (-not $SkipInstall -and $installCmd) {
        Write-Host "  Installing dependencies..."
        $inst = Invoke-BelowNormal $targetDir $installCmd
        if ($inst.ExitCode -ne 0) {
            Write-Host "  WARN: install exited $($inst.ExitCode)" -ForegroundColor Yellow
            $inst.Tail | Select-Object -Last 8 | ForEach-Object { Write-Host "    $_" }
        }
    }

    if ($prebuildCmd) {
        Write-Host "  Running prebuild ($prebuildCmd)..."
        [void](Invoke-BelowNormal $targetDir $prebuildCmd)
    }

    Write-Host "  Building ($buildCmd)..."
    $res = Invoke-BelowNormal $targetDir $buildCmd
    $success = ($res.ExitCode -eq 0)
    if ($success) {
        Write-Host "  PASS" -ForegroundColor Green
    } else {
        Write-Host "  FAIL (exit $($res.ExitCode))" -ForegroundColor Red
        $res.Tail | Select-Object -Last 15 | ForEach-Object { Write-Host "    $_" }
    }
    $script:results += [PSCustomObject]@{ Name = $name; Path = $path; Success = $success }
}

# Main CRM (port 3000)
Build-Component "Main CRM" "." "npm install --legacy-peer-deps" "npx prisma generate" "npm run build"

# 8 Registered Submodules under apps/
Build-Component "LeadG" "apps\leadg" "npm install --legacy-peer-deps" "npx prisma generate" "npm run build"
Build-Component "ContentPlanner" "apps\contentplanner" "npm install --legacy-peer-deps" "npx prisma generate --schema packages/database/prisma/schema.prisma" "npm run build"
Build-Component "ForeclosureWorkflow" "apps\foreclosureworkflow" "npm install --legacy-peer-deps" "npx prisma generate" "npm run build"
Build-Component "Media Workflow" "apps\media-workflow" "npm install --legacy-peer-deps" $null "npm run build"
Build-Component "LegacyLeads Frontend" "apps\legacyleads\frontend" "npm install --legacy-peer-deps" $null "npm run build"
Build-Component "LegacyLeads Backend" "apps\legacyleads\backend" "npm install --legacy-peer-deps" $null "npm run build"
Build-Component "AI CRM" "apps\aicrm" "npm install --legacy-peer-deps" "npx prisma generate" "npm run build"
Build-Component "Lead Caller" "apps\leadcaller" "npm install --legacy-peer-deps" "npx prisma generate" "npm run build"
Build-Component "Prototype Server" "apps\prototype\server" "npm install --legacy-peer-deps" $null "npm run build"

Set-Location $Root

Write-Host ""
Write-Host "=== Build Summary ===" -ForegroundColor Yellow
foreach ($r in $results) {
    $status = if ($r.Success) { "PASS" } else { "FAIL" }
    $color = if ($r.Success) { "Green" } else { "Red" }
    Write-Host ("  {0,-24} {1}" -f $r.Name, $status) -ForegroundColor $color
}

$failCount = @($results | Where-Object { -not $_.Success }).Count
if ($failCount -gt 0) {
    Write-Host ""
    Write-Host "$failCount component(s) failed to build." -ForegroundColor Red
    exit 1
} else {
    Write-Host ""
    Write-Host "All $($results.Count) component(s) built successfully." -ForegroundColor Green
    exit 0
}
