-- Cloudflare D1 schema for contact form submissions (private store).
--
-- Apply to the LOCAL dev DB:
--   npx wrangler d1 execute siari_build --local  --file=./migrations/0001_contact_submissions.sql
-- Apply to the REMOTE (production) DB:
--   npx wrangler d1 execute siari_build --remote --file=./migrations/0001_contact_submissions.sql

CREATE TABLE IF NOT EXISTS contact_submissions (
  id            TEXT PRIMARY KEY,
  first_name    TEXT NOT NULL,
  last_name     TEXT,
  email         TEXT NOT NULL,
  phone         TEXT,
  project_type  TEXT,
  message       TEXT NOT NULL,
  submitted_at  TEXT NOT NULL,   -- ISO 8601 timestamp
  ip            TEXT             -- optional; drop this column if you'd rather not retain IPs
);

CREATE INDEX IF NOT EXISTS idx_contact_submitted_at ON contact_submissions (submitted_at);
