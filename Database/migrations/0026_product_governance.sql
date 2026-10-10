CREATE TABLE IF NOT EXISTS product_governance_risks (
  risk_id UUID PRIMARY KEY,
  category TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  mitigation_evidence_reference TEXT,
  owner_tag TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_governance_evidence (
  evidence_id UUID PRIMARY KEY,
  requirement TEXT NOT NULL UNIQUE,
  evidence_reference TEXT NOT NULL,
  passed BOOLEAN NOT NULL DEFAULT FALSE,
  notes_tag TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS device_validation_profiles (
  profile_id UUID PRIMARY KEY,
  platform TEXT NOT NULL,
  device_class TEXT NOT NULL,
  build_id TEXT NOT NULL,
  average_fps DOUBLE PRECISION NOT NULL DEFAULT 0,
  peak_memory_bytes BIGINT NOT NULL DEFAULT 0,
  physical_device_tested BOOLEAN NOT NULL DEFAULT FALSE,
  passed BOOLEAN NOT NULL DEFAULT FALSE,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS asset_provenance_records (
  record_id UUID PRIMARY KEY,
  asset_id TEXT NOT NULL UNIQUE,
  source_type TEXT NOT NULL,
  rights_evidence_reference TEXT NOT NULL,
  original_or_licensed BOOLEAN NOT NULL DEFAULT FALSE,
  approved BOOLEAN NOT NULL DEFAULT FALSE,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS development_maturity_reports (
  report_id UUID PRIMARY KEY,
  requested_stage TEXT NOT NULL,
  granted_stage TEXT NOT NULL,
  blocking_requirements_json JSONB NOT NULL DEFAULT '[]',
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
