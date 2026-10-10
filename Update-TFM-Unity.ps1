#requires -Version 5.1
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string] $Root,
    [string] $ProjectPath,
    [string] $UnityEditorPath,
    [ValidatePattern('^(main|[a-f0-9]{40})$')][string] $Revision = 'main',
    [string] $SourceRoot,
    [switch] $DownloadLatest,
    [switch] $ForceManagedOverwrite,
    [switch] $OpenUnity,
    [switch] $LaunchOnly,
    [switch] $Preview
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$Root = [IO.Path]::GetFullPath($Root)
$selectionFile = Join-Path $Root '.tfm-unity-project.json'
$manifestRelative = 'GameClient/StarterAssets/Assets/_TFM/TFM-Source-Manifest.txt'
$stage = $null

function Resolve-Project([string] $candidate) {
    if (-not [IO.Path]::IsPathRooted($candidate)) { $candidate = Join-Path $Root $candidate }
    return [IO.Path]::GetFullPath($candidate).TrimEnd([char[]]@('/', '\\'))
}
function Test-Project([string] $folder) {
    return (Test-Path -LiteralPath (Join-Path $folder 'Assets') -PathType Container) -and
           (Test-Path -LiteralPath (Join-Path $folder 'Packages/manifest.json') -PathType Leaf) -and
           (Test-Path -LiteralPath (Join-Path $folder 'ProjectSettings/ProjectVersion.txt') -PathType Leaf)
}
function Find-Editor {
    if ($UnityEditorPath) { $editor = [IO.Path]::GetFullPath($UnityEditorPath) }
    else {
        $versionFile = Join-Path $project 'ProjectSettings/ProjectVersion.txt'
        $value = Get-Content -LiteralPath $versionFile -Raw
        if ($value -notmatch '(?m)^m_EditorVersion:\\s*([0-9]+\\.[0-9]+\\.[0-9]+[a-z][0-9]+)') {
            throw 'Unity editor version unknown. Supply -UnityEditorPath.'
        }
        $programFiles = [Environment]::GetEnvironmentVariable('ProgramFiles')
        if (-not $programFiles) { throw 'Supply -UnityEditorPath.' }
        $editor = Join-Path $programFiles "Unity/Hub/Editor/$($Matches[1])/Editor/Unity.exe"
    }
    if (-not (Test-Path -LiteralPath $editor -PathType Leaf)) {
        throw "Unity Editor not found: $editor"
    }
    return $editor
}
function Launch-Project([string] $editor) {
    Start-Process -FilePath $editor -ArgumentList @(
        '-projectPath', ('"' + $project + '"'),
        '-executeMethod', 'TFM.Editor.TFMTrainingSceneBuilder.OpenTrainingYard'
    ) | Out-Null
    Write-Host "Opening the actual Unity project: $project"
}
function Parse-Manifest([string] $path) {
    $names = @(Get-Content -LiteralPath $path | ForEach-Object { $_.Trim() } |
        Where-Object { $_ -and -not $_.StartsWith('#') })
    if ($names.Count -eq 0) { throw "Empty source manifest: $path" }
    $seen = @{}
    foreach ($name in $names) {
        if ($name -notmatch '^[a-zA-Z0-9_.\\/-]+\\.cs$' -or
            $name -match '(^|[\\/])\\.\\.([\\/]|$)' -or $seen.ContainsKey($name)) {
            throw "Invalid or repeated source path in manifest: $name"
        }
        $seen[$name] = $true
    }
    return ,$names
}

if ($ProjectPath) { $project = Resolve-Project $ProjectPath }
else {
    $project = $null
    if (Test-Path -LiteralPath $selectionFile -PathType Leaf) {
        try {
            $settings = Get-Content -LiteralPath $selectionFile -Raw | ConvertFrom-Json
            if ($settings.projectPath -and (Test-Project (Resolve-Project $settings.projectPath))) {
                $project = Resolve-Project $settings.projectPath
            }
        } catch { throw "Unreadable Unity project selection; provide -ProjectPath. $($_.Exception.Message)" }
    }
    if (-not $project) {
        $available = @('GameClient/TFM-Unity','GameClient/TFM-Unity/TFM-Unity',
            'TFM-Unity','TFM-Unity/TFM-Unity') |
            ForEach-Object { Resolve-Project $_ } |
            Where-Object { Test-Project $_ }
        $available = @($available | Select-Object -Unique)
        if ($available.Count -ne 1) {
            throw "Expected one Unity project; found $($available.Count). Specify -ProjectPath."
        }
        $project = $available[0]
    }
}
if (-not (Test-Project $project)) { throw "Not a Unity project: $project" }
if ($project -match '[\\/]bazaara-platform[\\/]') { throw 'TFM must not write into Bazaara platform.' }
Write-Host "Selected Unity project: $project"

if ($LaunchOnly) {
    $editor = Find-Editor
    Launch-Project $editor
    return
}

if ($SourceRoot -and $DownloadLatest) { throw 'Specify either -SourceRoot or -DownloadLatest.' }

