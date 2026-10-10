CREATE TABLE IF NOT EXISTS progression_grant_receipts (
  grant_id UUID PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES player_profiles(player_id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  experience INTEGER NOT NULL DEFAULT 0,
  soft_credits INTEGER NOT NULL DEFAULT 0,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (player_id, source_type, source_id)
);

CREATE TABLE IF NOT EXISTS progression_audit_history (
  audit_id UUID PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES player_profiles(player_id) ON DELETE CASCADE,
  grant_id UUID NOT NULL REFERENCES progression_grant_receipts(grant_id) ON DELETE CASCADE,
  level_after INTEGER NOT NULL,
  total_experience_after BIGINT NOT NULL,
  metadata_json JSONB NOT NULL DEFAULT '{}',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS progression_unlocks (
  player_id UUID NOT NULL REFERENCES player_profiles(player_id) ON DELETE CASCADE,
  unlock_id TEXT NOT NULL,
  required_level INTEGER NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (player_id, unlock_id)
);

CREATE TABLE IF NOT EXISTS progression_leaderboard_snapshots (
  player_id UUID PRIMARY KEY REFERENCES player_profiles(player_id) ON DELETE CASCADE,
  level INTEGER NOT NULL,
  total_experience BIGINT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
