CREATE TABLE IF NOT EXISTS matchmaking_search_tickets (
  ticket_id UUID PRIMARY KEY,
  party_id UUID NOT NULL,
  section_id TEXT NOT NULL,
  mode_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  player_ids_json JSONB NOT NULL,
  preferred_regions_json JSONB NOT NULL,
  skill_rating INTEGER NOT NULL DEFAULT 0,
  allow_cross_platform BOOLEAN NOT NULL DEFAULT TRUE,
  state TEXT NOT NULL,
  match_id UUID,
  created_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS matchmaking_assignments (
  match_id UUID PRIMARY KEY,
  region TEXT NOT NULL,
  section_id TEXT NOT NULL,
  mode_id TEXT NOT NULL,
  ticket_ids_json JSONB NOT NULL,
  player_ids_json JSONB NOT NULL,
  party_ids_json JSONB NOT NULL,
  platforms_json JSONB NOT NULL,
  skill_spread INTEGER NOT NULL,
  allowed_skill_delta INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_matchmaking_search_state_created
ON matchmaking_search_tickets(state, created_at);

CREATE INDEX IF NOT EXISTS idx_matchmaking_search_region
ON matchmaking_search_tickets USING GIN(preferred_regions_json);
