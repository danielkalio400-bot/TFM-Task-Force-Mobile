#requires -Version 5.1
[CmdletBinding()]
param(
    [string] $Root = 'C:\Users\danie\bazaara\TFM-Task-Force-Mobile',
    [string] $ProjectPath,
    [string] $UnityEditorPath
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
if (-not $ProjectPath) {
    $ProjectPath = Join-Path $Root 'GameClient\TFM-Unity\TFM-Unity'
}
$ProjectPath = [IO.Path]::GetFullPath($ProjectPath)
$scene = Join-Path $ProjectPath 'Assets\_TFM\Scenes\TFMDistrict01.unity'
if (-not (Test-Path -LiteralPath $scene)) {
    throw 'District 01 scene must be built before importing real-world materials.'
}
if (Get-Process Unity -ErrorAction SilentlyContinue) {
    throw 'Close Unity before automatically upgrading art.'
}
if (-not $UnityEditorPath) {
    $version = Get-Content (Join-Path $ProjectPath 'ProjectSettings\ProjectVersion.txt') -Raw
    if ($version -notmatch '(?m)^m_EditorVersion:\s*(\S+)') {
        throw 'Unity version not found.'
    }
    $UnityEditorPath = Join-Path $env:ProgramFiles ('Unity\Hub\Editor\' + $Matches[1] + '\Editor\Unity.exe')
}
if (-not (Test-Path -LiteralPath $UnityEditorPath)) {
    throw 'Unity Editor executable not found.'
}

# Poly Haven's official public asset search and files metadata supply the
# photo URLs. User project retains original CC0 provenance and source links.
$queries = [ordered]@{
    road = 'worn asphalt road'
    brick = 'weathered brick wall'
    concrete = 'weathered concrete wall'
    metal = 'corrugated metal siding'
}
$headers = @{ 'User-Agent' = 'TFM-OriginalDistrict/1.0' }
$photoRoot = Join-Path $ProjectPath 'Assets\_TFM\Worlds\District01\PhotoPBR'
$ledger = New-Object 'System.Collections.Generic.List[object]'
foreach ($surface in $queries.Keys) {
    # All three maps already on disk? Use them without repeating API requests.
    $dest = Join-Path $photoRoot $surface
    $localMaps = @('Diffuse', 'Normal', 'Rough')
    $alreadyComplete = $true
    foreach ($mapName in $localMaps) {
        $existingFile = Join-Path $dest ('{0}_{1}.jpg' -f $surface, $mapName)
        if (-not (Test-Path -LiteralPath $existingFile) -or
            (Get-Item -LiteralPath $existingFile).Length -lt 1024) {
            $alreadyComplete = $false
        }
    }
    if ($alreadyComplete) {
        Write-Host ('Reusing downloaded photographed PBR maps for ' + $surface)
        # Preserve provider provenance recorded on previous successful installs.
        # The first failed run may lack JSON, so the verified source asset ids
        # correspond to the exact four assets previously downloaded by TFM.
        $knownAsset = @{
            road = 'asphalt_03'
            brick = 'brick_wall_10'
            concrete = 'concrete_wall_008'
            metal = 'corrugated_iron'
        }[$surface]
        $ledger.Add([pscustomobject]@{
            surface=$surface
            asset=$knownAsset
            license='CC0'
            provider='Powered by Poly Haven'
            source=('https://polyhaven.com/a/' + $knownAsset)
        })
        continue
    }
    $q = [uri]::EscapeDataString($queries[$surface])
    $url = 'https://api.polyhaven.com/search?q=' + $q + '&t=textures&limit=12'
    Write-Host ('Searching CC0 photographed ' + $surface + ' surfaces...')
    $search = Invoke-RestMethod -Uri $url -Headers $headers -TimeoutSec 45
    $selected = $null
    $asset = $null
    foreach ($candidate in $search.results) {
        $slug = [string]$candidate.slug
        if ($slug -notmatch '^[a-zA-Z0-9_-]{1,80}$') { continue }
        try {
            $info = Invoke-RestMethod -Headers $headers -TimeoutSec 45 -Uri ('https://api.polyhaven.com/files/' + $slug)
            if ($info.Diffuse.'2k'.jpg.url -and $info.nor_gl.'2k'.jpg.url -and $info.Rough.'2k'.jpg.url) {
                $selected = $slug
                $asset = $info
                break
            }
        }
        catch { continue }
    }
    if (-not $selected) {
        Write-Warning ('No complete PBR material available for ' + $surface)
        continue
    }
    $dest = Join-Path $photoRoot $surface
    New-Item -Path $dest -ItemType Directory -Force | Out-Null
    $maps = @(
        @{ Name='Diffuse'; Url=$asset.Diffuse.'2k'.jpg.url },
        @{ Name='Normal'; Url=$asset.nor_gl.'2k'.jpg.url },
        @{ Name='Rough'; Url=$asset.Rough.'2k'.jpg.url }
    )
    foreach ($map in $maps) {
        $uri = [uri]$map.Url
        if ($uri.Scheme -ne 'https') {
            throw 'Non-HTTPS photo asset URL rejected.'
        }
        $path = Join-Path $dest ('{0}_{1}.jpg' -f $surface, $map.Name)
        if (-not (Test-Path -LiteralPath $path)) {
            Invoke-WebRequest -UseBasicParsing -Headers $headers -Uri $uri.AbsoluteUri -OutFile $path -TimeoutSec 180
        }
        if ((Get-Item -LiteralPath $path).Length -lt 1024) {
            throw ('Incomplete photo texture: ' + $path)
        }
    }
    $ledger.Add([pscustomobject]@{
        surface=$surface
        asset=$selected
        license='CC0'
        provider='Powered by Poly Haven'
        source=('https://polyhaven.com/a/' + $selected)
    })
    Write-Host ('Photographed PBR source acquired: ' + $surface + '/' + $selected)
}
if ($ledger.Count -eq 0) {
    throw 'No CC0 photo material downloaded. The original authored district remains unchanged.'
}
# Windows PowerShell 5.1 may fail when wrapping generic lists in array expressions.
# Serialize the concrete object array to avoid 'Argument types do not match'.
$provenance = $ledger.ToArray()
ConvertTo-Json -InputObject $provenance -Depth 5 | Set-Content -LiteralPath (
    Join-Path $photoRoot 'PolyHaven-Provenance.json') -Encoding UTF8

$log = Join-Path $env:TEMP 'TFM-District-Photo-PBR.log'
$arguments = @(
    '-batchmode',
    '-quit',
    '-projectPath', ('"' + $ProjectPath + '"'),
    '-executeMethod', 'TFM.Editor.TFMDistrictPbrImporter.Batch',
    '-logFile', ('"' + $log + '"')
)
$process = Start-Process -FilePath $UnityEditorPath -ArgumentList $arguments -PassThru -Wait
if ($process.ExitCode -ne 0) {
    if (Test-Path -LiteralPath $log) { Get-Content -LiteralPath $log -Tail 75 }
    throw ('Unity photographed material pass failed: exit ' + $process.ExitCode)
}
if (-not (Select-String -LiteralPath $log -SimpleMatch 'TFM_PBR_RESULT=SUCCESS')) {
    Get-Content -LiteralPath $log -Tail 75
    throw 'Unity did not confirm photographed PBR material integration.'
}
Write-Host 'TFM DISTRICT 01: PHOTOGRAPHED PBR SURFACES INSTALLED'
Write-Host 'Powered by Poly Haven; provenance and CC0 source links saved locally.'
