#requires -Version 5.1
[CmdletBinding()]
param(
    [string] $Root = 'C:\Users\danie\bazaara\TFM-Task-Force-Mobile',
    [string] $ProjectPath,
    [string] $UnityEditorPath
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$Root = [IO.Path]::GetFullPath($Root)
if (-not $ProjectPath) {
    $ProjectPath = Join-Path $Root 'GameClient\TFM-Unity\TFM-Unity'
}
$ProjectPath = [IO.Path]::GetFullPath($ProjectPath)
if (-not (Test-Path -LiteralPath (Join-Path $ProjectPath 'ProjectSettings\ProjectVersion.txt'))) {
    throw "Unity 6 project not found: $ProjectPath"
}

if (Get-Process -Name 'Unity' -ErrorAction SilentlyContinue) {
    throw 'Save the TFM Unity scene and close the Unity Editor before automated world creation.'
}

$versionText = Get-Content -LiteralPath (Join-Path $ProjectPath 'ProjectSettings\ProjectVersion.txt') -Raw
if (-not $UnityEditorPath) {
    if ($versionText -notmatch '(?m)^m_EditorVersion:\s*(\S+)') {
        throw 'Project Unity version missing.'
    }
    $UnityEditorPath = Join-Path $env:ProgramFiles "Unity\Hub\Editor\$($Matches[1])\Editor\Unity.exe"
}
if (-not (Test-Path -LiteralPath $UnityEditorPath)) {
    throw "Unity Editor not installed at $UnityEditorPath"
}

# Download only the canonical source updater, not an untrusted ZIP or an art backup.
$updater = Join-Path $env:TEMP 'TFM-Unity-Updater.ps1'
$uri = 'https://raw.githubusercontent.com/danielkalio400-bot/TFM-Task-Force-Mobile/main/Update-TFM-Unity.ps1'
Invoke-WebRequest -UseBasicParsing -Uri $uri -OutFile $updater -TimeoutSec 90
Write-Host '[1/3] Checking canonical Unity source without overwriting local changes...'
& $updater -Root $Root -ProjectPath $ProjectPath -DownloadLatest -Preview
if (-not $?) { throw 'TFM Unity source preview failed.' }

Write-Host '[2/3] Installing safe canonical source changes...'
& $updater -Root $Root -ProjectPath $ProjectPath -DownloadLatest
if (-not $?) { throw 'TFM Unity source install failed.' }

Write-Host '[3/3] Building the authored District 01 scene in Unity...'
$log = Join-Path $env:TEMP 'TFM-District01-Build.log'
if (Test-Path -LiteralPath $log) { Remove-Item -LiteralPath $log }
$arguments = @(
    '-batchmode',
    '-quit',
    '-projectPath', ('"' + $ProjectPath + '"'),
    '-executeMethod', 'TFM.Editor.TFMDistrictWorldBuilder.BuildDistrictBatch',
    '-logFile', ('"' + $log + '"')
)
$process = Start-Process -FilePath $UnityEditorPath -ArgumentList $arguments -PassThru -Wait
$scene = Join-Path $ProjectPath 'Assets\_TFM\Scenes\TFMDistrict01.unity'
if ($process.ExitCode -ne 0 -or -not (Test-Path -LiteralPath $scene)) {
    Write-Host 'TFM world builder log:'
    if (Test-Path -LiteralPath $log) {
        Get-Content -LiteralPath $log -Tail 80
    }
    throw "Unity world build failed, exit code $($process.ExitCode)."
}

# A zero exit code alone is not sufficient; also require the Unity completion marker.
$marker = Select-String -LiteralPath $log -Pattern 'TFM_DISTRICT_BUILD_RESULT=SUCCESS' -SimpleMatch
if (-not $marker) {
    if (Test-Path -LiteralPath $log) { Get-Content -LiteralPath $log -Tail 50 }
    throw 'Unity did not confirm creation of the district scene.'
}
Write-Host 'TFM DISTRICT 01 CREATED IN UNITY'
Write-Host "Scene: $scene"
Write-Host "Original URP textures/materials: $(Join-Path $ProjectPath 'Assets\_TFM\Worlds\District01')"
Write-Host 'Your imported character and animation files remain in the original Unity project.'
