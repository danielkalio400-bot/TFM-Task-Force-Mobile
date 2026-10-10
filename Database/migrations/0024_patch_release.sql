CREATE TABLE IF NOT EXISTS patch_manifests (
  patch_id UUID PRIMARY KEY,
  platform TEXT NOT NULL,
  channel TEXT NOT NULL,
  version TEXT NOT NULL,
  minimum_supported_build INTEGER NOT NULL DEFAULT 0,
  target_build INTEGER NOT NULL,
  integrity_tag TEXT NOT NULL,
  previous_patch_id UUID,
  required BOOLEAN NOT NULL DEFAULT FALSE,
  rollout_percent INTEGER NOT NULL DEFAULT 0 CHECK (rollout_percent BETWEEN 0 AND 100),
  state TEXT NOT NULL,
  package_ids_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS patch_release_audit (
  event_id UUID PRIMARY KEY,
  patch_id UUID,
  event_type TEXT NOT NULL,
  metadata_json JSONB NOT NULL DEFAULT '{}',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patch_manifests_channel
ON patch_manifests(platform, channel, state, target_build DESC);
