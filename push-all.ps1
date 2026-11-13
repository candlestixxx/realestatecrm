# push-all.ps1 -- Push main repo and all submodules simultaneously
# Usage: .\push-all.ps1 [-DryRun] [-AllBranches]
param(
  [switch]$DryRun,
  [switch]$AllBranches
)

$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$pushed = 0
$clean = 0
$errors = @()

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Push All -- RealEstateCRM + 8 submodules" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "=== Submodules ===" -ForegroundColor Yellow
$submodules = Get-Content "$root\.gitmodules" | Select-String "path = " | ForEach-Object { ($_ -split "path = ")[1].Trim() }

foreach ($sub in $submodules) {
  $subPath = Join-Path $root $sub
  $inside = git -C $subPath rev-parse --is-inside-work-tree 2>$null
  if ($inside -ne "true") {
    Write-Host "  SKIP $sub (not initialized)" -ForegroundColor DarkGray
    continue
  }

  $status = git -C $subPath status --porcelain 2>$null
  $unpushed = git -C $subPath log origin/main..HEAD --oneline 2>$null

  if ($AllBranches -or $unpushed) {
    if ($DryRun) {
      Write-Host "  [DRY RUN] Would push: $sub" -ForegroundColor Magenta
    } else {
      Write-Host "  Pushing: $sub ..." -ForegroundColor Green
      $pushTarget = if ($AllBranches) { "--all" } else { "HEAD" }
      $result = git -C $subPath push origin $pushTarget 2>&1
      if ($LASTEXITCODE -eq 0) {
        $pushed++
        Write-Host "    OK" -ForegroundColor Green
      } else {
        $errors += $sub
        Write-Host "    FAILED: $result" -ForegroundColor Red
      }
    }
  } else {
    Write-Host "  Clean: $sub" -ForegroundColor DarkGray
    $clean++
  }
  if ($status) {
    Write-Host "    (note: local working tree has uncommitted runtime/env files)" -ForegroundColor DarkYellow
  }
}

Write-Host ""
Write-Host "=== Main repo ===" -ForegroundColor Yellow

$mainUnpushed = git -C $root log origin/main..HEAD --oneline 2>$null

if ($AllBranches -or $mainUnpushed) {
  if ($DryRun) {
    Write-Host "  [DRY RUN] Would push main repo" -ForegroundColor Magenta
  } else {
    Write-Host "  Pushing: RealEstateCRM ..." -ForegroundColor Green
    $pushTarget = if ($AllBranches) { "--all" } else { "HEAD" }
    $result = git -C $root push origin $pushTarget 2>&1
    if ($LASTEXITCODE -eq 0) {
      $pushed++
      Write-Host "    OK" -ForegroundColor Green
    } else {
      $errors += "RealEstateCRM"
      Write-Host "    FAILED: $result" -ForegroundColor Red
    }
  }
} else {
  Write-Host "  Clean: RealEstateCRM" -ForegroundColor DarkGray
  $clean++
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Pushed: $pushed | Clean: $clean | Errors: $($errors.Count)" -ForegroundColor Cyan
if ($errors.Count -gt 0) {
  Write-Host "  Failed repos: $($errors -join ', ')" -ForegroundColor Red
}
Write-Host "============================================" -ForegroundColor Cyan
