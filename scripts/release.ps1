param(
  [Parameter(Mandatory = $true)]
  [string]$DesktopUrl,

  [string]$PublishDir,

  [switch]$PublishToGithub,

  [string]$GithubOwner,

  [string]$GithubRepo
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

function Assert-Text([string]$Value, [string]$Name) {
  if ([string]::IsNullOrWhiteSpace($Value)) {
    throw "$Name nao informado."
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

  if ($PublishToGithub) {
    if (-not $GithubOwner) {
      $GithubOwner = $env:GH_OWNER
    }

    if (-not $GithubRepo) {
      $GithubRepo = $env:GH_REPO
    }

    Assert-Text $GithubOwner 'GithubOwner'
    Assert-Text $GithubRepo 'GithubRepo'
    if ([string]::IsNullOrWhiteSpace($env:GH_TOKEN) -and [string]::IsNullOrWhiteSpace($env:GITHUB_TOKEN)) {
      throw 'GH_TOKEN ou GITHUB_TOKEN nao informado.'
    }

    $env:GH_OWNER = $GithubOwner.Trim()
    $env:GH_REPO = $GithubRepo.Trim()

    Write-Info "Gerando instalador desktop e publicando no GitHub ($($env:GH_OWNER)/$($env:GH_REPO))"
    npm run build:desktop:github
  } else {
    Write-Info 'Gerando instalador desktop'
    npm run build:desktop:fresh
  }
}
finally {
  if (Test-Path -LiteralPath $desktopConfigPath) {
    Remove-Item -LiteralPath $desktopConfigPath -Force
  }
}
