CREATE TABLE IF NOT EXISTS build_artifacts (
  artifact_id UUID PRIMARY KEY,
  platform TEXT NOT NULL,
  version TEXT NOT NULL,
  build_number INTEGER NOT NULL,
  source_commit TEXT NOT NULL,
  unity_version TEXT NOT NULL,
  artifact_integrity_reference TEXT NOT NULL,
  signing_identity_reference TEXT NOT NULL,
  content_manifest_reference TEXT NOT NULL,
  state TEXT NOT NULL,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS build_artifact_verifications (
  verification_id UUID PRIMARY KEY,
  artifact_id UUID NOT NULL REFERENCES build_artifacts(artifact_id) ON DELETE CASCADE,
  passed BOOLEAN NOT NULL,
  blocking_reasons_json JSONB NOT NULL DEFAULT '[]',
  verified_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS build_provenance_audit (
  event_id UUID PRIMARY KEY,
  event_type TEXT NOT NULL,
  metadata_json JSONB NOT NULL DEFAULT '{}',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_build_artifact_platform_build
ON build_artifacts(platform, build_number);
