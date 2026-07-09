-- Phase 2 SCAFFOLD. Tables only — no Phase 1 code path reads or writes these.
-- Applying this migration is safe and changes nothing the client sees. It exists
-- so Phase 2 (selections, contextual messaging, action centre) can be built
-- without a second migration of the Phase 1 tables.
--
-- Phase 3 (variations, invoices, warranty) is intentionally NOT scaffolded here:
-- those are legally significant workflows and their fields should be settled
-- with legal/process review, not guessed at now. See PORTAL.md.
--
-- Apply:
--   npx wrangler d1 execute siari_build --remote --file=./migrations/0003_portal_phase2_scaffold.sql

-- -------------------------------------------------------------- selections ---

CREATE TABLE IF NOT EXISTS selection_items (
  id                  TEXT PRIMARY KEY,
  project_id          TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category            TEXT,
  room_area           TEXT,
  item_name           TEXT NOT NULL,
  description         TEXT,
  allowance_amount    REAL,
  due_date            TEXT,
  status              TEXT NOT NULL DEFAULT 'not_started'
                        CHECK (status IN ('not_started','options_shared','awaiting_client','selected',
                                          'approved','locked','changed','cancelled')),
  selected_option_id  TEXT,
  -- A selection is NOT a variation. It only becomes variation-related when it
  -- changes scope, contract sum, completion date, or contract documents.
  price_impact        REAL,
  time_impact_days    INTEGER,
  affects_variation   INTEGER NOT NULL DEFAULT 0,
  requires_approval   INTEGER NOT NULL DEFAULT 0,
  client_can_choose   INTEGER NOT NULL DEFAULT 0,  -- admin explicitly enables client choice
  client_visible      INTEGER NOT NULL DEFAULT 0,
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_selection_items_project ON selection_items (project_id, status);

CREATE TABLE IF NOT EXISTS selection_options (
  id                  TEXT PRIMARY KEY,
  selection_item_id   TEXT NOT NULL REFERENCES selection_items(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  supplier_brand      TEXT,
  sku_model           TEXT,
  colour_finish       TEXT,
  description         TEXT,
  image_storage_key   TEXT,
  unit_cost           REAL,
  allowance_delta     REAL,
  notes               TEXT,
  availability_status TEXT,
  sort_order          INTEGER NOT NULL DEFAULT 0,
  created_at          TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_selection_options_item ON selection_options (selection_item_id);

-- ------------------------------------------------- contextual messaging ---
-- Threads are always attached to an object. Deliberately not generic live chat.

CREATE TABLE IF NOT EXISTS message_threads (
  id             TEXT PRIMARY KEY,
  project_id     TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  context_type   TEXT NOT NULL
                   CHECK (context_type IN ('project','update','document','selection','variation','warranty_claim')),
  context_id     TEXT,
  subject        TEXT,
  status         TEXT NOT NULL DEFAULT 'open'
                   CHECK (status IN ('open','awaiting_builder','awaiting_client','resolved','archived')),
  owner_user_id  TEXT REFERENCES users(id),
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_threads_project ON message_threads (project_id, status);
CREATE INDEX IF NOT EXISTS idx_threads_context ON message_threads (context_type, context_id);

CREATE TABLE IF NOT EXISTS messages (
  id             TEXT PRIMARY KEY,
  thread_id      TEXT NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
  sender_user_id TEXT NOT NULL REFERENCES users(id),
  body           TEXT NOT NULL,
  -- Internal notes are stored in the same thread but never returned to clients.
  visibility     TEXT NOT NULL DEFAULT 'client_visible'
                   CHECK (visibility IN ('client_visible','internal')),
  read_at        TEXT,
  created_at     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages (thread_id, created_at);

CREATE TABLE IF NOT EXISTS message_attachments (
  id               TEXT PRIMARY KEY,
  message_id       TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  file_storage_key TEXT NOT NULL,
  filename         TEXT NOT NULL,
  mime_type        TEXT,
  size_bytes       INTEGER,
  created_at       TEXT NOT NULL
);

-- ------------------------------------------------------------ action centre ---
-- Phase 1 already renders "Nothing needs your action today" by counting rows
-- here; the table simply stays empty until Phase 2 starts writing to it.

CREATE TABLE IF NOT EXISTS action_items (
  id                 TEXT PRIMARY KEY,
  project_id         TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  assigned_user_id   TEXT REFERENCES users(id),
  type               TEXT NOT NULL
                       CHECK (type IN ('selection_due','document_review','question_reply','variation_review',
                                       'payment_notice','warranty_appointment')),
  title              TEXT NOT NULL,
  description        TEXT,
  related_entity_type TEXT,
  related_entity_id  TEXT,
  due_date           TEXT,
  status             TEXT NOT NULL DEFAULT 'open'
                       CHECK (status IN ('open','in_progress','complete','cancelled')),
  completed_at       TEXT,
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_actions_project ON action_items (project_id, status, due_date);
CREATE INDEX IF NOT EXISTS idx_actions_user ON action_items (assigned_user_id, status);
