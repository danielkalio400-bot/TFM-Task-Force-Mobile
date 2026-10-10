CREATE TABLE IF NOT EXISTS battle_royale_runtime (
  match_id UUID PRIMARY KEY,
  connected_players INTEGER NOT NULL,
  active_players INTEGER NOT NULL,
  active_teams INTEGER NOT NULL,
  zone_stage INTEGER NOT NULL DEFAULT 0,
  runtime_json JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS coop_mode_runtime (
  session_id UUID PRIMARY KEY,
  variant TEXT NOT NULL,
  wave_number INTEGER NOT NULL DEFAULT 1,
  participants INTEGER NOT NULL,
  remaining_objectives INTEGER NOT NULL,
  runtime_json JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS extraction_runtime (
  match_id UUID PRIMARY KEY,
  squad_size INTEGER NOT NULL,
  active_squad_members INTEGER NOT NULL,
  contracts_completed INTEGER NOT NULL DEFAULT 0,
  extraction_available BOOLEAN NOT NULL DEFAULT FALSE,
  extracted BOOLEAN NOT NULL DEFAULT FALSE,
  session_ends_at TIMESTAMPTZ NOT NULL,
  runtime_json JSONB NOT NULL DEFAULT '{}'
);
