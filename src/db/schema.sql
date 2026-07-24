CREATE TABLE IF NOT EXISTS stocks (
  id            TEXT PRIMARY KEY,
  ticker        TEXT NOT NULL,
  name          TEXT DEFAULT '',
  market        TEXT NOT NULL DEFAULT 'US',
  trigger_price REAL,
  warn_price    REAL,
  price         REAL,
  chg_pct       REAL,
  status        TEXT NOT NULL DEFAULT 'check',
  box_ind       TEXT NOT NULL DEFAULT 'warn',
  box_best      TEXT NOT NULL DEFAULT 'warn',
  box_up        TEXT NOT NULL DEFAULT 'warn',
  note          TEXT DEFAULT '',
  earnings_date TEXT DEFAULT '',
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(ticker)
);

CREATE TABLE IF NOT EXISTS discovery_candidates (
  id                 TEXT PRIMARY KEY,
  ticker             TEXT NOT NULL,
  name               TEXT DEFAULT '',
  market             TEXT NOT NULL DEFAULT 'US',
  verdict            TEXT NOT NULL DEFAULT 'partial',
  box_ind            TEXT NOT NULL DEFAULT 'warn',
  box_best           TEXT NOT NULL DEFAULT 'warn',
  box_up             TEXT NOT NULL DEFAULT 'warn',
  note               TEXT DEFAULT '',
  trigger_suggestion REAL,
  source_date        TEXT,
  source_excerpt     TEXT,
  created_at         TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reports (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  report_date TEXT NOT NULL,
  report_text TEXT NOT NULL,
  kind        TEXT NOT NULL DEFAULT 'manual_scan',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS scan_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  stock_id    TEXT NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  scanned_at  TEXT NOT NULL DEFAULT (datetime('now')),
  price       REAL,
  status      TEXT,
  box_ind     TEXT,
  box_best    TEXT,
  box_up      TEXT
);
CREATE INDEX IF NOT EXISTS idx_scan_log_stock ON scan_log(stock_id, scanned_at DESC);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT
);
