#requires -Version 5.1
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string] $Root,
    [ValidatePattern('^(main|[a-f0-9]{40})$')][string] $Revision = 'main',
    [string] $SourceRoot,
    [switch] $OpenUnity
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$Root = [IO.Path]::GetFullPath($Root)
$project = Join-Path $Root 'GameClient/TFM-Unity'
$assets = Join-Path $project 'Assets'
$manifest = Join-Path $project 'Packages/manifest.json'
if (-not (Test-Path -LiteralPath $manifest -PathType Leaf) -or
    -not (Test-Path -LiteralPath $assets -PathType Container)) {
    throw "Unity project not found at $project. No files changed."
}

$required = @(
    'Core/Bootstrap/TFMStartup.cs',
    'Core/Configuration/TFMModeCatalog.cs',
    'Gameplay/Combat/TFMHitscanWeapon.cs',
    'Gameplay/Combat/TFMTargetDummy.cs',
    'Gameplay/Prototype/TFMPrototypeBootstrap.cs',
    'Player/Camera/TFMThirdPersonCamera.cs',
    'Player/Controls/TFMPlayerInput.cs',
    'Player/Movement/TFMThirdPersonMotor.cs',
    'UI/HUD/TFMPrototypeHud.cs',
    'Editor/TFMTrainingSceneBuilder.cs'
)

if ([string]::IsNullOrWhiteSpace($SourceRoot)) {
    $download = Join-Path ([IO.Path]::GetTempPath()) ('tfm-update-' + [guid]::NewGuid().ToString('N'))
    [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
    $SourceRoot = $download
    $stagedSource = Join-Path $SourceRoot 'GameClient/StarterAssets/Assets/_TFM'
    # Use the same host as the updater itself; GitHub ZIPs redirect to codeload,
    # which is not resolvable on some user networks. Stage all files before copying.
    foreach ($relative in $required) {
        $destination = Join-Path $stagedSource $relative
        New-Item -ItemType Directory -Path (Split-Path -Parent $destination) -Force | Out-Null
        $uri = "https://raw.githubusercontent.com/danielkalio400-bot/TFM-Task-Force-Mobile/$Revision/GameClient/StarterAssets/Assets/_TFM/$relative"
        Write-Host "Downloading $relative"
        try {
            Invoke-WebRequest -UseBasicParsing -Uri $uri -OutFile $destination -TimeoutSec 60
        } catch {
            throw "Could not download $relative from raw.githubusercontent.com. No project files changed. $($_.Exception.Message)"
        }
    }
}

$source = Join-Path $SourceRoot 'GameClient/StarterAssets/Assets/_TFM'
foreach ($relative in $required) {
    $sourceFile = Join-Path $source $relative
    if (-not (Test-Path -LiteralPath $sourceFile -PathType Leaf) -or
        (Get-Item -LiteralPath $sourceFile).Length -eq 0) {
        throw "Incomplete source download: $relative is missing. No project files changed."
    }
}

$backup = Join-Path $Root ('backups/unity-update-' + [guid]::NewGuid().ToString('N'))
$targets = @{
    'starter' = Join-Path $Root 'GameClient/StarterAssets/Assets/_TFM'
    'unity' = Join-Path $assets '_TFM'
}

# Inspect and back up every file that would change before replacing any script.
$changes = @()
foreach ($kind in $targets.Keys) {
    foreach ($relative in $required) {
        $from = Join-Path $source $relative
        $to = Join-Path $targets[$kind] $relative
        $exists = Test-Path -LiteralPath $to -PathType Leaf
        if ($exists -and (Get-FileHash -LiteralPath $from).Hash -eq (Get-FileHash -LiteralPath $to).Hash) { continue }
        if ($exists) {
            $saved = Join-Path (Join-Path $backup $kind) $relative
            New-Item -ItemType Directory -Path (Split-Path -Parent $saved) -Force | Out-Null
            Copy-Item -LiteralPath $to -Destination $saved
        }
        $changes += [pscustomobject]@{ Source = $from; Target = $to }
    }
}

# The download is complete before any script changes. Close Unity while updating
# to prevent compilation of a partially copied set of scripts.
foreach ($change in $changes) {
    New-Item -ItemType Directory -Path (Split-Path -Parent $change.Target) -Force | Out-Null
    Copy-Item -LiteralPath $change.Source -Destination $change.Target -Force
}
foreach ($relative in $required) {
    $installed = Join-Path $targets['unity'] $relative
    if ((Get-FileHash -LiteralPath (Join-Path $source $relative)).Hash -ne
        (Get-FileHash -LiteralPath $installed).Hash) {
        throw "Verification failed for $installed"
    }
}

Write-Host "Verified $($required.Count) Unity C# scripts. Changed $($changes.Count) files."
if (Test-Path -LiteralPath $backup) { Write-Host "Previous scripts backed up at: $backup" }
Write-Host "Open Unity project: $project"
Write-Host 'Unity will create the training scene on first import. Use TFM > Open Training Yard, then press Play.'

if ($OpenUnity) {
    $versionFile = Join-Path $project 'ProjectSettings/ProjectVersion.txt'
    $version = ''
    if (Test-Path -LiteralPath $versionFile) {
        $versionText = Get-Content -LiteralPath $versionFile -Raw
        if ($versionText -match '(?m)^m_EditorVersion:\s*(\S+)') { $version = $Matches[1] }
    }
    $programFiles = [Environment]::GetEnvironmentVariable('ProgramFiles')
    if (-not [string]::IsNullOrWhiteSpace($programFiles) -and $version -match '^6000\.[0-9a-z.]+$') {
        $editor = Join-Path $programFiles "Unity/Hub/Editor/$version/Editor/Unity.exe"
        if (Test-Path -LiteralPath $editor -PathType Leaf) {
            Start-Process -FilePath $editor -ArgumentList @('-projectPath', ('"' + $project + '"'))
        } else {
            Write-Host "Unity $version is installed outside the standard Hub location. Open the project using Unity Hub."
        }
    } else {
        Write-Host 'Open this project using Unity Hub to finish scene generation.'
    }
}
