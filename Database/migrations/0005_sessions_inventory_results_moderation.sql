CREATE TABLE IF NOT EXISTS game_sessions (
  session_id UUID PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES player_profiles(player_id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory_transactions (
  transaction_id UUID PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES player_profiles(player_id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  mutation_kind TEXT NOT NULL,
  authority_source TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS authoritative_match_results (
  match_id UUID PRIMARY KEY,
  server_id TEXT NOT NULL,
  mode_id TEXT NOT NULL,
  result_json JSONB NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS player_reports (
  report_id UUID PRIMARY KEY,
  reporter_player_id UUID NOT NULL REFERENCES player_profiles(player_id) ON DELETE CASCADE,
  reported_player_id UUID NOT NULL REFERENCES player_profiles(player_id) ON DELETE CASCADE,
  match_id UUID,
  category TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'received',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_player
ON inventory_transactions(player_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_player_reports_reported
ON player_reports(reported_player_id, created_at DESC);
