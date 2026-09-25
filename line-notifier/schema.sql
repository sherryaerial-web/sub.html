CREATE TABLE IF NOT EXISTS recipients (
  role TEXT PRIMARY KEY CHECK(role IN ('ivy','tako')),
  user_id TEXT UNIQUE,
  code_hash TEXT,
  code_expires INTEGER,
  bound_at INTEGER
);
CREATE TABLE IF NOT EXISTS nonces (nonce TEXT PRIMARY KEY, expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS outbox (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  retry_key TEXT NOT NULL UNIQUE,
  expires INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  next_at INTEGER NOT NULL DEFAULT 0,
  lease_until INTEGER NOT NULL DEFAULT 0,
  lease_token TEXT,
  last_error TEXT,
  conflict_reason TEXT,
  conflict_at INTEGER,
  accepted_at INTEGER
);
CREATE INDEX IF NOT EXISTS outbox_due ON outbox(status,next_at);
