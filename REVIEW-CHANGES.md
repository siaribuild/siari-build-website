# SIARI BUILD — Architect review: changes applied & actions required

Two parts:
- **Part A** — changes I applied to the code (in the attached cleaned tree).
- **Part B** — actions you need to perform yourself (deletions in git, infra config, commands to run).

---

## Part A — Changes applied

### 1. Dead code & stale artifacts removed
Root dependency footprint dropped from **~76 to 20** packages; `app/components/*.tsx` from 16 files to 8.

| Removed | Why |
|---|---|
| `app/components/ui/` (47 files, ~4,750 LOC) | shadcn/ui kitchen sink from Figma Make. Nothing outside `ui/` imported any of it. |
| `app/components/figma/ImageWithFallback.tsx` | Figma Make leftover, not imported. |
| `app/components/ErrorBoundary.tsx` | Dead — `root.tsx` exports its own `ErrorBoundary`. |
| `index.html` | Stale SPA entry (references `/src/main.tsx` + `react-helmet-async`, both gone post-migration). RR7 framework mode generates HTML from `root.tsx`. |
| `sitemap.xml` (repo root) | Stale hand-written SPA sitemap. Real one is generated into build output. |
| `functions/sitemap.xml.ts` | **Your sitemap hypothesis was correct** — see note below. |
| `default_shadcn_theme.css` | Dead (`KEEP_IN_SYNC(...figmake/shadcn/globals.css)` marker; referenced nowhere). |
| `styles/globals.css` | Empty and not imported. |
| `studio/schemaTypes.zip` | 14 KB zip duplicating the `.ts` schema files sitting next to it. |
| `delete.mjs` | Destructive one-off (hard-deletes a hardcoded doc id). Footgun in repo root. |
| `package-lock.json` (root only) | Root moves to pnpm (see #4). Studio keeps its own npm lockfile. |
| literal-brace junk dirs (`app/{components`, etc.) | Empty dirs from an unexpanded `mkdir app/{a,b,c}`. |

**Sitemap note:** yes — the live `functions/sitemap.xml.ts` was the SPA-era "generate on access" approach. Post-SSG, `scripts/finalize-build.mjs` writes a static `sitemap.xml` into `build/client/` at build time, and on Cloudflare Pages **static assets take precedence over Functions at the same path** — so the Function was never actually executing. Removed it; the build-time static sitemap is the correct SSG-native source of truth. I also aligned its URLs to drop the trailing slash (except root) so they match the `<link rel="canonical">` values in `app/lib/meta.ts`.

### 2. `package.json` (root) — identity & dependencies fixed
- Renamed `@figma/my-make-file` → `siari-build`.
- Moved `react` / `react-dom` out of **optional `peerDependencies`** into real `dependencies` (an app shouldn't declare React as an optional peer — it invites the wrong React being hoisted).
- Removed ~40 unused packages: all `@radix-ui/*`, `@mui/*`, `@emotion/*`, `recharts`, `react-slick`, `react-dnd(+backend)`, `canvas-confetti`, `date-fns`, `motion` (your perf pass removed every import), `cmdk`, `vaul`, `input-otp`, `react-day-picker`, `embla-carousel-react`, `react-resizable-panels`, `next-themes`, `sonner`, `react-hook-form`, `react-popper`, `@popperjs/core`, `react-responsive-masonry`, `clsx`, `tailwind-merge`, `class-variance-authority`, and the unused `@vercel/node`.
- Moved `resend` to `dependencies` (it's a runtime dep of the deployed contact Function, not a dev tool).
- Folded the post-build step into the build script: `"build": "react-router build && node scripts/finalize-build.mjs"`. **Check your CI** — if it already appends `finalize-build.mjs` separately, remove that so it doesn't run twice (harmless, but redundant).

### 3. `functions/api/contact.ts` — rate limiting + hardening
- Added an **optional per-IP throttle** (5 submissions/hour) backed by a KV binding `CONTACT_RATELIMIT`. It **fails open / no-ops if the binding is absent**, so the endpoint keeps working before you configure KV — it activates the moment you bind the namespace (Part B #2).
- `clean()` now strips control characters (incl. CR/LF) before trim/cap — defensive hardening for the email `subject` interpolation.

### 4. Package-manager consistency
Your `pnpm-workspace.yaml` lists only `.` (the root), so the studio is already a standalone npm project (its own lockfile + `.npmrc legacy-peer-deps=true`) — that half is internally consistent, left as-is. The only conflict was the **root** carrying both a pnpm workspace file and an npm `package-lock.json`. Removed the root npm lockfile so the root is pnpm-only.

### 5. Sanity typegen scaffolding (kills the `any` layer)
- Added `studio/sanity-typegen.json` (reads GROQ from `../app`, emits `../app/lib/sanity.types.ts`).
- Added `npm run typegen` to `studio/package.json`.
- `studio/.gitignore` now ignores the intermediate `schema.json`.
- Finishing this needs your live schema — see Part B #5.

### 6. Small quality fixes
- `root.tsx`: `bg-[#F5F3EF] text-[#111111]` → `bg-background text-foreground` (the tokens already exist in `theme.css`; same hex, now token-driven).
- `ContactFormBlock.tsx`: form error `<p>` now has `role="alert" aria-live="assertive"` so screen readers announce failures; fixed a stale comment that claimed a client-fetch fallback that doesn't exist.

---

## Part B — Actions for you

### 1. Commit the deletions
The files in Part A #1 are removed from the attached tree. In your repo:
```bash
git rm -r app/components/ui app/components/figma app/components/ErrorBoundary.tsx \
  index.html sitemap.xml functions/sitemap.xml.ts default_shadcn_theme.css \
  styles/globals.css studio/schemaTypes.zip delete.mjs package-lock.json
```
Then confirm the empty/junk dirs are gone (git ignores empty dirs, so these only matter if a `.gitkeep` tracks them): `app/imports`, `app/data`, `app/hooks`, and the `app/{...}` brace dirs.

### 2. Enable contact rate limiting (KV)
Cloudflare dashboard → your Pages project → **Settings → Functions → KV namespace bindings** → add binding **`CONTACT_RATELIMIT`** → a new (or existing) KV namespace. That's all — the code picks it up automatically. Tune `RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW_SECONDS` in `contact.ts` if 5/hour is too tight or loose. (Optionally also add a Cloudflare WAF rate-limiting rule on `/api/contact` as a second layer.)

### 3. Verify the Google Maps key is locked down  ← do this
`VITE_GOOGLE_MAPS_API_KEY` is necessarily shipped in the client bundle (`MapBlock` loads the Maps JS API). This is only safe if the key is restricted in **Google Cloud Console → Credentials**: set an **HTTP-referrer restriction** to your domains (`siaribuild.com.au/*`, preview domain, `localhost`) **and** an **API restriction** to just the Maps JS API. An unrestricted browser key can be lifted and billed against your account.

### 4. Regenerate the root lockfile
Root is now pnpm-only. Run once and commit the result:
```bash
pnpm install   # regenerates pnpm-lock.yaml with the pruned dependency set
```
(The studio stays on npm: `cd studio && npm install` as before.)

### 5. Finish typegen (2 commands + a small queries change)
Wrap each exported query in `app/lib/queries.ts` with `defineQuery` so typegen can detect them (runtime value is unchanged — `defineQuery` returns the string as-is):
```ts
import { defineQuery } from 'groq'   // add "groq" to the app's devDependencies
export const PAGE_QUERY = defineQuery(`*[_type == "page" ...]`)
```
Then generate the types:
```bash
cd studio && npm run typegen   # writes ../app/lib/sanity.types.ts
```
After that you can type the fetches, e.g. `client.fetch<PAGE_QUERYResult>(PAGE_QUERY, ...)`, and drop the `any`s in `queries.ts`, `root-data.ts`, `block-data.ts`, and the page components. Happy to do this whole conversion for you if you share your `groq`/typegen versions — I kept it as a documented step rather than guess at your toolchain version and risk a build that won't compile.

### 6. Pin Node 22+ for the studio build
Sanity Studio v6 (which you're on — `^6.2.0`, current) dropped Node 20 (EOL). Make sure CI / the studio deploy runner uses Node 22+, or studio builds will fail on peer/engine resolution.

### 7. Optional hardening — deploy-hook proxy
`DeployTool.tsx` ships `SANITY_STUDIO_DEPLOY_HOOK_URL` in the (authenticated) Studio bundle. Fine for now; for production, route the trigger through a tiny serverless proxy so the raw hook URL isn't in the bundle — your own comment already notes this.

### 8. Confirm nothing stale is git-tracked
`studio/.sanity/` is gitignored (good), but it appeared in the archive. If it (or the old lockfiles) were ever committed: `git rm -r --cached studio/.sanity` then commit.
