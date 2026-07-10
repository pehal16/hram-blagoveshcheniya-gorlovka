param(
  [string]$ArchiveName = "timeweb-notify-php.zip"
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$sourceDir = Join-Path $root "server\timeweb-notify"
$outputDir = Join-Path $root "output"
$packageDir = Join-Path $outputDir "timeweb-notify-php"
$archive = Join-Path $outputDir $ArchiveName

if (!(Test-Path $outputDir)) {
  New-Item -ItemType Directory -Path $outputDir | Out-Null
}

if (Test-Path $packageDir) {
  Remove-Item -LiteralPath $packageDir -Recurse -Force
}

New-Item -ItemType Directory -Path $packageDir | Out-Null

Copy-Item -LiteralPath (Join-Path $sourceDir "notify.php") -Destination $packageDir
Copy-Item -LiteralPath (Join-Path $sourceDir "config.example.php") -Destination $packageDir

if (Test-Path $archive) {
  Remove-Item -LiteralPath $archive -Force
}

Compress-Archive -Path (Join-Path $packageDir "*") -DestinationPath $archive -Force

Write-Host "Timeweb PHP notify archive ready:"
Write-Host $archive
