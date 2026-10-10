CREATE TABLE IF NOT EXISTS map_readiness_state (
  map_id TEXT PRIMARY KEY,
  state TEXT NOT NULL DEFAULT 'concept-only',
  gameplay_validated BOOLEAN NOT NULL DEFAULT FALSE,
  navigation_validated BOOLEAN NOT NULL DEFAULT FALSE,
  mobile_performance_validated BOOLEAN NOT NULL DEFAULT FALSE,
  pc_performance_validated BOOLEAN NOT NULL DEFAULT FALSE,
  lighting_validated BOOLEAN NOT NULL DEFAULT FALSE,
  audio_validated BOOLEAN NOT NULL DEFAULT FALSE,
  qa_validated BOOLEAN NOT NULL DEFAULT FALSE,
  last_failure_code TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS session_persistence_snapshots (
  snapshot_id UUID PRIMARY KEY,
  match_id UUID NOT NULL,
  section_id TEXT NOT NULL,
  mode_id TEXT NOT NULL,
  map_id TEXT NOT NULL,
  region TEXT,
  server_id TEXT,
  runtime_phase TEXT,
  sequence BIGINT NOT NULL,
  terminal BOOLEAN NOT NULL DEFAULT FALSE,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS section_lifecycle_state (
  lifecycle_id UUID PRIMARY KEY,
  section_id TEXT NOT NULL,
  mode_id TEXT NOT NULL,
  map_id TEXT NOT NULL,
  match_id UUID,
  phase TEXT NOT NULL,
  failure_code TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_session_snapshots_match_sequence
ON session_persistence_snapshots(match_id, sequence DESC);
