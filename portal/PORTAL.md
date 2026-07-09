# Client portal — Phase 1 build + Phase 2 scaffold

## Architecture, and why

The brief's hard constraint — *"Do not implement the client portal as static generated
pages containing private data"* — collides with two facts about this codebase:
the site is SSG (`ssr: false`), and the Sanity dataset is **public-read**.

So the portal is a **separate secure application layer** sharing the same deploy:

| Concern | Where it lives | Why |
|---|---|---|
| Public marketing content | Sanity (unchanged) | Public by design |
| Portal data | **Cloudflare D1** | Private, relational, already bound |
| Portal files | **Cloudflare R2** | Never public; streamed through an authorising Function |
| Portal API | `functions/api/portal/[[path]].ts` | Server-side authz on every call |
| Portal UI | `app/routes/portal/*` | Client-rendered SPA shell — **zero data prerendered** |

Portal routes are deliberately **absent from `react-router.config.ts`'s prerender
list**. `public/_redirects` rewrites `/portal/*` to a bare shell (`portal-shell.html`,
200). The static HTML contains no project data of any kind; everything arrives via
authenticated `fetch` after login.

## Security model

- **Auth: passwordless magic link.** Invite-only, and Phase 1 is read-only, so there
  are no passwords to leak or reuse. Tokens are single-use, 15 min (login) / 7 days
  (invite). Sessions are opaque 256-bit tokens; **only their SHA-256 hash is stored**,
  so a database dump cannot be replayed as a session.
- **Cookie:** `HttpOnly` (XSS cannot lift it), `Secure`, `SameSite=Lax` (blocks basic
  CSRF), 12-hour expiry.
- **Authorization:** one gate, `requireProjectAccess()`. No handler reads project data
  before it resolves. A `project_id` from the client is **never** trusted.
- **404, not 403**, for non-members and for admin routes hit by clients — so URL probing
  cannot enumerate project ids or discover the admin surface.
- **No account enumeration:** `request-link` returns an identical 200 for known and
  unknown emails.
- **Files:** R2 keys (`projects/<id>/documents/<uuid>`) never leave the server. The only
  read path is `GET /api/portal/documents/:versionId/download`, which checks membership,
  checks client-visibility, writes an audit event, then streams. No public URL exists.
- **Audit:** login, logout, publish, edit-after-publish, upload, download, invite, and
  access-revocation all write to `audit_events` with actor, IP, and user agent.
- **Revocation kills live sessions**, not just future reads.
- **Nothing is overwritten:** a new document revision inserts a new `document_versions`
  row and repoints `current_version_id`; the old file and row remain.

Verified against a real SQLite engine (not asserted): drafts and `client_visible = 0`
rows are invisible to clients; a client swapping the project id in a URL gets no
membership row; revoking a member removes access immediately.

## Progress calculation

`progress_mode` in `portal_settings` is **`manual`** — the dashboard shows the percentage
an admin typed, labelled *"Set by your project manager, not auto-calculated."* This is
the brief's stated preference, and it avoids false precision. `project_stages.weight`
exists so weighted progress can be turned on later without a migration.

## Setup

```bash
# 1. Storage for private files
npx wrangler r2 bucket create siari-portal-files

# 2. Schema (D1 database already exists from the contact form)
npx wrangler d1 execute siari_build --remote --file=./migrations/0002_portal_phase1.sql
npx wrangler d1 execute siari_build --remote --file=./migrations/0003_portal_phase2_scaffold.sql

# 3. Optional demo data — EDIT THE EMAILS IN THE FILE FIRST
npx wrangler d1 execute siari_build --remote --file=./migrations/seed_portal_demo.sql

# 4. Make yourself an owner_admin (there is no bootstrap UI, by design)
npx wrangler d1 execute siari_build --remote --command \
  "INSERT INTO users (id,email,name,role,status,created_at,updated_at)
   VALUES (lower(hex(randomblob(16))),'you@siaribuild.com.au','Your Name','owner_admin','active',datetime('now'),datetime('now'))"
```

Then deploy. Required env on the Pages project: `RESEND_API_KEY` (secret), `MAIL_FROM`,
and **`SITE_URL`** (plain text, e.g. `https://siaribuild.com.au`) — the last is new; the
portal builds invite links from it. `wrangler.toml` already declares the `DB` and
`PORTAL_FILES` bindings; paste your real `database_id`.

To sign in the first time, go to `/portal/login` and request a link.

## What is built (Phase 1)

Against the brief's acceptance criteria:

| Criterion | Status |
|---|---|
| Client invited, logs in, sees only their project | ✅ |
| Client cannot reach another project by changing the URL | ✅ (404, verified) |
| Overview, stages, updates, documents | ✅ |
| Drafts and private documents invisible to clients | ✅ (verified) |
| Admin publishes an update, optionally notifies | ✅ |
| Admin uploads a document, marks client-visible | ✅ |
| Downloads protected, not public static links | ✅ |
| Publish/edit/upload/download/login auditable | ✅ |
| Dashboard states whether anything needs the client | ✅ |
| No live variation approval, payment, or legal sign-off | ✅ (not implemented) |

Also done: multi-project switcher, tentative-date labelling, "Nothing needs your action
today", all five required empty states, `noindex` + `no-store` on portal routes, and
`Disallow: /portal` in robots.

## What is scaffolded, not built (Phase 2)

`migrations/0003` creates `selection_items`, `selection_options`, `message_threads`,
`messages`, `message_attachments`, `action_items`. **No Phase 1 code writes to them.**
The one live connection is deliberate: the dashboard's "Awaiting you" panel already
queries `action_items`, so it always renders the honest empty state today and needs no
change when Phase 2 starts writing rows.

Phase 2 UI (selections screens, contextual message threads, the action centre page) is
**not** built. The nav intentionally does not show a disabled "Selections" tab — the
brief warns that must not create user confusion, and a dead tab does.

## What is deliberately NOT scaffolded (Phase 3)

No tables for variations, invoices, or warranty claims. These are legally significant
workflows — approval must capture identity, timestamp, IP/device, document version, and
the exact accepted content. Guessing that schema now would invite someone to wire a
casual "Approve" button to contract-changing work. Design it with legal review.

## Known gaps / next steps

1. **Admin cannot yet create projects or edit stages from the UI.** Both are D1 rows;
   the API for it is not written. Today that needs a `wrangler d1 execute`. This is the
   biggest gap against "publish project information without developer involvement" —
   updates and documents are covered, project/stage setup is not.
2. **Update photo attachments**: the `update_attachments` table and API read path exist;
   the admin upload UI only handles documents, not inline photos with captions.
3. **Rate limiting** on `/api/portal/auth/request-link` — reuse the KV throttle pattern
   from the contact form before going live, or a stranger can trigger unlimited emails
   to a known client address.
4. **Session expiry is absolute (12h), not sliding.** Fine for read-only; revisit if
   clients complain.
5. **No tests.** The security invariants above were verified by executing the real SQL,
   but there is no automated suite guarding them against regression.
