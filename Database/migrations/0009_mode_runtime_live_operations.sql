CREATE TABLE IF NOT EXISTS mode_runtime_state (
  match_id UUID PRIMARY KEY,
  mode_id TEXT NOT NULL,
  map_id TEXT NOT NULL,
  phase TEXT NOT NULL,
  runtime_json JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS live_operations_state (
  region TEXT PRIMARY KEY,
  matchmaking_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ranked_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  private_matches_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  new_server_assignments_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  maintenance_message TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
