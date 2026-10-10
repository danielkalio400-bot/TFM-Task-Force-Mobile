CREATE TABLE IF NOT EXISTS parties (
  party_id UUID PRIMARY KEY,
  leader_player_id UUID NOT NULL REFERENCES player_profiles(player_id) ON DELETE CASCADE,
  maximum_members INTEGER NOT NULL DEFAULT 4,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS party_members (
  party_id UUID NOT NULL REFERENCES parties(party_id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES player_profiles(player_id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  role TEXT NOT NULL,
  skill_rating INTEGER NOT NULL DEFAULT 0,
  ready INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (party_id, player_id)
);

CREATE TABLE IF NOT EXISTS match_reward_grants (
  match_id UUID NOT NULL,
  player_id UUID NOT NULL REFERENCES player_profiles(player_id) ON DELETE CASCADE,
  experience BIGINT NOT NULL DEFAULT 0,
  soft_credits INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (match_id, player_id)
);

CREATE TABLE IF NOT EXISTS reconnect_restore_state (
  restore_id UUID PRIMARY KEY,
  match_id UUID NOT NULL,
  player_id UUID NOT NULL REFERENCES player_profiles(player_id) ON DELETE CASCADE,
  server_id TEXT NOT NULL,
  restore_json JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ
);
