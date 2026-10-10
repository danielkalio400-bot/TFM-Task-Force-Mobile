CREATE TABLE IF NOT EXISTS progression_events (
  event_id UUID PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES player_profiles(player_id) ON DELETE CASCADE,
  experience_delta BIGINT NOT NULL DEFAULT 0 CHECK (experience_delta >= 0),
  soft_credit_delta INTEGER NOT NULL DEFAULT 0 CHECK (soft_credit_delta >= 0),
  source TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS session_recovery_records (
  recovery_id UUID PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES player_profiles(player_id) ON DELETE CASCADE,
  match_id UUID,
  state TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_recovery_player ON session_recovery_records(player_id);
