[CmdletBinding()]
param(
  [string]$DataPath = "",
  [string]$OutputPath = "",
  [string]$Name = ""
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
if ([string]::IsNullOrWhiteSpace($DataPath)) {
  $DataPath = Join-Path $repoRoot "data"
}
if ([string]::IsNullOrWhiteSpace($OutputPath)) {
  $OutputPath = Join-Path $repoRoot "backups"
}
if ([string]::IsNullOrWhiteSpace($Name)) {
  $Name = "sharedock-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
}

$dataFull = [IO.Path]::GetFullPath((Resolve-Path -LiteralPath $DataPath).Path)
$outputFull = [IO.Path]::GetFullPath($OutputPath)
if ($outputFull.StartsWith("$dataFull$([IO.Path]::DirectorySeparatorChar)", [StringComparison]::OrdinalIgnoreCase)) {
  throw "Backup output must not be inside the data directory: $outputFull"
}

New-Item -ItemType Directory -Path $outputFull -Force | Out-Null
$archivePath = Join-Path $outputFull "$Name.zip"
$manifestPath = Join-Path $outputFull "$Name.json"
if (Test-Path -LiteralPath $archivePath) {
  throw "Backup archive already exists: $archivePath"
}

$items = @(Get-ChildItem -LiteralPath $dataFull -Force)
if ($items.Count -eq 0) {
  throw "Data directory is empty; there is no runtime state to back up."
}

Write-Warning "Stop ShareDock before backing up a live SQLite database. This script does not stop services."
Compress-Archive -Path (Join-Path $dataFull "*") -DestinationPath $archivePath -CompressionLevel Optimal

$archiveHash = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash
$manifest = [ordered]@{
  createdAt = (Get-Date).ToUniversalTime().ToString("o")
  sourceDataPath = $dataFull
  archive = Split-Path -Leaf $archivePath
  sha256 = $archiveHash
  fileCount = @(Get-ChildItem -LiteralPath $dataFull -Recurse -File -Force).Count
  storageMode = "local-filesystem"
  note = "S3 objects are external and are not included in this archive."
}
$manifest | ConvertTo-Json | Set-Content -LiteralPath $manifestPath -Encoding UTF8

Write-Host "Backup archive: $archivePath" -ForegroundColor Green
Write-Host "Manifest: $manifestPath" -ForegroundColor Green
Write-Host "SHA256: $archiveHash" -ForegroundColor DarkGray
Write-Host "SHAREDOCK_BACKUP_OK" -ForegroundColor Green
