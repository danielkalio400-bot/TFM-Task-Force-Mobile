CREATE TABLE IF NOT EXISTS friend_requests (
  request_id UUID PRIMARY KEY,
  sender_player_id UUID NOT NULL REFERENCES player_profiles(player_id) ON DELETE CASCADE,
  recipient_player_id UUID NOT NULL REFERENCES player_profiles(player_id) ON DELETE CASCADE,
  state TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS friend_relationships (
  player_a_id UUID NOT NULL REFERENCES player_profiles(player_id) ON DELETE CASCADE,
  player_b_id UUID NOT NULL REFERENCES player_profiles(player_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (player_a_id, player_b_id)
);

CREATE TABLE IF NOT EXISTS player_blocks (
  player_id UUID NOT NULL REFERENCES player_profiles(player_id) ON DELETE CASCADE,
  blocked_player_id UUID NOT NULL REFERENCES player_profiles(player_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (player_id, blocked_player_id)
);

CREATE TABLE IF NOT EXISTS player_privacy_settings (
  player_id UUID PRIMARY KEY REFERENCES player_profiles(player_id) ON DELETE CASCADE,
  settings_json JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clans (
  clan_id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  tag TEXT NOT NULL,
  privacy TEXT NOT NULL,
  member_limit INTEGER NOT NULL DEFAULT 50,
  recruitment_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clan_members (
  clan_id UUID NOT NULL REFERENCES clans(clan_id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES player_profiles(player_id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (clan_id, player_id)
);
