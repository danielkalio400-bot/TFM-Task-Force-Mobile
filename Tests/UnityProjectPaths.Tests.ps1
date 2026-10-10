#requires -Version 5.1
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$repo = Split-Path -Parent $PSScriptRoot
$updater = Join-Path $repo 'Update-TFM-Unity.ps1'
$fixture = Join-Path ([IO.Path]::GetTempPath()) ('tfm-path-test-' + [guid]::NewGuid().ToString('N'))

function Assert-True([bool] $Condition, [string] $Message) {
    if (-not $Condition) { throw $Message }
}
function New-Project([string] $Path) {
    New-Item -ItemType Directory -Path (Join-Path $Path 'Assets'), (Join-Path $Path 'Packages'), (Join-Path $Path 'ProjectSettings') -Force | Out-Null
    Set-Content -LiteralPath (Join-Path $Path 'Packages/manifest.json') -Value '{}'
    Set-Content -LiteralPath (Join-Path $Path 'ProjectSettings/ProjectVersion.txt') -Value 'm_EditorVersion: 6000.6.5f1'
}
function Get-Selection([string] $Path) {
    return (Get-Content -LiteralPath (Join-Path $Path '.tfm-unity-project.json') -Raw | ConvertFrom-Json).projectPath
}

# These mocks never inspect live process command lines or launch an actual Editor.
$tfmCalls = @{ Network = 0; Launch = 0; FilePath = ''; Arguments = @() }
function Invoke-WebRequest {
    param([switch] $UseBasicParsing, [string] $Uri, [string] $OutFile, [int] $TimeoutSec)
    $tfmCalls.Network++
    throw 'This operation should not use the network.'
}
function Start-Process {
    param([string] $FilePath, [string[]] $ArgumentList)
    $tfmCalls.Launch++
    $tfmCalls.FilePath = $FilePath
    $tfmCalls.Arguments = $ArgumentList
}

$nestedRoot = Join-Path $fixture 'Nested Only'
$nestedProject = Join-Path $nestedRoot 'GameClient/TFM-Unity/TFM-Unity'
New-Project $nestedProject
& $updater -Root $nestedRoot -SourceRoot $repo
Assert-True ((Get-Selection $nestedRoot) -eq $nestedProject) 'Nested-only project was not detected.'
Assert-True (Test-Path -LiteralPath (Join-Path $nestedProject 'Assets/_TFM/Editor/TFMTrainingSceneBuilder.cs')) 'Nested project did not receive the scene builder.'
Assert-True (-not (Test-Path -LiteralPath (Join-Path $nestedRoot 'GameClient/TFM-Unity/Assets'))) 'Updater manufactured Assets in the parent folder.'

$dualRoot = Join-Path $fixture "Two Projects With Spaces And O'Brien"
$outerProject = Join-Path $dualRoot 'GameClient/TFM-Unity'
$innerProject = Join-Path $outerProject 'TFM-Unity'
New-Project $outerProject
New-Project $innerProject
$message = ''
try { & $updater -Root $dualRoot } catch { $message = $_.Exception.Message }
Assert-True ($message -like '*Multiple Unity projects*' -and $message.Contains($innerProject)) 'Ambiguous projects were not reported with their paths.'
Assert-True ($tfmCalls.Network -eq 0) 'Ambiguous selection started a download.'
Assert-True (-not (Test-Path -LiteralPath (Join-Path $dualRoot '.tfm-unity-project.json'))) 'Ambiguous selection was saved.'
Assert-True (-not (Test-Path -LiteralPath (Join-Path $outerProject 'Assets/_TFM'))) 'Ambiguous selection modified a project.'

& $updater -Root $dualRoot -ProjectPath 'GameClient/TFM-Unity/TFM-Unity' -Preview
Assert-True (-not (Test-Path -LiteralPath (Join-Path $innerProject 'Assets/_TFM'))) 'Preview modified the project.'
Assert-True (-not (Test-Path -LiteralPath (Join-Path $dualRoot '.tfm-unity-project.json'))) 'Preview saved a selection.'

$message = ''
try { & $updater -Root $dualRoot -ProjectPath $innerProject -SourceRoot $repo -OpenUnity -UnityEditorPath (Join-Path $fixture 'missing-editor.exe') }
catch { $message = $_.Exception.Message }
Assert-True ($message -like '*Unity Editor not found*') 'Missing Editor was not reported.'
Assert-True (-not (Test-Path -LiteralPath (Join-Path $innerProject 'Assets/_TFM'))) 'Missing Editor partially installed the project.'

$fakeEditor = Join-Path $fixture 'Fake Editor.exe'
Set-Content -LiteralPath $fakeEditor -Value 'test fixture; Start-Process is mocked'
& $updater -Root $dualRoot -ProjectPath 'GameClient/TFM-Unity/TFM-Unity' -SourceRoot $repo -OpenUnity -UnityEditorPath $fakeEditor
Assert-True ((Get-Selection $dualRoot) -eq $innerProject) 'Explicit nested selection was not remembered.'
Assert-True (-not (Test-Path -LiteralPath (Join-Path $outerProject 'Assets/_TFM'))) 'Installing to the inner project changed the outer project.'
Assert-True ($tfmCalls.Arguments[1] -ceq ('"' + $innerProject + '"')) 'Launch lost the selected project or path quoting.'
Assert-True ($tfmCalls.Arguments[2] -eq '-executeMethod' -and $tfmCalls.Arguments[3] -eq 'TFM.Editor.TFMTrainingSceneBuilder.OpenTrainingYard') 'Launch did not request the training yard.'