try {
    if ($DownloadLatest -or (-not $SourceRoot -and
        -not (Test-Path -LiteralPath (Join-Path $Root $manifestRelative) -PathType Leaf))) {
        $stage = Join-Path ([IO.Path]::GetTempPath()) ('tfm-stage-' + [guid]::NewGuid().ToString('N'))
        New-Item -ItemType Directory -Path $stage -Force | Out-Null
        $SourceRoot = $stage
        [Net.ServicePointManager]::SecurityProtocol =
            [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12

        $manifestFile = Join-Path $stage $manifestRelative
        New-Item -ItemType Directory -Path (Split-Path -Parent $manifestFile) -Force | Out-Null
        $uri = "https://raw.githubusercontent.com/danielkalio400-bot/TFM-Task-Force-Mobile/$Revision/$manifestRelative"
        Invoke-WebRequest -UseBasicParsing -Uri $uri -OutFile $manifestFile -TimeoutSec 60
        $names = @(Parse-Manifest $manifestFile)
        foreach ($name in $names) {
            $relative = 'GameClient/StarterAssets/Assets/_TFM/' + $name
            $destination = Join-Path $stage $relative
            New-Item -ItemType Directory -Path (Split-Path -Parent $destination) -Force | Out-Null
            $uri = "https://raw.githubusercontent.com/danielkalio400-bot/TFM-Task-Force-Mobile/$Revision/$relative"
            Invoke-WebRequest -UseBasicParsing -Uri $uri -OutFile $destination -TimeoutSec 60
        }
    } else {
        if (-not $SourceRoot) { $SourceRoot = $Root }
        $SourceRoot = [IO.Path]::GetFullPath($SourceRoot)
        $names = @(Parse-Manifest (Join-Path $SourceRoot $manifestRelative))
    }

    $assetsSource = Join-Path $SourceRoot 'GameClient/StarterAssets/Assets/_TFM'
    $assetsTarget = Join-Path $project 'Assets/_TFM'
    $statePath = Join-Path $project 'ProjectSettings/TFMSourceHashes.json'

    $known = @{}
    if (Test-Path -LiteralPath $statePath -PathType Leaf) {
        $state = Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
        if ($null -eq $state -or $state.version -ne 1) { throw "Unknown import state: $statePath" }
        foreach ($property in $state.hashes.PSObject.Properties) {
            $known[$property.Name] = [string]$property.Value
        }
    }

    # Verify EVERY input and check local edits before any project scripts change.
    # No backup/, ZIP copy, .bak or snapshot folder is created.
    $entries = @()
    $conflicts = @()
    foreach ($name in $names) {
        $src = Join-Path $assetsSource $name
        $dest = Join-Path $assetsTarget $name
        if (-not (Test-Path -LiteralPath $src -PathType Leaf)) {
            throw "Missing source: $src. No project files changed."
        }
        $sourceHash = (Get-FileHash -LiteralPath $src -Algorithm SHA256).Hash
        $existingHash = $null
        if (Test-Path -LiteralPath $dest -PathType Leaf) {
            $existingHash = (Get-FileHash -LiteralPath $dest -Algorithm SHA256).Hash
            if ($existingHash -ne $sourceHash -and -not $ForceManagedOverwrite -and
                (-not $known.ContainsKey($name) -or $known[$name] -ne $existingHash)) {
                $conflicts += $name
            }
        }
        $entries += [pscustomobject]@{
            Name = $name; Source = $src; Target = $dest
            Hash = $sourceHash; Existing = $existingHash
        }
    }
    if ($conflicts.Count -gt 0) {
        throw ("Refusing to overwrite $($conflicts.Count) locally modified or untracked Unity scripts. " +
            "Commit local edits first, inspect the differences, then use -ForceManagedOverwrite only if appropriate: " +
            ($conflicts -join ', '))
    }

    $changes = @($entries | Where-Object { $_.Hash -ne $_.Existing })
    if ($Preview) {
        Write-Host "PREVIEW: manifest scripts $($names.Count), changes $($changes.Count), no project files written."
        return
    }

    if ($OpenUnity) { $editor = Find-Editor }
    foreach ($entry in $changes) {
        New-Item -ItemType Directory -Path (Split-Path -Parent $entry.Target) -Force | Out-Null
        Copy-Item -LiteralPath $entry.Source -Destination $entry.Target -Force
        if ((Get-FileHash -LiteralPath $entry.Target -Algorithm SHA256).Hash -ne $entry.Hash) {
            throw "Verification failed for $($entry.Name). Review Unity project state before retrying."
        }
    }
    $hashes = @{}
    foreach ($entry in $entries) { $hashes[$entry.Name] = $entry.Hash }
    @{version=1; hashes=$hashes} | ConvertTo-Json -Depth 5 |
        Set-Content -LiteralPath $statePath -Encoding UTF8

    @{projectPath=$project} | ConvertTo-Json |
        Set-Content -LiteralPath $selectionFile -Encoding UTF8
    Write-Host "Verified $($names.Count) script paths; updated $($changes.Count) in Unity project."
    Write-Host 'Unity writes .meta files during import. No temporary files are retained by TFM.'
    if ($OpenUnity) { Launch-Project $editor }
}
finally {
    # Temporary network staging is outside every repository and removed.
    if ($stage -and (Test-Path -LiteralPath $stage)) {
        Remove-Item -LiteralPath $stage -Recurse -Force
    }
}
