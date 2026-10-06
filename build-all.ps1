# build-all.ps1 — Build all components of the realestatecrm platform
#
# Why: building each submodule individually is tedious and error-prone.
# This script builds the main CRM and all 5 submodules in dependency order,
# reporting pass/fail for each. Nondestructive — never cleans or purges
# built binaries.
#
# Usage: powershell -ExecutionPolicy Bypass -File build-all.ps1 [-SkipInstall]

param([switch]$SkipInstall)

$Root = $PSScriptRoot
$results = @()

function Build-Component($name, $path, $installCmd, $buildCmd) {
    Write-Host ""
    Write-Host "=== Building $name ===" -ForegroundColor Cyan
    Set-Location (Join-Path $Root $path)
    
    if (-not $SkipInstall -and $installCmd) {
        Write-Host "  Installing dependencies..."
        Invoke-Expression $installCmd 2>&1 | Select-Object -Last 3
    }
    
    Write-Host "  Building..."
    $output = Invoke-Expression $buildCmd 2>&1
    $success = $LASTEXITCODE -eq 0
    if ($success) {
        Write-Host "  PASS" -ForegroundColor Green
    } else {
        Write-Host "  FAIL" -ForegroundColor Red
        $output | Select-Object -Last 15
    }
    $script:results += [PSCustomObject]@{ Name=$name; Success=$success }
}

# Main CRM
Build-Component "Main CRM" "." "npm install --legacy-peer-deps" "npm run build"

# Submodules (each is an independent Next.js/Node project)
Build-Component "LeadG" "apps\leadg" "npm install --legacy-peer-deps" "npm run build"
Build-Component "ContentPlanner" "apps\contentplanner\apps\web" "npm install --legacy-peer-deps" "npx next build"
Build-Component "ForeclosureWorkflow" "apps\foreclosureworkflow" "npm install --legacy-peer-deps" "npx next build"
Build-Component "Media Workflow" "apps\media-workflow" "npm install --legacy-peer-deps" "npm run build"
Build-Component "LegacyLeads Frontend" "apps\legacyleads\frontend" "npm install --legacy-peer-deps" "npx next build"

# Summary
Write-Host ""
Write-Host "=== Build Summary ===" -ForegroundColor Yellow
foreach ($r in $results) {
    $status = if ($r.Success) { "PASS" } else { "FAIL" }
    $color = if ($r.Success) { "Green" } else { "Red" }
    Write-Host "  $($r.Name): $status" -ForegroundColor $color
}

$failCount = ($results | Where-Object { -not $_.Success }).Count
if ($failCount -gt 0) {
    Write-Host ""
    Write-Host "$failCount component(s) failed to build." -ForegroundColor Red
    exit 1
} else {
    Write-Host ""
    Write-Host "All components built successfully." -ForegroundColor Green
    exit 0
}
