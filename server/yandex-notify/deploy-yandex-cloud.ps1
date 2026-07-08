param(
  [string]$FunctionName = "hram-notify",
  [string]$Runtime = "nodejs22",
  [int]$MemoryMb = 128,
  [string]$ExecutionTimeout = "10s",
  [string]$EnvFile = ".\yandex-cloud.env"
)

$ErrorActionPreference = "Stop"

if (!(Get-Command yc -ErrorAction SilentlyContinue)) {
  throw "Yandex Cloud CLI 'yc' is not installed or not in PATH. Install it and run 'yc init' first."
}

$functionRoot = Resolve-Path $PSScriptRoot
$envPath = Resolve-Path (Join-Path $functionRoot $EnvFile)
$repoRoot = Resolve-Path (Join-Path $functionRoot "..\..")
$outputDir = Join-Path $repoRoot "output"
$packageDir = Join-Path $outputDir "yandex-notify-package"
$archive = Join-Path $outputDir "yandex-notify-function.zip"

Set-Location $functionRoot

if (Test-Path $packageDir) {
  Remove-Item -LiteralPath $packageDir -Recurse -Force
}

if (!(Test-Path $outputDir)) {
  New-Item -ItemType Directory -Path $outputDir | Out-Null
}

New-Item -ItemType Directory -Path $packageDir | Out-Null

$filesToPackage = @(
  "index.js",
  "package.json",
  "package-lock.json"
)

foreach ($fileName in $filesToPackage) {
  Copy-Item -LiteralPath (Join-Path $functionRoot $fileName) -Destination $packageDir
}

if (Test-Path $archive) {
  Remove-Item -LiteralPath $archive -Force
}

Compress-Archive -Path (Join-Path $packageDir "*") -DestinationPath $archive -Force

$existing = yc serverless function get $FunctionName --format json 2>$null
if (!$existing) {
  yc serverless function create --name $FunctionName | Out-Host
}

$environmentArgs = @()
Get-Content $envPath | ForEach-Object {
  $line = $_.Trim()
  if (!$line -or $line.StartsWith("#")) {
    return
  }

  $environmentArgs += "--environment"
  $environmentArgs += $line
}

yc serverless function version create `
  --function-name $FunctionName `
  --runtime $Runtime `
  --entrypoint index.handler `
  --memory $MemoryMb `
  --execution-timeout $ExecutionTimeout `
  --source-path $archive `
  @environmentArgs | Out-Host

yc serverless function allow-unauthenticated-invoke $FunctionName | Out-Host

$function = yc serverless function get $FunctionName --format json | ConvertFrom-Json
$endpoint = "https://functions.yandexcloud.net/$($function.id)"

Write-Host ""
Write-Host "Yandex Cloud Function endpoint:"
Write-Host $endpoint
