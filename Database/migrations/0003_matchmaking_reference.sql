-- Reference schema for future durable matchmaking/session history.
-- The current starter matchmaking service is intentionally in-memory only.
CREATE TABLE IF NOT EXISTS match_records (
    match_id UUID PRIMARY KEY,
    section_id TEXT NOT NULL,
    playlist TEXT NOT NULL,
    region TEXT NOT NULL,
    state TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS match_players (
    match_id UUID NOT NULL REFERENCES match_records(match_id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES player_profiles(player_id) ON DELETE CASCADE,
    team_id TEXT,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (match_id, player_id)
);
