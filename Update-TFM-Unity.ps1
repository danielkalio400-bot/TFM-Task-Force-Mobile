#requires -Version 5.1
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string] $Root,
    [string] $ProjectPath,
    [string] $UnityEditorPath,
    [ValidatePattern('^(main|[a-f0-9]{40})$')][string] $Revision = 'main',
    [string] $SourceRoot,
    [switch] $OpenUnity,
    [switch] $LaunchOnly,
    [switch] $Preview
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$Root = [IO.Path]::GetFullPath($Root)
$selectionFile = Join-Path $Root '.tfm-unity-project.json'

function Get-ProjectPath([string] $Path) {
    if (-not [IO.Path]::IsPathRooted($Path)) { $Path = Join-Path $Root $Path }
    return [IO.Path]::GetFullPath($Path).TrimEnd([char[]]@('/', '\'))
}

function Test-UnityProject([string] $Path) {
    return (Test-Path -LiteralPath (Join-Path $Path 'Assets') -PathType Container) -and
        (Test-Path -LiteralPath (Join-Path $Path 'Packages/manifest.json') -PathType Leaf) -and
        (Test-Path -LiteralPath (Join-Path $Path 'ProjectSettings/ProjectVersion.txt') -PathType Leaf)
}

function Find-UnityEditor {
    if (-not [string]::IsNullOrWhiteSpace($UnityEditorPath)) {
        $editor = [IO.Path]::GetFullPath($UnityEditorPath)
    } else {
        $versionText = Get-Content -LiteralPath (Join-Path $project 'ProjectSettings/ProjectVersion.txt') -Raw
        if ($versionText -notmatch '(?m)^m_EditorVersion:\s*([0-9]+\.[0-9]+\.[0-9]+[a-z][0-9]+)\s*$') {
            throw 'Could not read the Unity Editor version. Pass -UnityEditorPath with the installed Unity.exe path.'
        }
        $version = $Matches[1]
        $programFiles = [Environment]::GetEnvironmentVariable('ProgramFiles')
        if ([string]::IsNullOrWhiteSpace($programFiles)) {
            throw 'Pass -UnityEditorPath with the installed Unity Editor executable path.'
        }
        $editor = Join-Path $programFiles "Unity/Hub/Editor/$version/Editor/Unity.exe"
    }
    if (-not (Test-Path -LiteralPath $editor -PathType Leaf)) {
        throw "Unity Editor not found at $editor. Install this version in Unity Hub or pass -UnityEditorPath."
    }
    return $editor
}

function Open-TrainingProject([string] $Editor) {
    # Specify the project and scene command together so Hub's last-used project
    # cannot redirect the user to an unpopulated nested project.
    Start-Process -FilePath $Editor -ArgumentList @(
        '-projectPath', ('"' + $project + '"'),
        '-executeMethod', 'TFM.Editor.TFMTrainingSceneBuilder.OpenTrainingYard'
    ) | Out-Null
    Write-Host "Opening TFM training yard in: $project"
}

if (-not [string]::IsNullOrWhiteSpace($ProjectPath)) {
    $project = Get-ProjectPath $ProjectPath
} else {
    $project = $null
    if (Test-Path -LiteralPath $selectionFile -PathType Leaf) {
        try { $selection = Get-Content -LiteralPath $selectionFile -Raw | ConvertFrom-Json }
        catch { throw "Could not read $selectionFile. Pass -ProjectPath to choose the project again. No files changed." }
        if ($null -ne $selection -and $null -ne $selection.PSObject.Properties['projectPath'] -and
            -not [string]::IsNullOrWhiteSpace($selection.projectPath)) {
            $savedProject = Get-ProjectPath $selection.projectPath
            if (Test-UnityProject $savedProject) { $project = $savedProject }
        }
    }
    if ($null -eq $project) {
        $candidates = @(
            'GameClient/TFM-Unity',
            'GameClient/TFM-Unity/TFM-Unity',
            'TFM-Unity',
            'TFM-Unity/TFM-Unity'
        ) | ForEach-Object { Get-ProjectPath $_ } | Where-Object { Test-UnityProject $_ }
        $candidates = @($candidates)
        if ($candidates.Count -eq 0) {
            throw 'No Unity project found. Pass -ProjectPath to the folder containing Assets, Packages and ProjectSettings. No files changed.'
        }
        if ($candidates.Count -gt 1) {
            throw ("Multiple Unity projects found. Choose one with -ProjectPath. No files changed.`n" + ($candidates -join "`n"))
        }
        $project = $candidates[0]
    }
}
if (-not (Test-UnityProject $project)) {
    throw "Unity project not found at $project. Expected Assets, Packages/manifest.json and ProjectSettings/ProjectVersion.txt. No files changed."
}
$assets = Join-Path $project 'Assets'
Write-Host "Selected Unity project: $project"

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

if ($Preview) {
    Write-Host 'PREVIEW: No files changed and Unity was not opened.'
    Write-Host "Would install $($required.Count) C# scripts into $(Join-Path $assets '_TFM') and remember this project for Open-TFM-Unity.ps1."
    return
}

$editor = $null
if ($OpenUnity -or $LaunchOnly) { $editor = Find-UnityEditor }
if ($LaunchOnly) {
    foreach ($relative in $required) {
        if (-not (Test-Path -LiteralPath (Join-Path (Join-Path $assets '_TFM') $relative) -PathType Leaf)) {
            throw "TFM scripts are missing from $project. Run Update-TFM-Unity.ps1 for this project first."
        }
    }
    Open-TrainingProject $editor
    return
}

$tooling = @('Update-TFM-Unity.ps1', 'Open-TFM-Unity.ps1', 'Import-TFM-StarterAssets.ps1', 'TFM-Create-Project.ps1')
$sourceFiles = @($required | ForEach-Object { 'GameClient/StarterAssets/Assets/_TFM/' + $_ }) + $tooling
if ([string]::IsNullOrWhiteSpace($SourceRoot)) {
    $download = Join-Path ([IO.Path]::GetTempPath()) ('tfm-update-' + [guid]::NewGuid().ToString('N'))
    [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
    $SourceRoot = $download
    # Use the same host as the updater itself; GitHub ZIPs redirect to codeload,
    # which is not resolvable on some user networks. Stage all files before copying.
    foreach ($relative in $sourceFiles) {
        $destination = Join-Path $SourceRoot $relative
        New-Item -ItemType Directory -Path (Split-Path -Parent $destination) -Force | Out-Null
        $uri = "https://raw.githubusercontent.com/danielkalio400-bot/TFM-Task-Force-Mobile/$Revision/$relative"
        Write-Host "Downloading $relative"
        try {
            Invoke-WebRequest -UseBasicParsing -Uri $uri -OutFile $destination -TimeoutSec 60
        } catch {
            throw "Could not download $relative from raw.githubusercontent.com. No project files changed. $($_.Exception.Message)"
        }
    }
}

$source = Join-Path $SourceRoot 'GameClient/StarterAssets/Assets/_TFM'
foreach ($relative in $sourceFiles) {
    $sourceFile = Join-Path $SourceRoot $relative
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
$files = @()
foreach ($kind in $targets.Keys) {
    foreach ($relative in $required) {
        $files += [pscustomobject]@{
            Source = Join-Path $source $relative
            Target = Join-Path $targets[$kind] $relative
            Backup = Join-Path (Join-Path $backup $kind) $relative
        }
    }
}
foreach ($relative in $tooling) {
    $files += [pscustomobject]@{
        Source = Join-Path $SourceRoot $relative
        Target = Join-Path $Root $relative
        Backup = Join-Path (Join-Path $backup 'tools') $relative
    }
}
foreach ($file in $files) {
    $exists = Test-Path -LiteralPath $file.Target -PathType Leaf
    if ($exists -and (Get-FileHash -LiteralPath $file.Source).Hash -eq (Get-FileHash -LiteralPath $file.Target).Hash) { continue }
    if ($exists) {
        New-Item -ItemType Directory -Path (Split-Path -Parent $file.Backup) -Force | Out-Null
        Copy-Item -LiteralPath $file.Target -Destination $file.Backup
    }
    $changes += $file
}

# The download is complete before any script changes. Close Unity while updating
# to prevent compilation of a partially copied set of scripts.
foreach ($change in $changes) {
    New-Item -ItemType Directory -Path (Split-Path -Parent $change.Target) -Force | Out-Null
    Copy-Item -LiteralPath $change.Source -Destination $change.Target -Force
}
foreach ($file in $files) {
    if ((Get-FileHash -LiteralPath $file.Source).Hash -ne
        (Get-FileHash -LiteralPath $file.Target).Hash) {
        throw "Verification failed for $($file.Target)"
    }
}

# Remember the project only after installation succeeds.
$selectionJson = @{ projectPath = $project } | ConvertTo-Json
if (-not (Test-Path -LiteralPath $selectionFile) -or
    (Get-Content -LiteralPath $selectionFile -Raw).Trim() -ne $selectionJson.Trim()) {
    if (Test-Path -LiteralPath $selectionFile) {
        New-Item -ItemType Directory -Path $backup -Force | Out-Null
        Copy-Item -LiteralPath $selectionFile -Destination (Join-Path $backup '.tfm-unity-project.json')
    }
    Set-Content -LiteralPath $selectionFile -Value $selectionJson -Encoding UTF8
}
Write-Host "Verified $($required.Count) Unity C# scripts. Changed $($changes.Count) files."
if (Test-Path -LiteralPath $backup) { Write-Host "Previous scripts backed up at: $backup" }
Write-Host "Open Unity project: $project"
Write-Host 'Unity will create the training scene on first import. Use TFM > Open Training Yard, then press Play.'
Write-Host "Next time, run: powershell -ExecutionPolicy Bypass -File `"$(Join-Path $Root 'Open-TFM-Unity.ps1')`""

if ($OpenUnity) { Open-TrainingProject $editor }
