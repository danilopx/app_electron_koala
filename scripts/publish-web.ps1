param(
  [Parameter(Mandatory = $true)]
  [string]$PublishDir,

  [switch]$Clean
)

$ErrorActionPreference = 'Stop'

function Write-Info([string]$Message) {
  Write-Host "[publish-web] $Message"
}

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$sourceDir = Join-Path $repoRoot 'dist\Koala'
if (-not (Test-Path -LiteralPath $sourceDir)) {
  Write-Info 'Gerando build web de producao'
  npm run build:web:prod
}

if (-not (Test-Path -LiteralPath $sourceDir)) {
  throw "Build web nao encontrado em $sourceDir"
}

$targetDir = [System.IO.Path]::GetFullPath($PublishDir)
Write-Info "Publicando web em $targetDir"

New-Item -ItemType Directory -Force -Path $targetDir | Out-Null

if ($Clean) {
  Get-ChildItem -LiteralPath $targetDir -Force | Remove-Item -Recurse -Force
}

Copy-Item -Path (Join-Path $sourceDir '*') -Destination $targetDir -Recurse -Force

Write-Info 'Publicacao concluida'
