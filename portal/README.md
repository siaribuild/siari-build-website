# Siari Build — client portal

A standalone **Cloudflare Worker** serving a private, invite-only client portal at
`portal.siaribuild.com.au`. Phase 1 complete; Phase 2 scaffolded.

The marketing site stays on Pages, where a content-first static site belongs.

## Why a Worker, not Pages

Nothing was deployed yet, so this is greenfield — and Workers is Cloudflare's
recommended path for new full-stack projects. Three concrete reasons, not novelty:

1. **Cron Triggers.** Pages has none. The portal needs them: expired sessions and
   single-use tokens must be purged, and the privacy policy's "we delete data when
   no longer needed" promise has to be *executed*, not aspirational. See `scheduled()`.
2. **Observability.** `wrangler tail` streams full request/response and stack traces.
3. **A clean Access boundary.** One hostname to protect, with no `*.pages.dev` URL
   silently bypassing the policy.

## Architecture

```
Browser ──► portal.siaribuild.com.au
              │
              ├─ /api/portal/*  → Worker (run_worker_first)  → D1 + R2
              └─ everything else → static assets (empty SPA shell)
```

- **No SSR, no prerendering.** The served HTML is an empty shell. Private project
  data cannot appear in a static payload because there is no static payload.
- **D1** holds portal data (same database as the contact form; separate tables).
- **R2** holds private files. Objects are *never* served directly — the only read
  path is an authorising handler that checks membership, checks client-visibility,
  writes an audit event, then streams.

> **`assets.run_worker_first: ["/api/*"]` is load-bearing.** Workers serve static
> assets *ahead* of the Worker by default. Remove that line and `/api/*` is answered
> by the asset server, and **no authentication check ever runs.**

## Security model

- **Passwordless magic link.** Invite-only, read-only Phase 1: no passwords to leak
  or reuse. Tokens single-use; 15 min (login) / 7 days (invite).
- **Sessions:** opaque 256-bit tokens, **only the SHA-256 hash is stored**, so a
  database dump cannot be replayed as a session. Cookie is `HttpOnly` (XSS can't lift
  it), `Secure`, `SameSite=Lax` (blocks basic CSRF), 12 h.
- **One authorization gate** — `requireProjectAccess()`. No handler reads project data
  before it resolves. A `project_id` from the client is never trusted.
- **404, not 403** for non-members and for admin routes hit by clients, so URL probing
  cannot enumerate project ids or reveal the admin surface.
- **No account enumeration:** `request-link` returns an identical 200 either way.
- **Audit:** login, logout, publish, edit-after-publish, upload, download, invite and
  revocation, with actor, IP and user agent.
- **Revocation kills live sessions**, not just future reads.
- **Nothing is overwritten:** a new revision inserts a `document_versions` row and
  repoints `current_version_id`. Old files and rows remain.

Verified by executing the real SQL, not asserted: drafts and `client_visible = 0` rows
are invisible to clients; a client swapping the project id gets no membership row;
revoking a member removes access immediately.

## Setup

```bash
# from repo root — schema lives in the shared D1
npx wrangler r2 bucket create siari-portal-files
npx wrangler d1 execute siari_build --remote --file=./migrations/0002_portal_phase1.sql
npx wrangler d1 execute siari_build --remote --file=./migrations/0003_portal_phase2_scaffold.sql

# optional demo data — EDIT THE EMAIL ADDRESSES IN THE FILE FIRST
npx wrangler d1 execute siari_build --remote --file=./migrations/seed_portal_demo.sql

# first admin (there is no bootstrap UI, by design)
npx wrangler d1 execute siari_build --remote --command \
  "INSERT INTO users (id,email,name,role,status,created_at,updated_at)
   VALUES (lower(hex(randomblob(16))),'you@siaribuild.com.au','Your Name','owner_admin','active',datetime('now'),datetime('now'))"

cd portal
npm install
# paste the real database_id into wrangler.jsonc
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put MAIL_FROM          # or put in [vars] — it isn't secret
npm run deploy
```

Then add the custom domain `portal.siaribuild.com.au` to the Worker, and sign in at
`/login`.

Local: `npm run dev` (Vite, port 5173) for UI; `npx wrangler dev` to exercise the
Worker with bindings. Logs in production: `npm run tail`.

## Scheduled jobs (`0 17 * * *` UTC ≈ 03:00 Melbourne)

| Job | Why |
|---|---|
| Delete expired / used `login_tokens` | Spent credentials must not accumulate |
| Delete expired sessions (revoked kept 7 days) | Bounded session lifetime |
| Delete `contact_submissions` older than 24 months | Makes the privacy policy true |
| Delete `audit_events` older than 7 years | Proportionate retention |
| Delete `notifications` older than 12 months | It's a log, not a queue |

Each runs independently; one failure never skips the rest.

## Recommended: Cloudflare Access over the admin paths

Free up to 50 users. Put a self-hosted Access application over `portal.siaribuild.com.au/admin`
and `/api/portal/admin/*`. **Do not put clients behind Access** — they're external, and
enrolling each defeats the invite-only flow.

Two conditions, or it's decorative:
1. **Validate the `Cf-Access-Jwt-Assertion` JWT at the origin** (JWKS at
   `https://<team>.cloudflareaccess.com/cdn-cgi/access/certs`, checking `iss`/`aud`).
   Access's own docs require this so requests that bypass Access are rejected. The key
   rotates ~every 6 weeks, so fetch the JWKS rather than pinning.
2. Access **augments** the in-app role check; it never replaces it. The app still decides
   what a role may do and who the audit actor is.

Not implemented yet — ask and it's ~15 lines plus `jose`.

## Scope

**Phase 1 (done).** Invite/login/logout, dashboard, stage spine, updates feed, document
library with protected downloads, project contacts, project switcher, admin (publish
update, upload document, invite client, revoke, audit view), all five empty states,
tentative-date labelling, `noindex` + `no-store` + `Disallow: /`.

Progress is **manual** (`portal_settings.progress_mode`), labelled *"Set by your project
manager, not auto-calculated"* — the brief's preference, and it avoids false precision.
`project_stages.weight` exists so weighted progress can be enabled later without a migration.

**Phase 2 (scaffolded).** `migrations/0003` creates `selection_items`, `selection_options`,
`message_threads`, `messages`, `message_attachments`, `action_items`. No Phase 1 code
writes to them. One deliberate live link: the dashboard already queries `action_items`,
so "Nothing needs your action today" is honest now and needs no change later. No disabled
"Selections" tab — the brief warns that must not create confusion, and a dead tab does.

**Phase 3 (deliberately not scaffolded).** No variation, invoice or warranty tables.
Approval must capture identity, timestamp, IP/device, document version and the exact
accepted content. Guessing that schema now invites someone to wire a casual "Approve"
button to contract-changing work. Design it with legal review.

## Known gaps

1. **Admin cannot create projects or edit stages from the UI.** Updates and documents are
   covered; project/stage setup still needs `wrangler d1 execute`. Biggest gap against
   "publish without developer involvement."
2. **No rate limit on `/api/portal/auth/request-link`** — a stranger can trigger unlimited
   emails to a known client address. Now that this is a Worker, use a **Durable Object**
   (a real counter) rather than the contact form's best-effort KV throttle.
3. **Update photo attachments**: table and read path exist; the admin UI uploads documents
   only, not inline captioned photos.
4. **Session expiry is absolute (12 h), not sliding.** Fine for read-only.
5. **No automated tests.** The invariants above were verified by executing the SQL, but
   nothing guards them against regression.
