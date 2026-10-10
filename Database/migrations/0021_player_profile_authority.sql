CREATE TABLE IF NOT EXISTS player_identity_subject_links (
  player_id UUID PRIMARY KEY REFERENCES player_profiles(player_id) ON DELETE CASCADE,
  identity_provider TEXT NOT NULL,
  subject_reference TEXT NOT NULL,
  lifecycle_state TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (identity_provider, subject_reference)
);

CREATE TABLE IF NOT EXISTS player_profile_audit_history (
  audit_id UUID PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES player_profiles(player_id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  metadata_json JSONB NOT NULL DEFAULT '{}',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_player_profile_lifecycle
ON player_identity_subject_links(lifecycle_state);