# Installed wrappers must work from a different working directory, with no Root argument.
$originalLocation = Get-Location
try {
    Set-Location -LiteralPath $fixture
    & (Join-Path $dualRoot 'Open-TFM-Unity.ps1') -UnityEditorPath $fakeEditor
    Assert-True ($tfmCalls.Arguments[1] -ceq ('"' + $innerProject + '"')) 'Launcher ignored the remembered project.'
    Assert-True ($tfmCalls.Launch -eq 2) 'Launcher did not launch exactly once.'
    & (Join-Path $dualRoot 'Import-TFM-StarterAssets.ps1')
    Assert-True ((Get-Selection $dualRoot) -eq $innerProject) 'Offline importer lost the selection.'
} finally { Set-Location -LiteralPath $originalLocation.Path }
Assert-True ($tfmCalls.Network -eq 0) 'Offline import or launcher accessed the network.'

# Explicitly switching projects must not modify the previous project's local changes.
$localScript = Join-Path $innerProject 'Assets/_TFM/Core/Bootstrap/TFMStartup.cs'
Set-Content -LiteralPath $localScript -Value '// keep this inner-project edit'
& $updater -Root $dualRoot -ProjectPath $outerProject -SourceRoot $repo
Assert-True ((Get-Selection $dualRoot) -eq $outerProject) 'Explicit project override was ignored.'
Assert-True ((Get-Content -LiteralPath $localScript -Raw).Trim() -eq '// keep this inner-project edit') 'Other project was overwritten.'
& $updater -Root $dualRoot -SourceRoot $repo
Assert-True ((Get-Selection $dualRoot) -eq $outerProject) 'Repeat update selected a different project.'

# A folder with only copied Assets and a manifest is not a complete Unity project.
$incompleteRoot = Join-Path $fixture 'Incomplete Project'
$incomplete = Join-Path $incompleteRoot 'GameClient/TFM-Unity'
New-Item -ItemType Directory -Path (Join-Path $incomplete 'Assets'), (Join-Path $incomplete 'Packages') -Force | Out-Null
Set-Content -LiteralPath (Join-Path $incomplete 'Packages/manifest.json') -Value '{}'
$message = ''
try { & $updater -Root $incompleteRoot -SourceRoot $repo } catch { $message = $_.Exception.Message }
Assert-True ($message -like '*No Unity project found*') 'Incomplete project was accepted.'

# A stale selection can recover when exactly one valid project remains.
Set-Content -LiteralPath (Join-Path $nestedRoot '.tfm-unity-project.json') -Value '{"projectPath":"moved-away"}'
& $updater -Root $nestedRoot -SourceRoot $repo
Assert-True ((Get-Selection $nestedRoot) -eq $nestedProject) 'Stale selection did not recover.'

# The scaffold must ship the actual gameplay and current installer, not old templates.
$scaffoldRoot = Join-Path $fixture 'Fresh Scaffold'
& (Join-Path $repo 'TFM-Create-Project.ps1') -Root $scaffoldRoot -Preview 6>$null
Assert-True (-not (Test-Path -LiteralPath $scaffoldRoot)) 'Scaffold preview wrote files.'
& (Join-Path $repo 'TFM-Create-Project.ps1') -Root $scaffoldRoot 6>$null
$scaffoldProject = Join-Path $scaffoldRoot 'TFM-Unity'
New-Project $scaffoldProject
& (Join-Path $scaffoldRoot 'Import-TFM-StarterAssets.ps1')
Assert-True (@(Get-ChildItem -LiteralPath (Join-Path $scaffoldProject 'Assets/_TFM') -Recurse -Filter '*.cs').Count -eq 10) 'Fresh scaffold did not import all ten scripts.'
Assert-True ((Get-Selection $scaffoldRoot) -eq $scaffoldProject) 'Root-level Unity project was not detected.'
Set-Content -LiteralPath (Join-Path $scaffoldRoot 'GameClient/StarterAssets/Assets/_TFM/Core/Bootstrap/TFMStartup.cs') -Value '// keep my scaffold changes'
& (Join-Path $repo 'TFM-Create-Project.ps1') -Root $scaffoldRoot 6>$null
Assert-True ((Get-Content -LiteralPath (Join-Path $scaffoldRoot 'GameClient/StarterAssets/Assets/_TFM/Core/Bootstrap/TFMStartup.cs') -Raw).Trim() -eq '// keep my scaffold changes') 'Repeating the scaffold overwrote existing source.'

Write-Host 'PASS: nested/root detection, ambiguous selection, preview, explicit path, missing Editor, remembered project, launch arguments, offline wrappers, project switching, incomplete project, stale selection, fresh scaffold.'
Write-Host "Test fixtures retained at $fixture"
