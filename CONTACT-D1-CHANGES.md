# Contact storage → Cloudflare D1 (Sanity storage removed)

Customer data no longer touches the public Sanity dataset. The contact function
now stores submissions in a **private Cloudflare D1** database (optional), and
**email is the guaranteed channel**.

## What changed (applied)
- `functions/api/contact.ts`
  - Removed the `@sanity/client` import and the Sanity write entirely.
  - Added **optional** D1 storage via a `DB` binding. If `DB` is absent, or the
    insert fails, storage is skipped and the request still succeeds — storage
    never blocks the email.
  - **Email is required**: it sends after storage; if the email fails the request
    returns an error so the sender can retry (no silently-lost lead).
  - Config guard no longer requires any Sanity vars — only `RESEND_API_KEY`,
    `TURNSTILE_SECRET_KEY`, `CONTACT_EMAIL`, `MAIL_FROM`.
- Studio: removed the `contactSubmission` schema type, its index entry, and the
  "Contact Submissions" desk item (dead now that leads don't live in Sanity).
- New files: `migrations/0001_contact_submissions.sql`, `wrangler.toml`.

The project-type dropdown still reads **project categories** from Sanity — that's
content, not customer data, so it correctly stays in the CMS.

## Behaviour matrix
| `DB` binding | Result |
|---|---|
| present | submission stored in D1 **and** email sent |
| absent | email sent, nothing stored, no error (email-only mode) |
| present but insert fails | error logged, email still sent |

## Setup (your steps)
1. **Create the database** and paste the id into `wrangler.toml`:
   ```bash
   npx wrangler d1 create siari_build
   ```
2. **Apply the schema** to the remote DB:
   ```bash
   npx wrangler d1 execute siari_build --remote --file=./migrations/0001_contact_submissions.sql
   ```
3. **Bind it.** Either keep `wrangler.toml` (recommended, already wired), or add a
   `DB` D1 binding in Pages → Settings → Functions. Don't do both for the same
   binding. Ensure the `nodejs_compat` flag is set (wrangler.toml already sets it).
4. **Env vars** on the Pages project: `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`,
   `CONTACT_EMAIL`, `MAIL_FROM`. You can now **delete `SANITY_WRITE_TOKEN`** — nothing
   writes to Sanity anymore (one fewer secret to hold).
5. To read leads: `npx wrangler d1 execute siari_build --remote --command "SELECT submitted_at, first_name, email, project_type FROM contact_submissions ORDER BY submitted_at DESC LIMIT 50"` (or build a small admin view later — same pattern as the order system).

## Important cleanup — existing exposed leads
Any submissions already written to the public Sanity dataset **still exist there**
and are still publicly queryable until you delete them (removing the schema only
hides them from the Studio). Delete them with a write token:
```bash
cd studio
# list first to confirm what will go:
npx sanity documents query '*[_type=="contactSubmission"]{_id, email}'
# then delete (requires a token with write access):
npx sanity documents delete $(npx sanity documents query '*[_type=="contactSubmission"]._id' | tr -d '[]", ')
```
If you want to keep a copy, export before deleting: `npx sanity dataset export production ./backup.tar.gz`.

## Notes
- `app/lib/sanity.types.ts` still contains an unused `ContactSubmission` type; it
  disappears next time you run `cd studio && npm run typegen`.
- Add a short **privacy notice** near the form and a **retention policy** for the
  D1 table (e.g. purge submissions older than N months) — you're collecting
  personal information as an AU business.
- This D1 + Pages Functions pattern is exactly what the order system can reuse:
  `customers` / `orders` / `order_events` tables, Stripe for payment after spec
  validation, same private-by-default boundary.
