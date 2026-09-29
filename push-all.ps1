# push-all.ps1 — Push main repo and all submodules simultaneously
# Usage: .\push-all.ps1 [-DryRun]
param([switch]$DryRun)

$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$pushed = 0
$clean = 0
$errors = @()

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Push All — realestatecrm + submodules" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Push each submodule first (so main repo references latest commits)
Write-Host "=== Submodules ===" -ForegroundColor Yellow
$submodules = Get-Content "$root\.gitmodules" | Select-String "path = " | ForEach-Object { ($_ -split "path = ")[1].Trim() }

foreach ($sub in $submodules) {
  $subPath = Join-Path $root $sub
  if (-not (Test-Path "$subPath\.git") -and -not (Test-Path "$root\.git\modules\$sub")) {
    Write-Host "  SKIP $sub (not initialized)" -ForegroundColor DarkGray
    continue
  }

  $status = git -C $subPath status --porcelain 2>&1
  $unpushed = git -C $subPath log origin/main..HEAD --oneline 2>&1

  if ($status -or $unpushed) {
    if ($DryRun) {
      Write-Host "  [DRY RUN] Would push: $sub" -ForegroundColor Magenta
    } else {
      Write-Host "  Pushing: $sub ..." -ForegroundColor Green
      $result = git -C $subPath push origin HEAD 2>&1
      if ($LASTEXITCODE -eq 0) {
        $pushed++
        Write-Host "    OK" -ForegroundColor Green
      } else {
        $errors += $sub
        Write-Host "    FAILED: $result" -ForegroundColor Red
      }
    }
    if ($status) {
      Write-Host "    (has uncommitted changes)" -ForegroundColor DarkYellow
    }
  } else {
    Write-Host "  Clean: $sub" -ForegroundColor DarkGray
    $clean++
  }
}

Write-Host ""
Write-Host "=== Main repo ===" -ForegroundColor Yellow

$mainStatus = git -C $root status --porcelain 2>&1 | Where-Object { $_ -notmatch "^\?\?" -or $_ -notmatch "apps/" }
$mainUnpushed = git -C $root log origin/main..HEAD --oneline 2>&1

if ($mainUnpushed) {
  if ($DryRun) {
    Write-Host "  [DRY RUN] Would push main repo" -ForegroundColor Magenta
  } else {
    Write-Host "  Pushing: realestatecrm ..." -ForegroundColor Green
    $result = git -C $root push origin HEAD 2>&1
    if ($LASTEXITCODE -eq 0) {
      $pushed++
      Write-Host "    OK" -ForegroundColor Green
    } else {
      $errors += "realestatecrm"
      Write-Host "    FAILED: $result" -ForegroundColor Red
    }
  }
} else {
  Write-Host "  Clean: realestatecrm" -ForegroundColor DarkGray
  $clean++
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Pushed: $pushed | Clean: $clean | Errors: $($errors.Count)" -ForegroundColor Cyan
if ($errors.Count -gt 0) {
  Write-Host "  Failed repos: $($errors -join ', ')" -ForegroundColor Red
}
Write-Host "============================================" -ForegroundColor Cyan
