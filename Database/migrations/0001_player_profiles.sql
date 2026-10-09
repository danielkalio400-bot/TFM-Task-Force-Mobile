-- Reference schema only; not automatically applied by the scaffold.
-- Authentication must verify BazID OIDC tokens before creating profiles.
CREATE TABLE IF NOT EXISTS player_profiles (
    player_id UUID PRIMARY KEY,
    bazid_subject TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);