[CmdletBinding()]
param(
  [switch]$Reset,
  [switch]$Keep,
  [string]$SmokeRelativePath = "data\smoke"
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$smokeRoot = Join-Path $repoRoot $SmokeRelativePath
$resolvedRepoRoot = [IO.Path]::GetFullPath($repoRoot).TrimEnd([IO.Path]::DirectorySeparatorChar)
$resolvedSmokeRoot = [IO.Path]::GetFullPath($smokeRoot).TrimEnd([IO.Path]::DirectorySeparatorChar)

if (-not $resolvedSmokeRoot.StartsWith("$resolvedRepoRoot$([IO.Path]::DirectorySeparatorChar)", [StringComparison]::OrdinalIgnoreCase)) {
  throw "Smoke path must stay inside the repository: $resolvedSmokeRoot"
}

$nodeVersion = (& node.exe --version 2>$null)
if ($LASTEXITCODE -ne 0 -or $nodeVersion -notmatch "^v20\.") {
  throw "ShareDock Prisma smoke requires Node 20.x. Current runtime: $nodeVersion. Switch to the version in $repoRoot\.node-version and rerun."
}

function Invoke-Checked {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Executable,
    [Parameter(Mandatory = $true)][string[]]$Arguments,
    [Parameter(Mandatory = $true)][string]$WorkingDirectory
  )

  Write-Host "`n==> $Name" -ForegroundColor Cyan
  Push-Location $WorkingDirectory
  try {
    & $Executable @Arguments
    if ($LASTEXITCODE -ne 0) {
      throw "$Name failed with exit code $LASTEXITCODE"
    }
  } finally {
    Pop-Location
  }
}

if ($Reset -and (Test-Path -LiteralPath $smokeRoot)) {
  Remove-Item -LiteralPath $smokeRoot -Recurse -Force
}

New-Item -ItemType Directory -Path $smokeRoot -Force | Out-Null
$databasePath = Join-Path $smokeRoot "sharedock-smoke.db"
$databaseUrl = "file:$($databasePath.Replace('\', '/'))?connection_limit=1"
$previousDatabaseUrl = $env:DATABASE_URL
$env:DATABASE_URL = $databaseUrl
$completed = $false

try {
  Write-Host "Smoke database: $databasePath" -ForegroundColor Green
  Write-Host "This flow uses Prisma migrations and the repository seed; it does not apply hand-written SQL." -ForegroundColor DarkGray

  Invoke-Checked -Name "Prisma generate" -Executable "npx.cmd" -Arguments @("prisma", "generate") -WorkingDirectory (Join-Path $repoRoot "backend")

  try {
    Invoke-Checked -Name "Prisma migrate deploy" -Executable "npx.cmd" -Arguments @("prisma", "migrate", "deploy") -WorkingDirectory (Join-Path $repoRoot "backend")
  } catch {
    throw "Prisma migration failed on this Windows host (Node $nodeVersion). If the output contains 'Schema engine error', use the repository CI database-smoke job or a supported Prisma runtime, then rerun this script. Original error: $($_.Exception.Message)"
  }
  Invoke-Checked -Name "Prisma db seed" -Executable "npx.cmd" -Arguments @("prisma", "db", "seed") -WorkingDirectory (Join-Path $repoRoot "backend")

  if (-not (Test-Path -LiteralPath $databasePath)) {
    throw "Prisma completed but did not create the expected SQLite database: $databasePath"
  }

  $completed = $true
  Write-Host "SHAREDOCK_SMOKE_DB_OK" -ForegroundColor Green
} finally {
  if ($null -eq $previousDatabaseUrl) {
    Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
  } else {
    $env:DATABASE_URL = $previousDatabaseUrl
  }

  if ($completed -and -not $Keep) {
    Remove-Item -LiteralPath $smokeRoot -Recurse -Force
    Write-Host "Disposable smoke data removed. Use -Keep to retain it." -ForegroundColor DarkGray
  } elseif (-not $completed) {
    Write-Host "Smoke data retained for diagnosis: $smokeRoot" -ForegroundColor Yellow
  }
}
