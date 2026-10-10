CREATE TABLE IF NOT EXISTS content_install_state (
  player_id UUID NOT NULL REFERENCES player_profiles(player_id) ON DELETE CASCADE,
  pack_id TEXT NOT NULL,
  installed_version TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL,
  downloaded_bytes BIGINT NOT NULL DEFAULT 0,
  total_bytes BIGINT NOT NULL DEFAULT 0,
  failure_code TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (player_id, pack_id)
);

CREATE TABLE IF NOT EXISTS section_session_recovery (
  recovery_id UUID PRIMARY KEY,
  match_id UUID NOT NULL,
  player_id UUID NOT NULL REFERENCES player_profiles(player_id) ON DELETE CASCADE,
  section_id TEXT NOT NULL,
  server_id TEXT NOT NULL,
  map_id TEXT,
  runtime_phase TEXT,
  recovery_json JSONB NOT NULL DEFAULT '{}',
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_section_recovery_player_match
ON section_session_recovery(player_id, match_id, expires_at);
