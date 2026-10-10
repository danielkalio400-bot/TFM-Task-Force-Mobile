CREATE TABLE IF NOT EXISTS content_entitlements (
  player_id UUID NOT NULL REFERENCES player_profiles(player_id) ON DELETE CASCADE,
  pack_id TEXT NOT NULL,
  state TEXT NOT NULL,
  granted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  PRIMARY KEY (player_id, pack_id)
);

CREATE TABLE IF NOT EXISTS authoritative_recovery_records (
  recovery_id UUID PRIMARY KEY,
  match_id UUID NOT NULL,
  player_id UUID NOT NULL REFERENCES player_profiles(player_id) ON DELETE CASCADE,
  section_id TEXT NOT NULL,
  server_id TEXT,
  runtime_phase TEXT,
  snapshot_sequence BIGINT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS telemetry_gate_evaluations (
  evaluation_id UUID PRIMARY KEY,
  build_id TEXT,
  platform TEXT NOT NULL,
  state TEXT NOT NULL,
  report_json JSONB NOT NULL,
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
