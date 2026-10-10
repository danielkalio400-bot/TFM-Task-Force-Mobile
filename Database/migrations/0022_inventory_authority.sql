CREATE TABLE IF NOT EXISTS inventory_authority_transactions (
  transaction_id UUID PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES player_profiles(player_id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  mutation_kind TEXT NOT NULL,
  authority_source TEXT NOT NULL,
  source_id TEXT NOT NULL,
  balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (player_id, item_id, mutation_kind, authority_source, source_id)
);

CREATE TABLE IF NOT EXISTS inventory_balance_snapshots (
  player_id UUID NOT NULL REFERENCES player_profiles(player_id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (player_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_authority_player_created
ON inventory_authority_transactions(player_id, created_at DESC);
