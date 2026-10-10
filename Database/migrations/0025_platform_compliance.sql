CREATE TABLE IF NOT EXISTS platform_compliance_checks (
  check_id UUID PRIMARY KEY,
  platform TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL,
  evidence_reference TEXT,
  required BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(platform, category)
);

CREATE TABLE IF NOT EXISTS release_certification_reports (
  report_id UUID PRIMARY KEY,
  platform TEXT NOT NULL,
  channel TEXT NOT NULL,
  version TEXT NOT NULL,
  build_number INTEGER NOT NULL,
  state TEXT NOT NULL,
  blocking_checks_json JSONB NOT NULL DEFAULT '[]',
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS platform_compliance_audit (
  event_id UUID PRIMARY KEY,
  event_type TEXT NOT NULL,
  metadata_json JSONB NOT NULL DEFAULT '{}',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
