CREATE TABLE IF NOT EXISTS regional_queue_entries (
  queue_entry_id UUID PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES player_profiles(player_id) ON DELETE CASCADE,
  mode_id TEXT NOT NULL,
  region TEXT NOT NULL,
  party_size INTEGER NOT NULL,
  skill_rating INTEGER NOT NULL,
  state TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS match_session_state (
  match_id UUID PRIMARY KEY,
  mode_id TEXT NOT NULL,
  region TEXT NOT NULL,
  server_id TEXT,
  phase TEXT NOT NULL,
  failure_code TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS operational_incidents (
  incident_id UUID PRIMARY KEY,
  service TEXT NOT NULL,
  region TEXT,
  code TEXT NOT NULL,
  severity TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fairplay_signals (
  signal_id UUID PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES player_profiles(player_id) ON DELETE CASCADE,
  match_id UUID,
  signal_type TEXT NOT NULL,
  confidence REAL NOT NULL,
  review_context TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'review-pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
