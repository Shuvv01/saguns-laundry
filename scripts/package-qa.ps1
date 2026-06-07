param(
  [string]$Destination = "D:\saguns-laundry-qa.zip"
)

$Root = Split-Path -Parent $PSScriptRoot
$Required = @(
  "assets",
  "css",
  "docs",
  "js",
  "views",
  "server.js",
  "package.json",
  "package-lock.json",
  "README.md"
)

$Paths = foreach ($Item in $Required) {
  Join-Path $Root $Item
}

$NodeModules = Join-Path $Root "node_modules"
if (Test-Path -LiteralPath $NodeModules) {
  $Paths += $NodeModules
}

Compress-Archive -Path $Paths -DestinationPath $Destination -Force
Write-Host "Created QA package: $Destination"
