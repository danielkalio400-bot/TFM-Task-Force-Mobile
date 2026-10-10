CREATE TABLE IF NOT EXISTS moderation_sanctions (
  sanction_id UUID PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES player_profiles(player_id) ON DELETE CASCADE,
  sanction_type TEXT NOT NULL,
  reason_code TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS player_consent_settings (
  player_id UUID PRIMARY KEY REFERENCES player_profiles(player_id) ON DELETE CASCADE,
  settings_json JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  player_id UUID PRIMARY KEY REFERENCES player_profiles(player_id) ON DELETE CASCADE,
  settings_json JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS social_action_rate_limits (
  player_id UUID NOT NULL REFERENCES player_profiles(player_id) ON DELETE CASCADE,
  action_key TEXT NOT NULL,
  used_count INTEGER NOT NULL DEFAULT 0,
  window_ends_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (player_id, action_key)
);
