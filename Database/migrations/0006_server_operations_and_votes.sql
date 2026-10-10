CREATE TABLE IF NOT EXISTS game_server_registry (
  server_id TEXT PRIMARY KEY,
  region TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  health TEXT NOT NULL,
  player_count INTEGER NOT NULL DEFAULT 0,
  capacity INTEGER NOT NULL,
  cpu_load REAL NOT NULL DEFAULT 0,
  memory_load REAL NOT NULL DEFAULT 0,
  last_heartbeat_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS server_assignments (
  assignment_id UUID PRIMARY KEY,
  match_id UUID NOT NULL,
  server_id TEXT NOT NULL,
  region TEXT NOT NULL,
  credential_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS map_votes (
  vote_id UUID PRIMARY KEY,
  match_id UUID NOT NULL,
  mode_id TEXT NOT NULL,
  vote_json JSONB NOT NULL,
  selected_map_id TEXT,
  closes_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_game_server_registry_region
ON game_server_registry(region, health);
