param(
  [string]$Endpoint = "https://www.xn----7sbbbgbecqaa9a4adj1anib2bzn.xn--p1ai/api/notify.php",
  [string]$ArchiveName = "timeweb-hosting-site.zip"
)

$ErrorActionPreference = "Stop"

function Assert-ChildPath {
  param(
    [string]$Path,
    [string]$Parent
  )

  $parentFull = [System.IO.Path]::GetFullPath($Parent).TrimEnd('\')
  $pathFull = [System.IO.Path]::GetFullPath($Path)

  if (!$pathFull.StartsWith($parentFull + '\', [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to operate outside expected directory: $pathFull"
  }
}

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$outputDir = Join-Path $root "output"
$packageDir = Join-Path $outputDir "timeweb-hosting-site"
$archive = Join-Path $outputDir $ArchiveName
$notifySourceDir = Join-Path $root "server\timeweb-notify"

Set-Location $root

$env:VITE_ORDER_ENDPOINT = $Endpoint
npm run build

if (!(Test-Path $outputDir)) {
  New-Item -ItemType Directory -Path $outputDir | Out-Null
}

Assert-ChildPath -Path $packageDir -Parent $outputDir

if (Test-Path $packageDir) {
  Remove-Item -LiteralPath $packageDir -Recurse -Force
}

New-Item -ItemType Directory -Path $packageDir | Out-Null
Copy-Item -Path (Join-Path $root "dist\*") -Destination $packageDir -Recurse -Force

$apiDir = Join-Path $packageDir "api"
New-Item -ItemType Directory -Path $apiDir | Out-Null
Copy-Item -LiteralPath (Join-Path $notifySourceDir "notify.php") -Destination (Join-Path $apiDir "notify.php")
Copy-Item -LiteralPath (Join-Path $notifySourceDir "config.example.php") -Destination (Join-Path $apiDir "config.example.php")

if (Test-Path $archive) {
  Remove-Item -LiteralPath $archive -Force
}

Compress-Archive -Path (Join-Path $packageDir "*") -DestinationPath $archive -Force

$assetFiles = Get-ChildItem -Path (Join-Path $packageDir "assets") -Filter "*.js" -ErrorAction SilentlyContinue
$assetText = ($assetFiles | ForEach-Object { Get-Content -Raw $_.FullName }) -join "`n"

if (!$assetText.Contains($Endpoint)) {
  throw "Built assets do not contain expected endpoint: $Endpoint"
}

Write-Host ""
Write-Host "Timeweb hosting archive ready:"
Write-Host $archive
Write-Host ""
Write-Host "Upload archive contents to the Timeweb site root."
Write-Host "Notification endpoint embedded in frontend:"
Write-Host $Endpoint
Write-Host ""
Write-Host "After upload, create api/config.php from api/config.example.php and fill secrets on hosting."
