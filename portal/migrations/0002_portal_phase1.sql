-- Phase 1 client portal schema.
--
-- Apply:
--   npx wrangler d1 execute siari_build --remote --file=./migrations/0002_portal_phase1.sql
--
-- Design notes:
--  * No private data lives in Sanity (public-read dataset). Everything here is
--    reachable only via authenticated Functions that check ProjectMember.
--  * Files are NOT stored here — only R2 storage keys. Downloads stream through
--    an authorising Function, so object keys are never guessable public URLs.
--  * Nothing is destructively overwritten: documents gain versions, updates gain
--    audit events, statuses move through explicit publication states.

-- ---------------------------------------------------------------- identity ---

CREATE TABLE IF NOT EXISTS users (
  id               TEXT PRIMARY KEY,
  email            TEXT NOT NULL UNIQUE,       -- stored lowercased
  name             TEXT,
  role             TEXT NOT NULL DEFAULT 'client'
                     CHECK (role IN ('client','viewer','content_admin','project_manager','owner_admin')),
  status           TEXT NOT NULL DEFAULT 'invited'
                     CHECK (status IN ('invited','active','disabled')),
  last_login_at    TEXT,
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- Opaque session tokens. Only the SHA-256 hash is stored, so a DB read cannot
-- be replayed as a session.
CREATE TABLE IF NOT EXISTS sessions (
  id               TEXT PRIMARY KEY,           -- sha256(token)
  user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at       TEXT NOT NULL,
  created_at       TEXT NOT NULL,
  revoked_at       TEXT,
  ip_address       TEXT,
  user_agent       TEXT
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id);

-- Single-use, short-lived tokens for invite acceptance and magic-link login.
CREATE TABLE IF NOT EXISTS login_tokens (
  id               TEXT PRIMARY KEY,           -- sha256(token)
  user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose          TEXT NOT NULL CHECK (purpose IN ('invite','login')),
  expires_at       TEXT NOT NULL,
  used_at          TEXT,
  created_at       TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_login_tokens_user ON login_tokens (user_id);

-- ---------------------------------------------------------------- projects ---

CREATE TABLE IF NOT EXISTS projects (
  id                        TEXT PRIMARY KEY,
  name                      TEXT NOT NULL,
  address                   TEXT,
  suburb                    TEXT,
  state                     TEXT,
  project_type              TEXT,
  description               TEXT,
  client_summary            TEXT,
  project_manager_user_id   TEXT REFERENCES users(id),
  current_stage_id          TEXT,
  progress_percent          INTEGER CHECK (progress_percent BETWEEN 0 AND 100),
  progress_label            TEXT,
  next_milestone_name       TEXT,
  next_milestone_date       TEXT,
  -- Dates are never implied to be guaranteed unless explicitly confirmed.
  next_milestone_confirmed  INTEGER NOT NULL DEFAULT 0,
  estimated_completion_label TEXT,
  status                    TEXT NOT NULL DEFAULT 'active'
                              CHECK (status IN ('active','paused','complete','archived')),
  is_demo                   INTEGER NOT NULL DEFAULT 0,
  created_at                TEXT NOT NULL,
  updated_at                TEXT NOT NULL
);

-- The authorization spine. A client sees a project only via an active row here.
CREATE TABLE IF NOT EXISTS project_members (
  id             TEXT PRIMARY KEY,
  project_id     TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member_type    TEXT NOT NULL CHECK (member_type IN ('client','admin')),
  access_level   TEXT NOT NULL
                   CHECK (access_level IN ('owner_client','secondary_client','project_manager','admin_viewer')),
  status         TEXT NOT NULL DEFAULT 'invited'
                   CHECK (status IN ('invited','active','revoked')),
  invited_at     TEXT,
  accepted_at    TEXT,
  revoked_at     TEXT,
  created_at     TEXT NOT NULL,
  UNIQUE (project_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_members_user ON project_members (user_id, status);
CREATE INDEX IF NOT EXISTS idx_members_project ON project_members (project_id, status);

CREATE TABLE IF NOT EXISTS project_contacts (
  id             TEXT PRIMARY KEY,
  project_id     TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  role           TEXT NOT NULL,
  email          TEXT,
  phone          TEXT,
  client_visible INTEGER NOT NULL DEFAULT 0,   -- subcontractors hidden by default
  sort_order     INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_contacts_project ON project_contacts (project_id, client_visible);

-- ------------------------------------------------------------------ stages ---

CREATE TABLE IF NOT EXISTS stage_templates (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  description  TEXT,
  sort_order   INTEGER NOT NULL,
  created_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS project_stages (
  id                    TEXT PRIMARY KEY,
  project_id            TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  stage_number          INTEGER NOT NULL,
  name                  TEXT NOT NULL,
  client_description    TEXT,
  status                TEXT NOT NULL DEFAULT 'not_started'
                          CHECK (status IN ('not_started','in_progress','complete','delayed','skipped')),
  target_start_date     TEXT,
  target_completion_date TEXT,
  actual_start_date     TEXT,
  actual_completion_date TEXT,
  client_note           TEXT,   -- client-facing only; never internal blockers
  milestone_date        TEXT,
  weight                INTEGER NOT NULL DEFAULT 1,  -- only used if weighted progress is enabled
  sort_order            INTEGER NOT NULL,
  client_visible        INTEGER NOT NULL DEFAULT 1,
  created_at            TEXT NOT NULL,
  updated_at            TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_stages_project ON project_stages (project_id, sort_order);

-- ----------------------------------------------------------------- updates ---

CREATE TABLE IF NOT EXISTS project_updates (
  id              TEXT PRIMARY KEY,
  project_id      TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  stage_id        TEXT REFERENCES project_stages(id),
  category        TEXT,
  status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','published','archived')),
  client_visible  INTEGER NOT NULL DEFAULT 1,
  pinned          INTEGER NOT NULL DEFAULT 0,
  published_at    TEXT,
  notify_client   INTEGER NOT NULL DEFAULT 0,
  author_user_id  TEXT REFERENCES users(id),
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_updates_project ON project_updates (project_id, status, published_at DESC);

CREATE TABLE IF NOT EXISTS update_attachments (
  id              TEXT PRIMARY KEY,
  update_id       TEXT NOT NULL REFERENCES project_updates(id) ON DELETE CASCADE,
  kind            TEXT NOT NULL CHECK (kind IN ('photo','document')),
  file_storage_key TEXT,                       -- R2 key (photos)
  document_id     TEXT REFERENCES documents(id),
  caption         TEXT,
  mime_type       TEXT,
  size_bytes      INTEGER,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_update_attachments ON update_attachments (update_id);

-- --------------------------------------------------------------- documents ---

CREATE TABLE IF NOT EXISTS documents (
  id                  TEXT PRIMARY KEY,
  project_id          TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  display_name        TEXT NOT NULL,
  document_type       TEXT NOT NULL
                        CHECK (document_type IN ('contract','plans','permit','engineering','soil_report',
                                                 'colour_finishes_schedule','selection_schedule','invoice',
                                                 'variation','warranty','handover','other')),
  current_version_id  TEXT,
  status              TEXT NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft','current','superseded','archived')),
  client_visible      INTEGER NOT NULL DEFAULT 0,
  description         TEXT,
  effective_date      TEXT,
  related_stage_id    TEXT REFERENCES project_stages(id),
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_documents_project ON documents (project_id, status, client_visible);

-- A new revision NEVER overwrites the previous file: it inserts a new row and
-- repoints documents.current_version_id.
CREATE TABLE IF NOT EXISTS document_versions (
  id                 TEXT PRIMARY KEY,
  document_id        TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  file_storage_key   TEXT NOT NULL,            -- R2 key; never exposed to the client
  filename           TEXT NOT NULL,
  mime_type          TEXT NOT NULL,
  size_bytes         INTEGER NOT NULL,
  revision_label     TEXT,                     -- e.g. "Rev C"
  client_visible     INTEGER NOT NULL DEFAULT 1, -- a superseded revision may stay visible
  uploaded_by_user_id TEXT REFERENCES users(id),
  uploaded_at        TEXT NOT NULL,
  superseded_at      TEXT
);
CREATE INDEX IF NOT EXISTS idx_versions_document ON document_versions (document_id, uploaded_at DESC);

-- ------------------------------------------------- audit & notifications ---

CREATE TABLE IF NOT EXISTS audit_events (
  id              TEXT PRIMARY KEY,
  actor_user_id   TEXT REFERENCES users(id),
  project_id      TEXT REFERENCES projects(id),
  entity_type     TEXT NOT NULL,
  entity_id       TEXT,
  action          TEXT NOT NULL,   -- login, publish, unpublish, upload, download, revoke, ...
  before_snapshot TEXT,            -- JSON
  after_snapshot  TEXT,            -- JSON
  ip_address      TEXT,
  user_agent      TEXT,
  created_at      TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_project ON audit_events (project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_events (entity_type, entity_id);

CREATE TABLE IF NOT EXISTS notifications (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id    TEXT REFERENCES projects(id) ON DELETE CASCADE,
  type          TEXT NOT NULL
                  CHECK (type IN ('client_invited','update_published','document_published','action_created',
                                  'action_due_soon','message_received','selection_due','variation_issued',
                                  'warranty_updated')),
  entity_type   TEXT,
  entity_id     TEXT,
  channel       TEXT NOT NULL DEFAULT 'email',
  sent_at       TEXT,
  error         TEXT,
  created_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS portal_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

-- Progress model. Phase 1 default is manual, to avoid false precision.
INSERT OR IGNORE INTO portal_settings (key, value, updated_at)
VALUES ('progress_mode', 'manual', datetime('now'));
