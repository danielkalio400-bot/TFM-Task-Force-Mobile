CREATE TABLE IF NOT EXISTS service_availability_windows (
  availability_id UUID PRIMARY KEY,
  service TEXT NOT NULL,
  region TEXT NOT NULL,
  target_availability DOUBLE PRECISION NOT NULL,
  observed_availability DOUBLE PRECISION NOT NULL,
  status TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS deployment_revisions (
  deployment_id UUID PRIMARY KEY,
  service TEXT NOT NULL,
  region TEXT NOT NULL,
  version TEXT NOT NULL,
  previous_version TEXT,
  state TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS deployment_rollbacks (
  rollback_id UUID PRIMARY KEY,
  deployment_id UUID NOT NULL REFERENCES deployment_revisions(deployment_id) ON DELETE CASCADE,
  reason_code TEXT NOT NULL,
  restored_version TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crash_diagnostic_groups (
  diagnostic_id UUID PRIMARY KEY,
  service TEXT NOT NULL,
  region TEXT NOT NULL,
  build_id TEXT NOT NULL,
  signature TEXT NOT NULL,
  occurrence_count INTEGER NOT NULL DEFAULT 1,
  first_seen_at TIMESTAMPTZ NOT NULL,
  last_seen_at TIMESTAMPTZ NOT NULL,
  UNIQUE(service, region, build_id, signature)
);

CREATE TABLE IF NOT EXISTS operations_load_tests (
  test_id UUID PRIMARY KEY,
  region TEXT NOT NULL,
  target_concurrent_players INTEGER NOT NULL,
  successful_sessions INTEGER NOT NULL,
  failed_sessions INTEGER NOT NULL,
  p95_latency_ms DOUBLE PRECISION NOT NULL,
  error_rate DOUBLE PRECISION NOT NULL,
  passed BOOLEAN NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS operations_audit_events (
  event_id UUID PRIMARY KEY,
  event_type TEXT NOT NULL,
  metadata_json JSONB NOT NULL DEFAULT '{}',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
