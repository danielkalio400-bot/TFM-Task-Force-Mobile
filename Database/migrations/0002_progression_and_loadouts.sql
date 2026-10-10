-- Reference schema only; not automatically applied by the scaffold.
-- Server-side authorization must derive player identity from a validated session.
CREATE TABLE IF NOT EXISTS player_progression (
    player_id UUID PRIMARY KEY REFERENCES player_profiles(player_id) ON DELETE CASCADE,
    level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
    experience BIGINT NOT NULL DEFAULT 0 CHECK (experience >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS player_loadouts (
    player_id UUID NOT NULL REFERENCES player_profiles(player_id) ON DELETE CASCADE,
    loadout_id TEXT NOT NULL,
    loadout_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (player_id, loadout_id)
);
