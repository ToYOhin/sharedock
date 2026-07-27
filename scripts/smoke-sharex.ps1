[CmdletBinding()]
param(
  [string]$BackendUrl = "http://localhost:8080",
  [string]$ArtifactPath = "",
  [string]$SxcuPath = "",
  [switch]$KeepArtifacts
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$backendApi = "$($BackendUrl.TrimEnd('/'))/api"
$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$artifactRoot = Join-Path $repoRoot "temp\sharex-closure-$stamp"

if ([string]::IsNullOrWhiteSpace($ArtifactPath)) {
  $ArtifactPath = Join-Path $repoRoot "docs\verification\2026-07-10-sharex-docs-render\sharex-integrations-rendered.jpg"
}
if (-not (Test-Path -LiteralPath $ArtifactPath)) {
  throw "ShareX closure artifact was not found: $ArtifactPath"
}

New-Item -ItemType Directory -Path $artifactRoot -Force | Out-Null
$generatedSxcuPath = Join-Path $artifactRoot "sharedock.sxcu"
$responsePath = Join-Path $artifactRoot "upload-response.json"

function Remove-ClosureArtifacts {
  if (-not $KeepArtifacts -and (Test-Path -LiteralPath $artifactRoot)) {
    Remove-Item -LiteralPath $artifactRoot -Recurse -Force
  }
}

try {
  $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  $suffix = [guid]::NewGuid().ToString("N").Substring(0, 12)
  $signup = Invoke-RestMethod `
    -Method Post `
    -Uri "$backendApi/auth/signUp" `
    -WebSession $session `
    -ContentType "application/json" `
    -Body (@{
      email = "sharex-closure-$suffix@example.test"
      username = "sharexclosure$suffix"
      password = "ShareDockClosure!2026"
    } | ConvertTo-Json)

  $tokenResponse = Invoke-RestMethod `
    -Method Post `
    -Uri "$backendApi/uploadTokens" `
    -WebSession $session `
    -ContentType "application/json" `
    -Body (@{ name = "ShareX closure" } | ConvertTo-Json)

  if ([string]::IsNullOrWhiteSpace($tokenResponse.token)) {
    throw "Token create response did not contain the one-time plaintext token"
  }

  if ([string]::IsNullOrWhiteSpace($SxcuPath)) {
    $SxcuPath = $generatedSxcuPath
    $sxcu = [ordered]@{
      Version = "17.0.0"
      Name = "ShareDock - ShareX closure"
      DestinationType = "ImageUploader, FileUploader"
      RequestMethod = "POST"
      RequestURL = "$backendApi/integrations/sharex/upload"
      Headers = [ordered]@{ Authorization = "Bearer $($tokenResponse.token)" }
      Body = "MultipartFormData"
      FileFormName = "file"
      URL = "{json:url}"
      DeletionURL = "{json:deletionUrl}"
    }
    $sxcu | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $SxcuPath -Encoding UTF8
  }

  $sxcu = Get-Content -Raw -Encoding UTF8 -LiteralPath $SxcuPath | ConvertFrom-Json
  $requiredFields = @("RequestURL", "Body", "FileFormName", "URL", "DeletionURL")
  foreach ($field in $requiredFields) {
    if ([string]::IsNullOrWhiteSpace([string]$sxcu.$field)) {
      throw ".sxcu is missing required field: $field"
    }
  }
  if ($sxcu.Body -ne "MultipartFormData" -or $sxcu.FileFormName -ne "file") {
    throw ".sxcu multipart contract is invalid"
  }

  $authHeader = "Authorization: $($sxcu.Headers.Authorization)"
  $uploadStatus = & curl.exe -sS `
    -o $responsePath `
    -w "%{http_code}" `
    -X POST $sxcu.RequestURL `
    -H $authHeader `
    -F "file=@$ArtifactPath"

  if ($uploadStatus -ne "201") {
    throw "ShareX upload returned HTTP $uploadStatus"
  }

  $uploadResponse = Get-Content -Raw -Encoding UTF8 -LiteralPath $responsePath | ConvertFrom-Json
  if ([string]::IsNullOrWhiteSpace($uploadResponse.shareId) -or [string]::IsNullOrWhiteSpace($uploadResponse.url)) {
    throw "ShareX upload response did not contain shareId and url"
  }

  $null = Invoke-RestMethod `
    -Method Delete `
    -Uri "$backendApi/uploadTokens/$($tokenResponse.id)" `
    -WebSession $session

  $revokedStatus = & curl.exe -sS `
    -o NUL `
    -w "%{http_code}" `
    -X POST $sxcu.RequestURL `
    -H $authHeader `
    -F "file=@$ArtifactPath"

  if ($revokedStatus -ne "401") {
    throw "Revoked ShareX token returned HTTP $revokedStatus instead of 401"
  }

  Write-Host "SHAREX_CLOSURE_OK" -ForegroundColor Green
  Write-Host "Imported .sxcu: $SxcuPath"
  Write-Host "Uploaded share: $($uploadResponse.shareId)"
  Write-Host "Returned URL: $($uploadResponse.url)"
  Write-Host "Revoked token response: HTTP $revokedStatus"
  if (-not $KeepArtifacts) {
    Write-Host "Temporary closure artifacts removed. Use -KeepArtifacts to retain the non-secret response/artifact folder; the generated .sxcu contains a credential." -ForegroundColor DarkGray
  }
} finally {
  if (-not $KeepArtifacts) {
    Remove-ClosureArtifacts
  }
}
