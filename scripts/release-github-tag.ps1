param(
  [string]$Version,
  [string]$GitHubOwner,
  [string]$GitHubRepo,
  [string]$GitHubToken
)

$ErrorActionPreference = 'Stop'

function Write-Info([string]$Message) {
  Write-Host "[release-github-tag] $Message"
}

function Get-PackageVersion {
  $packagePath = Join-Path (Split-Path -Parent $PSScriptRoot) 'package.json'
  $json = Get-Content -LiteralPath $packagePath -Raw | ConvertFrom-Json
  return [string]$json.version
}

function Import-ReleaseEnv {
  $envPath = Join-Path $PSScriptRoot 'release.env.ps1'
  if (Test-Path -LiteralPath $envPath) {
    . $envPath
  }
}

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot
Import-ReleaseEnv

$githubOwner = if (-not [string]::IsNullOrWhiteSpace($GitHubOwner)) { $GitHubOwner.Trim() } elseif (-not [string]::IsNullOrWhiteSpace($env:GH_OWNER)) { $env:GH_OWNER.Trim() } else { 'danilopx' }
$githubRepo = if (-not [string]::IsNullOrWhiteSpace($GitHubRepo)) { $GitHubRepo.Trim() } elseif (-not [string]::IsNullOrWhiteSpace($env:GH_REPO)) { $env:GH_REPO.Trim() } else { 'app_electron_koala' }
$githubToken = if (-not [string]::IsNullOrWhiteSpace($GitHubToken)) { $GitHubToken.Trim() } elseif (-not [string]::IsNullOrWhiteSpace($env:GH_TOKEN)) { $env:GH_TOKEN.Trim() } elseif (-not [string]::IsNullOrWhiteSpace($env:GITHUB_TOKEN)) { $env:GITHUB_TOKEN.Trim() } else { '' }

$githubRemoteName = 'koala-github-release'
$githubRemoteUrl = "https://x-access-token:$githubToken@github.com/$githubOwner/$githubRepo.git"

$resolvedVersion = if ([string]::IsNullOrWhiteSpace($Version)) { Get-PackageVersion } else { $Version.Trim() }
if ([string]::IsNullOrWhiteSpace($resolvedVersion)) {
  throw 'Versao invalida para criar a tag.'
}

$tagName = if ($resolvedVersion.StartsWith('v')) { $resolvedVersion } else { "v$resolvedVersion" }

Write-Info "Versao alvo: $tagName"

$cleanStatus = git status --porcelain
if ($LASTEXITCODE -ne 0) {
  throw 'Falha ao consultar o status do git.'
}

if ($cleanStatus) {
  Write-Info 'Repositorio possui alteracoes locais. A tag sera criada com o commit atual.'
}

Write-Info "Criando tag $tagName"
git tag -f $tagName
if ($LASTEXITCODE -ne 0) {
  throw "Falha ao criar a tag $tagName."
}

if ([string]::IsNullOrWhiteSpace($githubToken)) {
  throw 'GitHub token nao informado. Defina GH_TOKEN ou GITHUB_TOKEN.'
}

Write-Info "Configurando remoto temporario do GitHub para $githubOwner/$githubRepo"
git remote add $githubRemoteName $githubRemoteUrl
if ($LASTEXITCODE -ne 0) {
  throw 'Falha ao configurar o remoto do GitHub.'
}

try {
  Write-Info "Enviando tag $tagName para o GitHub"
  git push $githubRemoteName $tagName --force
  if ($LASTEXITCODE -ne 0) {
    throw "Falha ao publicar a tag $tagName."
  }
} finally {
  try {
    git remote remove $githubRemoteName | Out-Null
  } catch {
    Write-Info "Nao foi possivel remover o remoto temporario $githubRemoteName."
  }
}

Write-Info 'Tag publicada. O GitHub Actions deve iniciar o build Windows + Linux automaticamente.'
