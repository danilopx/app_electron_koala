param(
  [Parameter(Mandatory = $true)]
  [string]$DesktopUrl,

  [string]$PublishDir
)

$ErrorActionPreference = 'Stop'

function Write-Info([string]$Message) {
  Write-Host "[release] $Message"
}

function Assert-HttpUrl([string]$Value) {
  if ([string]::IsNullOrWhiteSpace($Value) -or $Value -notmatch '^https?://') {
    throw "DesktopUrl invalida: '$Value'"
  }
}

Assert-HttpUrl $DesktopUrl

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$desktopConfigPath = Join-Path $repoRoot 'electron\desktop-config.json'
$desktopConfig = @{
  desktopAppUrl = $DesktopUrl.Trim()
} | ConvertTo-Json -Depth 3

Write-Info "Gerando configuracao temporaria do desktop em $desktopConfigPath"
Set-Content -LiteralPath $desktopConfigPath -Value $desktopConfig -Encoding UTF8

try {
  Write-Info 'Gerando build web de producao'
  npm run build:web

  if ($PublishDir) {
    $targetDir = [System.IO.Path]::GetFullPath($PublishDir)
    Write-Info "Copiando dist web para $targetDir"
    New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
    Copy-Item -Path (Join-Path $repoRoot 'dist\Koala\*') -Destination $targetDir -Recurse -Force
  }

  Write-Info 'Gerando instalador desktop'
  npm run build:desktop:fresh
}
finally {
  if (Test-Path -LiteralPath $desktopConfigPath) {
    Remove-Item -LiteralPath $desktopConfigPath -Force
  }
}
