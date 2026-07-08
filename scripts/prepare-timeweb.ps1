param(
  [string]$ExpectedEndpoint = ""
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$outputDir = Join-Path $root "output"
$archive = Join-Path $outputDir "timeweb-site.zip"

Set-Location $root

if ($ExpectedEndpoint) {
  $env:VITE_ORDER_ENDPOINT = $ExpectedEndpoint
}

npm run build

if (!(Test-Path $outputDir)) {
  New-Item -ItemType Directory -Path $outputDir | Out-Null
}

if (Test-Path $archive) {
  Remove-Item -LiteralPath $archive -Force
}

Compress-Archive -Path (Join-Path $root "dist\*") -DestinationPath $archive -Force

$assetFiles = Get-ChildItem -Path (Join-Path $root "dist\assets") -Filter "*.js" -ErrorAction SilentlyContinue
$assetText = ($assetFiles | ForEach-Object { Get-Content -Raw $_.FullName }) -join "`n"

$detectedEndpoint = ""
if ($ExpectedEndpoint -and $assetText.Contains($ExpectedEndpoint)) {
  $detectedEndpoint = $ExpectedEndpoint
} else {
  $patterns = @(
    "https://functions\.yandexcloud\.net/[A-Za-z0-9_-]+",
    "https://[^'\""`, ]+\.vercel\.app/api/notify",
    "https?://127\.0\.0\.1:8787",
    "https?://localhost:8787"
  )

  foreach ($pattern in $patterns) {
    $match = [regex]::Match($assetText, $pattern)
    if ($match.Success) {
      $detectedEndpoint = $match.Value
      break
    }
  }
}

Write-Host ""
Write-Host "Timeweb archive ready:"
Write-Host $archive

if ($detectedEndpoint) {
  Write-Host ""
  Write-Host "Embedded notification endpoint:"
  Write-Host $detectedEndpoint
} else {
  Write-Warning "Notification endpoint was not found in the built assets. Check VITE_ORDER_ENDPOINT before uploading to Timeweb."
}

if ($ExpectedEndpoint -and $detectedEndpoint -and $detectedEndpoint -ne $ExpectedEndpoint) {
  throw "Built endpoint '$detectedEndpoint' does not match expected '$ExpectedEndpoint'."
}
