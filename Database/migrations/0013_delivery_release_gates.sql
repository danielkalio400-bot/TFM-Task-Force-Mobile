CREATE TABLE IF NOT EXISTS content_delivery_packages (
  package_id TEXT PRIMARY KEY,
  pack_id TEXT NOT NULL,
  version TEXT NOT NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  integrity_tag TEXT NOT NULL,
  state TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS release_readiness_evaluations (
  evaluation_id UUID PRIMARY KEY,
  build_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  state TEXT NOT NULL,
  report_json JSONB NOT NULL,
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_delivery_pack_version
ON content_delivery_packages(pack_id, version);
