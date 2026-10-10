#requires -Version 5.1
[CmdletBinding()]
param([string] $Root, [switch] $Preview)
$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($Root)) {
    $Root = $PSScriptRoot
}
if ([string]::IsNullOrWhiteSpace($Root) -and -not [string]::IsNullOrWhiteSpace($MyInvocation.MyCommand.Path)) {
    $Root = Split-Path -Parent $MyInvocation.MyCommand.Path
}
if ([string]::IsNullOrWhiteSpace($Root)) {
    throw 'Could not determine the TFM repository root. Pass it explicitly with -Root.'
}
$Root = [System.IO.Path]::GetFullPath($Root)

$source = Join-Path $Root 'GameClient\StarterAssets\Assets\_TFM'
$unityAssets = Join-Path $Root 'GameClient\TFM-Unity\Assets'
$target = Join-Path $unityAssets '_TFM'
if (-not (Test-Path -LiteralPath $source -PathType Container)) { throw 'Starter Assets source was not found.' }
if (-not (Test-Path -LiteralPath (Join-Path $Root 'GameClient\TFM-Unity\Packages\manifest.json'))) {
    throw 'Create a Universal 3D project in Unity Hub at GameClient/TFM-Unity first.'
}
if (Test-Path -LiteralPath $target) {
    throw 'TFM assets already exist in Unity. Refusing to overwrite. Merge any updates manually.'
}
if ($Preview) {
    Write-Host "PREVIEW: Would copy $source to $target"
} else {
    Copy-Item -LiteralPath $source -Destination $target -Recurse
    Write-Host 'Imported TFM StarterAssets. Open your Unity project to compile scripts.'
}
