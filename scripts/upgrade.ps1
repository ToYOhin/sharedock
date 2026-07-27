[CmdletBinding()]
param(
  [string]$DataPath = "",
  [string]$BackupPath = "",
  [string]$DatabaseUrl = "",
  [switch]$Apply,
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
if ([string]::IsNullOrWhiteSpace($DataPath)) {
  $DataPath = Join-Path $repoRoot "data"
}
if ([string]::IsNullOrWhiteSpace($BackupPath)) {
  $BackupPath = Join-Path $repoRoot "backups"
}

$dataFull = (Resolve-Path -LiteralPath $DataPath).Path
$backupScript = Join-Path $PSScriptRoot "backup.ps1"
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $backupScript -DataPath $dataFull -OutputPath $BackupPath
if ($LASTEXITCODE -ne 0) {
  throw "Pre-upgrade backup failed with exit code $LASTEXITCODE"
}

if (-not $Apply) {
  Write-Host "SHAREDOCK_UPGRADE_PREFLIGHT_OK" -ForegroundColor Green
  Write-Host "No migrations or builds were applied. Re-run with -Apply after reviewing the backup." -ForegroundColor Yellow
  exit 0
}

if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) {
  $databasePath = Join-Path $dataFull "sharedock.db"
  $DatabaseUrl = "file:$($databasePath.Replace('\', '/'))?connection_limit=1"
}

$previousDatabaseUrl = $env:DATABASE_URL
$env:DATABASE_URL = $DatabaseUrl
try {
  Push-Location (Join-Path $repoRoot "backend")
  try {
    & npx.cmd prisma migrate deploy
    if ($LASTEXITCODE -ne 0) { throw "Prisma migrate deploy failed with exit code $LASTEXITCODE" }
    & npx.cmd prisma db seed
    if ($LASTEXITCODE -ne 0) { throw "Prisma db seed failed with exit code $LASTEXITCODE" }
  } finally {
    Pop-Location
  }

  if (-not $SkipBuild) {
    Push-Location (Join-Path $repoRoot "backend")
    try {
      & npm.cmd run build
      if ($LASTEXITCODE -ne 0) { throw "Backend build failed with exit code $LASTEXITCODE" }
    } finally {
      Pop-Location
    }

    Push-Location (Join-Path $repoRoot "frontend")
    try {
      & npm.cmd run build
      if ($LASTEXITCODE -ne 0) { throw "Frontend build failed with exit code $LASTEXITCODE" }
    } finally {
      Pop-Location
    }
  }

  Write-Host "SHAREDOCK_UPGRADE_OK" -ForegroundColor Green
} finally {
  if ($null -eq $previousDatabaseUrl) {
    Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
  } else {
    $env:DATABASE_URL = $previousDatabaseUrl
  }
}
