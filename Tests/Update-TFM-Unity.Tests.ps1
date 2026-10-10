#requires -Version 5.1
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$updater = Join-Path $repo 'Update-TFM-Unity.ps1'
$fixture = Join-Path ([IO.Path]::GetTempPath()) ('tfm-updater-test-' + [guid]::NewGuid().ToString('N'))
$root = Join-Path $fixture 'Repo With Spaces'
$assets = Join-Path $root 'GameClient/TFM-Unity/Assets'
$packages = Join-Path $root 'GameClient/TFM-Unity/Packages'
New-Item -ItemType Directory -Path $assets, $packages -Force | Out-Null
Set-Content -LiteralPath (Join-Path $packages 'manifest.json') -Value '{}'
$startup = Join-Path $assets '_TFM/Core/Bootstrap/TFMStartup.cs'
New-Item -ItemType Directory -Path (Split-Path -Parent $startup) -Force | Out-Null
Set-Content -LiteralPath $startup -Value '// local startup edits'
$meta = $startup + '.meta'
Set-Content -LiteralPath $meta -Value 'guid: keep-this-guid'
$extra = Join-Path $assets '_TFM/MyLocalScene.unity'
Set-Content -LiteralPath $extra -Value 'local level'

function Assert-True([bool] $Condition, [string] $Message) {
    if (-not $Condition) { throw $Message }
}

# Invalid sources and missing projects must fail without replacing anything.
$failed = $false
try { & $updater -Root $root -SourceRoot $fixture } catch { $failed = $true }
Assert-True $failed 'Incomplete source should be rejected.'
Assert-True ((Get-Content -LiteralPath $startup -Raw).Trim() -eq '// local startup edits') 'Early failure changed startup.'
$failed = $false
try { & $updater -Root (Join-Path $fixture 'missing') -SourceRoot $repo } catch { $failed = $true }
Assert-True $failed 'Missing Unity project should be rejected.'

# A failed third network request must leave both the local source and project intact.
$tfmMockNetwork = @{ Count = 0; Fail = $true }
function Invoke-WebRequest {
    param([switch] $UseBasicParsing, [string] $Uri, [string] $OutFile, [int] $TimeoutSec)
    $tfmMockNetwork.Count++
    if ($tfmMockNetwork.Fail -and $tfmMockNetwork.Count -eq 3) { throw 'Simulated DNS failure' }
    $prefix = 'https://raw.githubusercontent.com/danielkalio400-bot/TFM-Task-Force-Mobile/7f7fe2d7cc74ddf1076662262e4ca72209ee6d48/'
    Assert-True ($Uri.StartsWith($prefix)) 'Download used an unexpected host or revision.'
    Copy-Item -LiteralPath (Join-Path $repo $Uri.Substring($prefix.Length)) -Destination $OutFile
}
$failed = $false
$downloadError = ''
try { & $updater -Root $root -Revision '7f7fe2d7cc74ddf1076662262e4ca72209ee6d48' } catch { $failed = $true; $downloadError = $_.Exception.Message }
Assert-True $failed 'Interrupted download should fail.'
Assert-True ($tfmMockNetwork.Count -eq 3) "Interrupted-download path was not exercised: $downloadError"
Assert-True ((Get-Content -LiteralPath $startup -Raw).Trim() -eq '// local startup edits') 'Download failure changed startup.'
Assert-True (-not (Test-Path -LiteralPath (Join-Path $root 'GameClient/StarterAssets'))) 'Download failure partially updated local source.'
Assert-True (-not (Test-Path -LiteralPath (Join-Path $root 'backups'))) 'Download failure started the installation.'

& $updater -Root $root -SourceRoot $repo
$scripts = @(Get-ChildItem -LiteralPath (Join-Path $assets '_TFM') -Recurse -Filter '*.cs')
Assert-True ($scripts.Count -eq 10) 'Expected all ten runtime and Editor scripts.'
Assert-True ((Get-Content -LiteralPath $meta -Raw).Trim() -eq 'guid: keep-this-guid') 'Unity GUID changed.'
Assert-True ((Get-Content -LiteralPath $extra -Raw).Trim() -eq 'local level') 'Local scene changed.'
$backups = @(Get-ChildItem -LiteralPath (Join-Path $root 'backups') -Recurse -Filter 'TFMStartup.cs')
Assert-True ($backups.Count -eq 1) 'Original script was not backed up exactly once.'
Assert-True ((Get-Content -LiteralPath $backups[0].FullName -Raw).Trim() -eq '// local startup edits') 'Backup contents incorrect.'

$before = (Get-Item -LiteralPath $startup).LastWriteTimeUtc
& $updater -Root $root -SourceRoot $repo
Assert-True ((Get-Item -LiteralPath $startup).LastWriteTimeUtc -eq $before) 'Identical scripts should not be rewritten.'
Assert-True (@(Get-ChildItem -LiteralPath (Join-Path $root 'backups') -Directory).Count -eq 1) 'Second install created an unnecessary backup.'
$tfmMockNetwork.Fail = $false
$tfmMockNetwork.Count = 0
& $updater -Root $root -Revision '7f7fe2d7cc74ddf1076662262e4ca72209ee6d48'
Assert-True ($tfmMockNetwork.Count -eq 10) 'Expected ten direct script downloads.'
Assert-True ((Get-Item -LiteralPath $startup).LastWriteTimeUtc -eq $before) 'Network update rewrote identical startup.'
Write-Host 'PASS: interrupted network download, raw-host downloads, incomplete source, missing project, complete install, backups, GUID/scene preservation and repeat install.'
Write-Host "Test fixtures retained at $fixture"
