# Assessment of the third-party "Executive verdict"

Short version: **the third party is substantially right on the technical specifics, and its headline data-security finding is real, serious, and something my first review did not raise.** A handful of its P0s are archive/sandbox artifacts or overstated in severity, but almost every concrete claim points at a genuine gap. Below is the honest triage, the data-boundary issue in detail, and what I've now fixed.

---

## 1. The data-security finding — it's correct, and it's the important one

**Their claim:** contact submissions (name, email, phone, project type, message) are written to the same Sanity dataset the public site reads without a token; if that dataset is public-read, anyone who knows the project + dataset can query them.

**Verdict: almost certainly true, and it's a real PII exposure.** I verified the mechanism directly:

- Every Sanity **read** path in the repo is **token-less** — `app/lib/sanity.ts` and `maintenance.ts`'s build client use `useCdn: true` with no token, and the (now-removed) sitemap function read token-less too. Token-less reads of published content **only work if the `production` dataset has public read access.**
- Project id (`f0yvhrzy`) and dataset (`production`) are **public by nature** — they're baked into the client bundle and appear in every `cdn.sanity.io` image URL.
- The contact function writes `contactSubmission` docs into that **same** dataset. The schema has no access control — and Sanity access is governed at the **dataset** level, not per document type, so a "submissions" type in a public dataset is readable by anyone.

The third party's line "do not rely on hidden schema type as security" is exactly right.

**Confirm it yourself in 10 seconds** (no token — if this returns documents, the leads are exposed):

```bash
curl 'https://f0yvhrzy.apicdn.sanity.io/v2025-06-18/data/query/production?query=*%5B_type%3D%3D%22contactSubmission%22%5D%5B0..3%5D%7Bemail%2Cphone%7D'
```

Returns your submissions → public (treat as a live exposure). Returns `401`/empty → the dataset is private and you're fine on this point.

**Important honesty note:** my earlier rate-limiting fix does **not** address this. Rate limiting caps how many submissions can be *written*; it does nothing about who can *read* what's already stored. Different problem, different control. This is the one finding I'd treat as a launch blocker, and I didn't surface it — my first pass reviewed the contact function's input handling but didn't step back to the dataset-level trust boundary. The third party's privacy/architecture lens is what surfaced it.

### Remediation options (pick one — I can implement whichever)

1. **Separate private dataset for submissions (recommended).** Write `contactSubmission` to a `submissions` dataset with no public read; keep `production` public so image CDN URLs keep working. Add the `submissions` dataset to the Studio so staff still review leads in the same UI. Lowest risk to the live site; preserves your workflow. Code change: point the write client at `env.SANITY_SUBMISSIONS_DATASET`.
2. **Make `production` private + build-time read token.** Because the browser never queries Sanity post-SSG (data is baked at build), you can flip the whole dataset to private and give only the build a read token — closes everything in ~2 lines. **Caveat: test first on a staging dataset that anonymous `cdn.sanity.io` image URLs still load** — some private-dataset configs restrict asset access, which would break every image on the site.
3. **Cloudflare D1 / KV for submissions.** Cleanest boundary (leads never touch the CMS), but adds a binding/table and a small read UI. Natural since you're already on Pages.

Whichever you pick, also address the **APP 11 / privacy** items the review raises: a retention/deletion policy for stored leads, and a privacy-notice link at the contact form (APP 5). Those are policy calls, not code — but they're legitimate for an AU business collecting personal information.

---

## 2. Triage of the rest

