#requires -Version 5.1
<#
.SYNOPSIS
  Creates a standalone TFM - Task Force Mobile project scaffold.
.DESCRIPTION
  Safe, repeatable folder and starter-file setup. Does not install Unity,
  build a playable game, touch bazaara-platform, or overwrite existing files.
.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File .\TFM-Create-Project.ps1 -Preview
.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File .\TFM-Create-Project.ps1
.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File .\TFM-Create-Project.ps1 -Root 'D:\Games\TFM-Task-Force-Mobile'
#>
[CmdletBinding()]
param(
    [string] $Root = (Join-Path (Join-Path $HOME 'Bazaara') 'TFM-Task-Force-Mobile'),
    [switch] $Preview
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Run from the complete repository/ZIP so new projects get the current prototype.
$packageAssets = Join-Path $PSScriptRoot 'GameClient/StarterAssets/Assets/_TFM'
$packageFiles = @('README.md', 'GameClient/README-UNITY-SETUP.md',
    'Update-TFM-Unity.ps1', 'Open-TFM-Unity.ps1', 'Import-TFM-StarterAssets.ps1', 'TFM-Create-Project.ps1')
if (-not (Test-Path -LiteralPath (Join-Path $packageAssets 'Editor/TFMTrainingSceneBuilder.cs'))) {
    throw 'Run TFM-Create-Project.ps1 from the complete TFM repository or extracted ZIP.'
}
$packageFiles += @(Get-ChildItem -LiteralPath $packageAssets -Recurse -Filter '*.cs' |
    ForEach-Object { $_.FullName.Substring($PSScriptRoot.Length + 1).Replace('\', '/') })
foreach ($relative in $packageFiles) {
    if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot $relative) -PathType Leaf)) {
        throw "Missing packaged file: $relative. No files changed."
    }
}

try { $Root = [System.IO.Path]::GetFullPath($Root) }
catch { throw "Invalid Root path: $($_.Exception.Message)" }

$rootTrimmed = $Root.TrimEnd([char[]]@('\','/'))
if ([string]::IsNullOrWhiteSpace($rootTrimmed)) { throw 'Project root is empty.' }
if ($rootTrimmed -ieq [System.IO.Path]::GetPathRoot($Root).TrimEnd([char[]]@('\','/'))) {
    throw 'Refusing to create a project at the root of a drive.'
}
if ($rootTrimmed -match '(?i)(^|[\\/])bazaara-platform($|[\\/])') {
    throw 'TFM must remain separate from bazaara-platform. Choose a different -Root.'
}
if ((Test-Path -LiteralPath (Join-Path $Root 'ecosystem-1')) -or
    (Test-Path -LiteralPath (Join-Path $Root 'ecosystems'))) {
    throw 'This path looks like an existing Bazaara ecosystem project. No changes made.'
}

[int] $script:dirCreated = 0
[int] $script:fileCreated = 0
[int] $script:fileSkipped = 0

function Ensure-Folder {
    param([Parameter(Mandatory=$true)][string] $Relative)
    $path = if ($Relative -eq '.') { $Root } else { Join-Path $Root $Relative }
    if (-not (Test-Path -LiteralPath $path -PathType Container)) {
        if ($Preview) { Write-Host "[PREVIEW] Directory: $Relative" }
        else { New-Item -ItemType Directory -Path $path -Force | Out-Null }
        $script:dirCreated++
    }
    return $path
}

function Add-FileIfMissing {
    param(
        [Parameter(Mandatory=$true)][string] $Relative,
        [Parameter(Mandatory=$true)][string] $Content
    )
    $path = Join-Path $Root $Relative
    if (Test-Path -LiteralPath $path) {
        Write-Host "[KEEP]    $Relative"
        $script:fileSkipped++
        return
    }
    $parent = Split-Path -Path $Relative -Parent
    if ($parent) { Ensure-Folder $parent | Out-Null }
    if ($Preview) { Write-Host "[PREVIEW] File: $Relative" }
    else { [System.IO.File]::WriteAllText($path, $Content, (New-Object System.Text.UTF8Encoding($false))) }
    $script:fileCreated++
}

$folders = @(
    '.',
    'GameClient', 'GameClient/StarterAssets/Assets/_TFM',
    'GameClient/StarterAssets/Assets/_TFM/Core/Bootstrap',
    'GameClient/StarterAssets/Assets/_TFM/Core/Configuration',
    'GameClient/StarterAssets/Assets/_TFM/Core/Events',
    'GameClient/StarterAssets/Assets/_TFM/Core/Networking',
    'GameClient/StarterAssets/Assets/_TFM/Core/SaveSystem',
    'GameClient/StarterAssets/Assets/_TFM/Authentication/BazID',
    'GameClient/StarterAssets/Assets/_TFM/Authentication/Login',
    'GameClient/StarterAssets/Assets/_TFM/Authentication/Sessions',
    'GameClient/StarterAssets/Assets/_TFM/Gameplay/Multiplayer/TeamDeathmatch',
    'GameClient/StarterAssets/Assets/_TFM/Gameplay/Multiplayer/Frontline',
    'GameClient/StarterAssets/Assets/_TFM/Gameplay/Multiplayer/Domination',
    'GameClient/StarterAssets/Assets/_TFM/Gameplay/Multiplayer/SearchAndDestroy',
    'GameClient/StarterAssets/Assets/_TFM/Gameplay/Multiplayer/KillConfirmed',
    'GameClient/StarterAssets/Assets/_TFM/Gameplay/Multiplayer/Hardpoint',
    'GameClient/StarterAssets/Assets/_TFM/Gameplay/Multiplayer/FreeForAll',
    'GameClient/StarterAssets/Assets/_TFM/Gameplay/Multiplayer/Gunfight',
    'GameClient/StarterAssets/Assets/_TFM/Gameplay/Multiplayer/Ranked',
    'GameClient/StarterAssets/Assets/_TFM/Gameplay/Multiplayer/LeaguePlay',
    'GameClient/StarterAssets/Assets/_TFM/Gameplay/BattleRoyale/Classic100',
    'GameClient/StarterAssets/Assets/_TFM/Gameplay/BattleRoyale/Alcatraz',
    'GameClient/StarterAssets/Assets/_TFM/Gameplay/BattleRoyale/TankBattle',
    'GameClient/StarterAssets/Assets/_TFM/Gameplay/BattleRoyale/Training',
    'GameClient/StarterAssets/Assets/_TFM/Gameplay/BattleRoyale/Blitz',
    'GameClient/StarterAssets/Assets/_TFM/Gameplay/BattleRoyale/SolidGold',
    'GameClient/StarterAssets/Assets/_TFM/Gameplay/BattleRoyale/PropHunt',
    'GameClient/StarterAssets/Assets/_TFM/Gameplay/BattleRoyale/RotatingEvents',
    'GameClient/StarterAssets/Assets/_TFM/Gameplay/Zombies/Raid/Normal',
    'GameClient/StarterAssets/Assets/_TFM/Gameplay/Zombies/Raid/Hardcore',
    'GameClient/StarterAssets/Assets/_TFM/Gameplay/Zombies/Survival',
    'GameClient/StarterAssets/Assets/_TFM/Gameplay/Zombies/CooperativeDefense',
    'GameClient/StarterAssets/Assets/_TFM/Gameplay/Zombies/Events',
    'GameClient/StarterAssets/Assets/_TFM/Gameplay/DMZRecon/Extraction',
    'GameClient/StarterAssets/Assets/_TFM/Gameplay/DMZRecon/Missions',
    'GameClient/StarterAssets/Assets/_TFM/Gameplay/DMZRecon/Contracts',
    'GameClient/StarterAssets/Assets/_TFM/Gameplay/DMZRecon/AIEncounters',
    'GameClient/StarterAssets/Assets/_TFM/Gameplay/DMZRecon/Inventory',
    'GameClient/StarterAssets/Assets/_TFM/Gameplay/DMZRecon/RiskZones',
    'GameClient/StarterAssets/Assets/_TFM/Gameplay/DMZRecon/Progression',
    'GameClient/StarterAssets/Assets/_TFM/Player/Movement',
    'GameClient/StarterAssets/Assets/_TFM/Player/Camera',
    'GameClient/StarterAssets/Assets/_TFM/Player/Controls',
    'GameClient/StarterAssets/Assets/_TFM/Player/Animation',
    'GameClient/StarterAssets/Assets/_TFM/Player/Interaction',
    'GameClient/StarterAssets/Assets/_TFM/Characters/Operators',
    'GameClient/StarterAssets/Assets/_TFM/Characters/Outfits',
    'GameClient/StarterAssets/Assets/_TFM/Characters/Skeletons',
    'GameClient/StarterAssets/Assets/_TFM/Characters/Animations',
    'GameClient/StarterAssets/Assets/_TFM/Vehicles',
    'GameClient/StarterAssets/Assets/_TFM/Maps/Multiplayer',
    'GameClient/StarterAssets/Assets/_TFM/Maps/BattleRoyale/ClassicIsland',
    'GameClient/StarterAssets/Assets/_TFM/Maps/BattleRoyale/Alcatraz',
    'GameClient/StarterAssets/Assets/_TFM/Maps/Zombies',
    'GameClient/StarterAssets/Assets/_TFM/Maps/DMZRecon',
    'GameClient/StarterAssets/Assets/_TFM/Maps/SharedEnvironmentAssets',
    'GameClient/StarterAssets/Assets/_TFM/Graphics/URP',
    'GameClient/StarterAssets/Assets/_TFM/Graphics/QualityPresets/Low',
    'GameClient/StarterAssets/Assets/_TFM/Graphics/QualityPresets/Medium',
    'GameClient/StarterAssets/Assets/_TFM/Graphics/QualityPresets/High',
    'GameClient/StarterAssets/Assets/_TFM/Graphics/QualityPresets/Ultra',
    'GameClient/StarterAssets/Assets/_TFM/Graphics/Lighting',
    'GameClient/StarterAssets/Assets/_TFM/Graphics/Materials',
    'GameClient/StarterAssets/Assets/_TFM/Graphics/LOD',
    'GameClient/StarterAssets/Assets/_TFM/Graphics/PerformanceProfiles',
    'GameClient/StarterAssets/Assets/_TFM/Audio',
    'GameClient/StarterAssets/Assets/_TFM/VFX',
    'GameClient/StarterAssets/Assets/_TFM/AI',
    'GameClient/StarterAssets/Assets/_TFM/Progression',
    'GameClient/StarterAssets/Assets/_TFM/Localization',
    'GameClient/StarterAssets/Assets/_TFM/Resources',
    'GameClient/StarterAssets/Assets/_TFM/UI/SplashScreen',
    'GameClient/StarterAssets/Assets/_TFM/UI/Login',
    'GameClient/StarterAssets/Assets/_TFM/UI/MainMenu',
    'GameClient/StarterAssets/Assets/_TFM/UI/Lobby',
    'GameClient/StarterAssets/Assets/_TFM/UI/Friends',
    'GameClient/StarterAssets/Assets/_TFM/UI/Clan',
    'GameClient/StarterAssets/Assets/_TFM/UI/Matchmaking',
    'GameClient/StarterAssets/Assets/_TFM/UI/Loadout',
    'GameClient/StarterAssets/Assets/_TFM/UI/Operators',
    'GameClient/StarterAssets/Assets/_TFM/UI/Inventory',
    'GameClient/StarterAssets/Assets/_TFM/UI/BattlePass',
    'GameClient/StarterAssets/Assets/_TFM/UI/Ranked',
    'GameClient/StarterAssets/Assets/_TFM/UI/Leaderboards',
    'GameClient/StarterAssets/Assets/_TFM/UI/Store',
    'GameClient/StarterAssets/Assets/_TFM/UI/Settings/Graphics',
    'GameClient/StarterAssets/Assets/_TFM/UI/Settings/Audio',
    'GameClient/StarterAssets/Assets/_TFM/UI/Settings/Controls',
    'GameClient/StarterAssets/Assets/_TFM/UI/Settings/Accessibility',
    'GameClient/StarterAssets/Assets/_TFM/UI/HUD/Multiplayer',
    'GameClient/StarterAssets/Assets/_TFM/UI/HUD/BattleRoyale',
    'GameClient/StarterAssets/Assets/_TFM/UI/HUD/Zombies',
    'GameClient/StarterAssets/Assets/_TFM/UI/HUD/DMZRecon',
    'GameClient/StarterAssets/Assets/_TFM/UI/MatchResults',
    'GameClient/StarterAssets/Assets/_TFM/Integrations/BazID',
    'Backend/src/auth/BazID', 'Backend/src/auth/GameSessions',
    'Backend/src/players', 'Backend/src/profiles',
    'Backend/src/matchmaking', 'Backend/src/friends',
    'Backend/src/clans', 'Backend/src/progression',
    'Backend/src/inventory', 'Backend/src/rankings',
    'Backend/src/matchResults', 'Backend/src/purchases',
    'Backend/src/moderation', 'Backend/src/notifications',
    'Backend/tests',
    'GameServers/Builds',
    'GameServers/Deployment/Multiplayer',
    'GameServers/Deployment/BattleRoyale',
    'GameServers/Deployment/Zombies',
    'GameServers/Deployment/DMZRecon',
    'GameServers/MatchOrchestration',
    'GameServers/HealthChecks',
    'GameServers/Monitoring',
    'GameServers/Configuration',
    'Database/migrations', 'Database/seeds',
    'Infrastructure/Deployment',
    'Infrastructure/Monitoring',
    'Infrastructure/ServerConfiguration',
    'Shared/contracts',
    'ArtSource/Characters', 'ArtSource/Maps',
    'ArtSource/Materials', 'ArtSource/Animations',
    'Tools', 'Tests', 'Documentation', '.github/workflows'
)

Write-Host 'TFM - Task Force Mobile | Standalone project scaffold'
Write-Host "Target: $Root"
if ($Preview) { Write-Host 'Mode: PREVIEW (read-only)' } else { Write-Host 'Mode: CREATE (existing files preserved)' }
foreach ($folder in $folders) { Ensure-Folder $folder | Out-Null }

Add-FileIfMissing '.gitignore' @'
# Private config and secrets
.env
.env.*
!.env.example
*.pem
*.pfx
*.key

# Unity generated caches / builds
[Ll]ibrary/
[Tt]emp/
[Oo]bj/
[Bb]uild/
[Bb]uilds/
[Ll]ogs/
[Uu]ser[Ss]ettings/
[Mm]emoryCaptures/
[Rr]ecordings/

# JavaScript
node_modules/
coverage/

# OS/editor
.DS_Store
Thumbs.db
.vscode/
.idea/
.tfm-unity-project.json
'@

Add-FileIfMissing '.gitattributes' @'
* text=auto
*.png binary
*.jpg binary
*.jpeg binary
*.fbx binary
*.blend binary
*.wav binary
*.mp4 binary
*.psd binary
'@

# Copy the maintained setup tools and gameplay scripts instead of generating
# an obsolete two-script importer. Existing local files are still preserved.
foreach ($relative in $packageFiles) {
    Add-FileIfMissing $relative (Get-Content -LiteralPath (Join-Path $PSScriptRoot $relative) -Raw)
}

Add-FileIfMissing 'Shared/contracts/mode-catalog.json' @'
{
  "version": 1,
  "status": "planned-not-implemented",
  "targetOriginalMaps": "30+",
  "targetModesAndVariants": "25+",
  "sections": [
    { "id": "mp", "label": "Multiplayer", "permanent": true, "modes": ["Team Deathmatch", "Frontline", "Domination", "Search & Destroy", "Kill Confirmed", "Hardpoint", "Free-for-All", "Gunfight", "Ranked MP", "League Play"] },
    { "id": "br", "label": "Battle Royale", "permanent": true, "modes": ["Classic BR (100 players)", "Alcatraz", "Tank Battle", "Training Ground", "Blitz", "Solid Gold", "Prop Hunt", "Rotating Events"] },
    { "id": "zombies", "label": "Zombies", "permanent": true, "modes": ["Raid Normal", "Raid Hardcore", "Survival", "Cooperative Defense", "Special Events"] },
    { "id": "dmz", "label": "DMZ: Recon", "permanent": true, "modes": ["Standard Extraction", "Solo Extraction", "Squad Extraction", "PvPvE Missions", "High-Risk Zones", "Contracts", "Special Recon Operations"] }
  ]
}
'@

Add-FileIfMissing 'Backend/package.json' @'
{
  "name": "tfm-backend-starter",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "engines": { "node": ">=20" },
  "scripts": { "start": "node src/server.mjs", "test": "node --test tests/*.test.mjs" },
  "description": "Local-only TFM API placeholder; not production authentication or multiplayer"
}
'@

Add-FileIfMissing 'Backend/src/server.mjs' @'
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const catalogPath = new URL("../../Shared/contracts/mode-catalog.json", import.meta.url);
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));

export function makeServer() {
  return createServer((request, response) => {
    const path = (request.url || "").split("?")[0];
    const send = (status, payload) => {
      response.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
      response.end(JSON.stringify(payload));
    };
    if (request.method === "GET" && path === "/health") {
      return send(200, { ok: true, service: "tfm-api-starter", productionReady: false });
    }
    if (request.method === "GET" && path === "/v1/modes") {
      return send(200, catalog);
    }
    return send(404, { error: "not_found" });
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const port = Number.parseInt(process.env.PORT || "4100", 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid PORT");
  // Local-only by design. Do not expose as a public game service.
  makeServer().listen(port, "127.0.0.1", () => console.log(`TFM starter API: http://127.0.0.1:${port}`));
}
'@

Add-FileIfMissing 'Backend/tests/server.test.mjs' @'
import test from "node:test";
import assert from "node:assert/strict";
import { makeServer } from "../src/server.mjs";

test("TFM starter API responds with a health check and four planned sections", async () => {
  const server = makeServer();
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  try {
    const address = server.address();
    const base = `http://127.0.0.1:${address.port}`;
    const healthResponse = await fetch(`${base}/health`);
    assert.equal(healthResponse.status, 200);
    assert.equal((await healthResponse.json()).productionReady, false);
    const modesResponse = await fetch(`${base}/v1/modes`);
    const catalog = await modesResponse.json();
    assert.equal(modesResponse.status, 200);
    assert.equal(catalog.sections.length, 4);
    assert.equal(catalog.status, "planned-not-implemented");
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
'@

Add-FileIfMissing 'Backend/.env.example' @'
# The starter runs on loopback and does not connect to BazID.
PORT=4100
# Future (not implemented): BAZID_ISSUER, BAZID_CLIENT_ID, JWKS settings.
# Never put client secrets inside the Unity/mobile client.
'@

Add-FileIfMissing 'Database/migrations/0001_player_profiles.sql' @'
-- Reference schema only; not automatically applied by the scaffold.
-- Authentication must verify BazID OIDC tokens before creating profiles.
CREATE TABLE IF NOT EXISTS player_profiles (
    player_id UUID PRIMARY KEY,
    bazid_subject TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
'@

Add-FileIfMissing 'Documentation/01-ARCHITECTURE.md' @'
# TFM architecture

- TFM is a separate repository OUTSIDE the three Bazaara ecosystems.
- Client: real Unity 6 Universal 3D project created by Unity Hub.
- Identity: BazID via external browser OIDC Authorization Code + PKCE.
- Backend: separate player profile, progression, moderation and APIs.
- Real-time multiplayer: authoritative dedicated-server plan (not implemented).
- Data: isolated TFM database and audited administrative access.
- Shared: versioned contracts, no direct writes to Bazaara databases.
- Delivery: Android/iOS with platform review, age-appropriate design and testing.

This scaffold is infrastructure for development, NOT an operational game.
'@

Add-FileIfMissing 'Documentation/02-GAME-MODES.md' @'
# Four permanent TFM sections

1. Multiplayer: 10 planned entries including ranked and league.
2. Battle Royale: Classic (100-player target), Alcatraz (original layout), 6 others.
3. Zombies: Raid normal/hardcore, Survival, Cooperative Defense, Events.
4. DMZ: Recon: extraction variants, PvPvE, AI encounters, missions.

Original map target: 30+. This is aspirational. No playable maps are generated.
Mode names are planning labels, not copies of proprietary game assets.
'@

Add-FileIfMissing 'Documentation/03-UNITY-MOBILE-GUIDE.md' @'
# Unity mobile guidelines

- Use Unity 6 LTS + Universal 3D (URP) template from Unity Hub.
- Start with 1 original environment and 1 menu scene, not 30 empty scenes.
- Establish measured CPU, GPU, memory, network and temperature budgets.
- Aim for stable 60 FPS on supported devices; offer 30 FPS fallback.
- Use LODs, efficient materials, selective shadows, dynamic resolution,
  streaming, platform texture compression and real-device profiling.
- Optimized server state and low latency are separate from rendering FPS.
- Obtain rights for every character, environment, sound and visual asset.
'@

Add-FileIfMissing 'Documentation/04-BAZID-SECURITY.md' @'
# BazID integration - implementation plan only

Use OAuth 2.0 Authorization Code with PKCE and OIDC discovery for native apps.
Use a system browser + secure app redirect; DO NOT use an embedded password form.
Validate issuer, audience, signature, expiry and nonce as applicable.
Keep tokens in OS-protected storage; never store BazID passwords or secrets
in the Unity project. Backend issues only scoped game service sessions.
Separate BazID identity from TFM game data and enforce revocation.

The scaffold contains NO authentication implementation or credentials.
'@

Add-FileIfMissing 'Documentation/05-DELIVERY-ROADMAP.md' @'
# Phased delivery

0. Confirm scope, licenses, roles, and game safety requirements.
1. Unity Hub project + menu prototype + one original demonstration map.
2. Player UX, input/accessibility, graphics profiling on real phones.
3. Authenticated BazID integration and profile services.
4. Authoritative test multiplayer with reliable hosting and observability.
5. Ranked systems, scalable BR feasibility, capacity and reliability tests.
6. Zombies and extraction mission prototypes with separate persistence.
7. Performance, platform compliance, moderation, QA, security, live ops.
8. Content rollout toward 25+ modes/variants and 30+ original maps.

Each phase requires testing. Release gates are not bypassed automatically.
'@

Add-FileIfMissing 'Documentation/06-ORIGINAL-CONTENT.md' @'
# Original content and player safety

TFM may study the high-level conventions of mobile games, but must not copy
Call of Duty: Mobile maps, game assets, audio, source code, UI artwork,
trademarks or proprietary implementations.

Alcatraz is a real-world place name. Use original geometry, art, mission design
and game layouts instead of replicating any existing game's rendition.

Include player reporting, blocking, age-appropriate social controls,
anti-harassment moderation and transparent purchase policies.
'@

Add-FileIfMissing 'GameServers/README.md' @'
# Dedicated server deployment placeholders

This folder is for build output references, orchestration definitions,
health checks and telemetry for authoritative multiplayer deployments.
Do not duplicate authoritative Unity simulation code in these folders.
No dedicated server executable is included in this scaffold.
'@

Add-FileIfMissing 'Tests/README.md' @'
# Planned verification

- Unity compile/playmode tests after creating the Universal 3D project.
- Mobile performance benchmarks on physical Android/iOS devices.
- BazID sign-in and session-revocation integration tests.
- Network latency, reconnect and server load/observability tests.
- Privacy, moderation, security and release acceptance tests.
- Backend smoke tests: `cd Backend; npm test`.
'@

Add-FileIfMissing '.github/workflows/README.md' @'
# Continuous integration

Add GitHub Actions only after the Unity editor version, runner requirements,
project credentials and repository ownership are defined.
Do not commit signing keys or application secrets.
'@

# Make empty folder structure visible to Git without placing fake code in it.
foreach ($folder in $folders) {
    if ($folder -eq '.') { continue }
    $normalized = $folder -replace '\\', '/'
    $filePath = Join-Path (Join-Path $Root $folder) '.gitkeep'
    if (-not (Test-Path -LiteralPath $filePath) -and -not $Preview) {
        $items = Get-ChildItem -LiteralPath (Join-Path $Root $folder) -Force -ErrorAction SilentlyContinue
        if (-not $items) { Set-Content -LiteralPath $filePath -Value '' -Encoding ASCII }
    }
}

Write-Host ''
Write-Host "Project: $Root"
Write-Host "Directories to create / created: $script:dirCreated"
Write-Host "Starter files to create / created: $script:fileCreated"
Write-Host "Existing files preserved: $script:fileSkipped"
if ($Preview) {
    Write-Host 'PREVIEW ONLY: no files changed. Remove -Preview to create the project.'
} else {
    Write-Host 'SUCCESS: TFM folders and current training-yard source prepared. Create a Unity project to run it.'
    Write-Host 'NEXT: Unity Hub -> Universal 3D -> Name: TFM-Unity; Location: GameClient (the parent folder).'
    Write-Host 'THEN: powershell -File .\Import-TFM-StarterAssets.ps1 -Root <TFM root>'
    Write-Host 'BACKEND TEST: cd Backend; npm test'
}
