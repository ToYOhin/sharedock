[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$ArchivePath,
  [string]$TargetDataPath = "",
  [switch]$Force
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
if ([string]::IsNullOrWhiteSpace($TargetDataPath)) {
  $TargetDataPath = Join-Path $repoRoot "data\restore-rehearsal"
}

$archiveFull = (Resolve-Path -LiteralPath $ArchivePath).Path
$targetFull = [IO.Path]::GetFullPath($TargetDataPath)
if ((Test-Path -LiteralPath $TargetDataPath) -and -not $Force) {
  throw "Restore target already exists. Use a new rehearsal directory or pass -Force explicitly: $targetFull"
}

$temporaryRoot = Join-Path ([IO.Path]::GetTempPath()) "sharedock-restore-$([guid]::NewGuid().ToString('N'))"
New-Item -ItemType Directory -Path $temporaryRoot -Force | Out-Null

try {
  Expand-Archive -LiteralPath $archiveFull -DestinationPath $temporaryRoot -Force
  $sourceFiles = @(Get-ChildItem -LiteralPath $temporaryRoot -Recurse -File -Force)
  if ($sourceFiles.Count -eq 0) {
    throw "The backup archive contains no files: $archiveFull"
  }

  if (Test-Path -LiteralPath $TargetDataPath) {
    Remove-Item -LiteralPath $TargetDataPath -Recurse -Force
  }
  New-Item -ItemType Directory -Path $TargetDataPath -Force | Out-Null
  Get-ChildItem -LiteralPath $temporaryRoot -Force | Copy-Item -Destination $TargetDataPath -Recurse -Force

  $restoredFiles = @(Get-ChildItem -LiteralPath $TargetDataPath -Recurse -File -Force)
  $sourceBytes = ($sourceFiles | Measure-Object -Property Length -Sum).Sum
  $restoredBytes = ($restoredFiles | Measure-Object -Property Length -Sum).Sum
  if ($sourceFiles.Count -ne $restoredFiles.Count -or $sourceBytes -ne $restoredBytes) {
    throw "Restore verification failed: source files/bytes $($sourceFiles.Count)/$sourceBytes, restored $($restoredFiles.Count)/$restoredBytes"
  }

  Write-Host "Restored data: $targetFull" -ForegroundColor Green
  Write-Host "Files: $($restoredFiles.Count); bytes: $restoredBytes" -ForegroundColor DarkGray
  Write-Host "SHAREDOCK_RESTORE_OK" -ForegroundColor Green
} finally {
  if (Test-Path -LiteralPath $temporaryRoot) {
    Remove-Item -LiteralPath $temporaryRoot -Recurse -Force
  }
}
