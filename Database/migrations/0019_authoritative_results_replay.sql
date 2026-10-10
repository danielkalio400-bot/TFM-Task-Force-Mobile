CREATE TABLE IF NOT EXISTS authoritative_match_archive (
  archive_id UUID PRIMARY KEY,
  match_id UUID NOT NULL UNIQUE,
  server_id TEXT NOT NULL,
  section_id TEXT NOT NULL,
  mode_id TEXT NOT NULL,
  map_id TEXT NOT NULL,
  winning_team_id TEXT,
  validation_proof_id TEXT NOT NULL,
  validation_state TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL,
  record_json JSONB NOT NULL,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS replay_telemetry_events (
  event_id UUID PRIMARY KEY,
  match_id UUID NOT NULL,
  sequence BIGINT NOT NULL,
  match_time_milliseconds BIGINT NOT NULL DEFAULT 0,
  event_type TEXT NOT NULL,
  actor_player_id UUID,
  target_player_id UUID,
  objective_id TEXT,
  metadata_tag TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (match_id, sequence)
);

CREATE TABLE IF NOT EXISTS replay_telemetry_manifests (
  match_id UUID PRIMARY KEY,
  event_count BIGINT NOT NULL DEFAULT 0,
  first_sequence BIGINT NOT NULL DEFAULT 0,
  last_sequence BIGINT NOT NULL DEFAULT 0,
  complete BOOLEAN NOT NULL DEFAULT FALSE,
  validation_state TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
