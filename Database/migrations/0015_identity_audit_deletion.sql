CREATE TABLE IF NOT EXISTS player_identity_links (
  player_id UUID PRIMARY KEY REFERENCES player_profiles(player_id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  subject_ref TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (provider, subject_ref)
);

CREATE TABLE IF NOT EXISTS identity_audit_events (
  event_id UUID PRIMARY KEY,
  player_id UUID,
  event_type TEXT NOT NULL,
  metadata_json JSONB NOT NULL DEFAULT '{}',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS data_deletion_requests (
  request_id UUID PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES player_profiles(player_id) ON DELETE CASCADE,
  state TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMPTZ
);
