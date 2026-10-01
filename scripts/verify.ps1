[CmdletBinding()]
param(
  [switch]$RunSmoke,
  [switch]$KeepSmokeData
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$frontendRoot = Join-Path $repoRoot "frontend"
$backendRoot = Join-Path $repoRoot "backend"
$docsRoot = Join-Path $repoRoot "docs"
$verifyTempRoot = Join-Path $repoRoot "temp\verify-frontend-tests"

$nodeVersion = (& node.exe --version 2>$null)
if ($LASTEXITCODE -ne 0 -or $nodeVersion -notmatch "^v22\.") {
  throw "ShareDock verification requires Node 22.x. Current runtime: $nodeVersion. Use $repoRoot\.node-version."
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

function Invoke-FrontendContractTests {
  $tests = @(
    "cleanup-log.util.test.ts",
    "cleanup-policy.util.test.ts",
    "cleanup-preview.util.test.ts",
    "config-value.util.test.ts",
    "sharex-uploader.util.test.ts",
    "upload-token.util.test.ts"
  )

  if (Test-Path -LiteralPath $verifyTempRoot) {
    Remove-Item -LiteralPath $verifyTempRoot -Recurse -Force
  }
  New-Item -ItemType Directory -Path $verifyTempRoot -Force | Out-Null

  foreach ($test in $tests) {
    $sourcePath = Join-Path $frontendRoot "test\$test"
    $compiledPath = Join-Path $verifyTempRoot "test\$($test -replace '\.ts$', '.js')"

    Invoke-Checked `
      -Name "frontend contract compile: $test" `
      -Executable "npx.cmd" `
      -Arguments @(
        "tsc",
        "--skipLibCheck",
        "--module", "commonjs",
        "--target", "ES2021",
        "--moduleResolution", "node",
        "--types", "node",
        "--outDir", $verifyTempRoot,
        $sourcePath
      ) `
      -WorkingDirectory $frontendRoot

    Invoke-Checked `
      -Name "frontend contract test: $test" `
      -Executable "node.exe" `
      -Arguments @($compiledPath) `
      -WorkingDirectory $frontendRoot
  }
}

Write-Host "ShareDock verification root: $repoRoot" -ForegroundColor Green

Invoke-Checked -Name "dependency gate tests" -Executable "npm.cmd" -Arguments @("run", "security:test") -WorkingDirectory $repoRoot
Invoke-Checked -Name "source dependency security gate" -Executable "npm.cmd" -Arguments @("run", "security:audit") -WorkingDirectory $repoRoot
Invoke-Checked -Name "generate Prisma client" -Executable "npx.cmd" -Arguments @("prisma", "generate") -WorkingDirectory $backendRoot
Invoke-Checked -Name "SQLite file initialization tests" -Executable "node.exe" -Arguments @("--test", "test/initialize-sqlite.test.cjs") -WorkingDirectory $backendRoot
Invoke-Checked -Name "root lint" -Executable "npm.cmd" -Arguments @("run", "lint") -WorkingDirectory $repoRoot

Invoke-Checked -Name "backend focused tests" -Executable "npx.cmd" -Arguments @("ts-node", "--transpile-only", "test/cleanup-log.util.test.ts") -WorkingDirectory $backendRoot
Invoke-Checked -Name "backend focused tests" -Executable "npx.cmd" -Arguments @("ts-node", "--transpile-only", "test/cleanup-preview.util.test.ts") -WorkingDirectory $backendRoot
Invoke-Checked -Name "backend focused tests" -Executable "npx.cmd" -Arguments @("ts-node", "--transpile-only", "test/sharex-integration.util.test.ts") -WorkingDirectory $backendRoot
Invoke-Checked -Name "backend focused tests" -Executable "npx.cmd" -Arguments @("ts-node", "--transpile-only", "test/upload-token.util.test.ts") -WorkingDirectory $backendRoot
Invoke-Checked -Name "backend focused tests" -Executable "npx.cmd" -Arguments @("ts-node", "--transpile-only", "test/upload-webhook.util.test.ts") -WorkingDirectory $backendRoot
Invoke-Checked -Name "backend service tests" -Executable "npx.cmd" -Arguments @("ts-node", "--transpile-only", "test/upload-webhook.service.test.ts") -WorkingDirectory $backendRoot
Invoke-Checked -Name "backend image compatibility test" -Executable "npx.cmd" -Arguments @("ts-node", "--transpile-only", "test/logo.service.test.ts") -WorkingDirectory $backendRoot
Invoke-Checked -Name "backend request body limit test" -Executable "node.exe" -Arguments @("--test", "test/body-parser.test.cjs") -WorkingDirectory $backendRoot
Invoke-Checked -Name "backend real i18n regression" -Executable "npx.cmd" -Arguments @("ts-node", "--transpile-only", "test/i18n.runtime.test.ts") -WorkingDirectory $backendRoot
Invoke-Checked -Name "backend email compatibility test" -Executable "npx.cmd" -Arguments @("ts-node", "-r", "tsconfig-paths/register", "--transpile-only", "test/email.service.test.ts") -WorkingDirectory $backendRoot
Invoke-Checked -Name "backend service tests" -Executable "npx.cmd" -Arguments @("ts-node", "-r", "tsconfig-paths/register", "--transpile-only", "test/cleanup-log.service.test.ts") -WorkingDirectory $backendRoot
Invoke-Checked -Name "backend service tests" -Executable "npx.cmd" -Arguments @("ts-node", "-r", "tsconfig-paths/register", "--transpile-only", "test/upload-token.service.test.ts") -WorkingDirectory $backendRoot

Invoke-FrontendContractTests

Invoke-Checked -Name "backend build" -Executable "npm.cmd" -Arguments @("run", "build") -WorkingDirectory $backendRoot
Invoke-Checked -Name "frontend build" -Executable "npm.cmd" -Arguments @("run", "build") -WorkingDirectory $frontendRoot
Invoke-Checked -Name "docs typecheck" -Executable "npm.cmd" -Arguments @("run", "typecheck") -WorkingDirectory $docsRoot
Invoke-Checked -Name "docs build" -Executable "npm.cmd" -Arguments @("run", "build") -WorkingDirectory $docsRoot

if ($RunSmoke) {
  $smokeArguments = @("-Reset")
  if ($KeepSmokeData) {
    $smokeArguments += "-Keep"
  }

  Invoke-Checked `
    -Name "disposable SQLite smoke database" `
    -Executable "powershell.exe" `
    -Arguments (@(
      "-NoProfile",
      "-ExecutionPolicy", "Bypass",
      "-File", (Join-Path $PSScriptRoot "smoke-db.ps1")
    ) + $smokeArguments) `
    -WorkingDirectory $repoRoot
}

Write-Host "`nSHAREDOCK_VERIFY_OK" -ForegroundColor Green
