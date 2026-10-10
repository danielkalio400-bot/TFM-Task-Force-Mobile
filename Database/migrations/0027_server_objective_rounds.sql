-- Prospective schema. The development server remains in-memory only.
-- Production writes must be restricted to authenticated dedicated servers.
CREATE TABLE IF NOT EXISTS objective_match_sessions (
  match_id TEXT PRIMARY KEY,
  server_id TEXT NOT NULL,
  map_id TEXT NOT NULL,
  phase TEXT NOT NULL CHECK(phase IN ('warmup','active','completed','expired','cancelled')),
  phase_revision INTEGER NOT NULL CHECK(phase_revision >= 0),
  max_points INTEGER NOT NULL CHECK(max_points BETWEEN 1 AND 1000),
  score_alpha INTEGER NOT NULL DEFAULT 0,
  score_bravo INTEGER NOT NULL DEFAULT 0,
  winning_team_id TEXT,
  started_at_ms BIGINT,
  ended_at_ms BIGINT
);
CREATE TABLE IF NOT EXISTS objective_match_events (
  match_id TEXT NOT NULL REFERENCES objective_match_sessions(match_id),
  sequence INTEGER NOT NULL,
  request_id TEXT,
  event_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  emitted_at_ms BIGINT NOT NULL,
  PRIMARY KEY(match_id,sequence),
  UNIQUE(match_id,request_id)
);