### Correct — now fixed in this pass
| Finding | Fix applied |
|---|---|
| No root `tsconfig.json`; missing `typescript`, `@types/react(-dom)`, `@cloudflare/workers-types`; no `typecheck` | Created real `tsconfig.json` from the template (+ workers-types so `PagesFunction`/`KVNamespace` resolve); added the toolchain + `typecheck`/`preview`/`dev` scripts to `package.json`. **This was also a gap in my own rewrite — good catch.** |
| MapBlock InfoWindow HTML injection from CMS `mapAddressLabel` | Rebuilt the InfoWindow as a DOM node with `textContent` (no string interpolation). |
| `MAIL_FROM` not in the config guard | Added to the guard. |
| No request body size limit | Added a 64 KB `Content-Length` cap before parsing. |
| No `_headers` / security headers | Added `public/_headers` (nosniff, Referrer-Policy, X-Frame-Options DENY, Permissions-Policy, COOP) + a report-only CSP starting point. |
| Static assets at repo root (won't deploy) | Created `public/`, moved `favicon.ico` + `robots.txt` there (Vite copies `public/` into the build output). |

### Correct — already handled in my first pass
Rate limiting (KV throttle added), unused-dependency bloat (MUI/Popper/DnD/Recharts/Slick/Motion etc. removed), React in `peerDependencies` → real deps, `delete.mjs` removed, stale `index.html` removed, sitemap de-duplicated (kept build-time, removed the redundant Function + stale root file), finalizer folded into the build script, Sanity typegen scaffolded.

### Correct — needs your action (documented, not auto-fixed)
- **`studio/DeployTool.tsx` is unregistered and imports `RocketIcon`/`CopyIcon` that error in your `@sanity/icons` version.** Confirmed it's not referenced in `sanity.config.ts`. Either delete it (simplest — also removes the deploy-hook-URL-in-bundle concern) or register it and fix the icons. Given your "deploy hook proxy" is still an open item, decide which.
- **Missing logo asset.** `Header.tsx`, `Footer.tsx`, `MaintenancePage.tsx` all `import logo from '../../imports/logo-black-200-2.png'`, but `app/imports/` has no such file in the archive. If your live build works, the file exists in your real repo and just wasn't zipped — but confirm, because as archived this import breaks the Vite build.
- **Prerender fetch has no timeout.** `react-router.config.ts` fetches slugs during prerender with no timeout/retry; if Sanity is slow the build hangs (likely what the reviewer hit). Worth a timeout + clear failure message.
- **Cloudflare build output dir.** Confirm the Pages project's "build output directory" is `build/client` (docs mentioning `dist` are stale).
- **Maintenance-model doc/code mismatch.** Docs describe instant CMS-controlled maintenance + a `?preview=KEY` bypass; the code is build-time (`__MAINTENANCE__` + `VITE_IGNORE_MAINTENANCE`). Reconcile the docs to the build-time model (or move to an edge check if you truly need instant).
- **`nodejs_compat`.** No committed `wrangler.toml`; ensure the flag is set in the Pages dashboard (the contact function needs it).

### Overstated or environment-specific
- **"Root build timed out" / "missing files break the app" as blanket P0s.** The logo import is a real broken reference, but the *build timeout* is most likely the reviewer's sandbox lacking Sanity env/network (no `VITE_SANITY_PROJECT_ID` → the prerender fetch stalls), not a defect that necessarily reproduces in your CI. Real underlying issue (no fetch timeout), somewhat overstated framing.
- **"`package.json.template` is more correct than the real one."** The templates are *merge guides* with `keep-your-version` placeholders and `//` instructions, not drop-in configs — so "more correct" overstates it. They did correctly flag the missing TS deps and scripts, which I've now applied.
- **React version.** The template suggests React 19; your app is pinned to 18.3.1 (working). I kept 18.3.1 — bumping to 19 is a separate, deliberate migration, not cleanup.

---

## 3. Net

The third party's core judgment — good architecture direction, implementation not yet production-clean, with a genuine privacy-boundary blocker — is fair. Between my two passes the code-quality, dependency, and hygiene items are largely resolved; the **data-boundary decision is the one thing left that genuinely gates launch**, and it's a design choice only you can make. Tell me which storage option you want and I'll wire it up (plus the prerender timeout and the DeployTool decision if you like).
