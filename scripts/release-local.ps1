param(
  [string]$DesktopUrl = 'http://koala.simplifysystem.com.br/',
  [string]$GithubOwner = 'danilopx',
  [string]$GithubRepo = 'app_electron_koala'
)

$ErrorActionPreference = 'Stop'

function Write-Info([string]$Message) {
  Write-Host "[release-local] $Message"
}

function Read-GitHubToken {
  if (-not [string]::IsNullOrWhiteSpace($env:GH_TOKEN)) {
    return $env:GH_TOKEN
  }

  if (-not [string]::IsNullOrWhiteSpace($env:GITHUB_TOKEN)) {
    return $env:GITHUB_TOKEN
  }

  $secureToken = Read-Host 'Informe o GitHub token' -AsSecureString
  $plainToken = [System.Net.NetworkCredential]::new('', $secureToken).Password
  if ([string]::IsNullOrWhiteSpace($plainToken)) {
    throw 'GitHub token nao informado.'
  }

  return $plainToken
}

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$env:KOALA_DESKTOP_URL = $DesktopUrl.Trim()
$env:GH_OWNER = $GithubOwner.Trim()
$env:GH_REPO = $GithubRepo.Trim()
$env:GH_TOKEN = Read-GitHubToken

Write-Info "Publicando release desktop para $($env:GH_OWNER)/$($env:GH_REPO)"
& .\scripts\release.ps1 -DesktopUrl $env:KOALA_DESKTOP_URL -PublishToGithub -GithubOwner $env:GH_OWNER -GithubRepo $env:GH_REPO
