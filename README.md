# Migrating Siari Build from Vercel to Cloudflare Pages

This package moves hosting from Vercel to Cloudflare Pages. The goal: same
$0/month, but with Cloudflare's unlimited bandwidth (no surprise-bill risk)
and everything — DNS, hosting, SSL — under one Cloudflare account.

The website code itself does NOT change. Only the deployment layer changes:
- `api/contact.ts` (Vercel) → `functions/api/contact.ts` (Cloudflare)
- `vercel.json` → `public/_headers` + `public/_redirects`
- New `wrangler.toml`

Your contact form still posts to `/api/contact` — that path is identical on
both platforms, so no frontend change is needed.

================================================================
WHAT'S IN THIS PACKAGE
================================================================
| File | Goes where | Purpose |
|---|---|---|
| functions/api/contact.ts | project root → `functions/api/` | Contact form, ported to Pages Function |
| public/_headers | project root → `public/` | Security headers + asset caching |
| public/_redirects | project root → `public/` | SPA routing fallback |
| wrangler.toml | project root | Build output dir + nodejs_compat flag |

================================================================
STEP 1 — Decide: same repo or new repo?
================================================================
You do NOT need a new repository. Cloudflare Pages connects to your EXISTING
GitHub repo, the same way Vercel does. Using the same repo is simpler and
keeps one source of truth.

Recommendation: keep the same repo. (If you specifically want a clean break
from Vercel, you can create a new repo and push the code there, but it's not
required.)

================================================================
STEP 2 — Add the new files to your project
================================================================
1. Create a `functions/api/` folder at your project root and put
   `contact.ts` there. (The `functions/` folder is Cloudflare's convention —
   it sits alongside `src/`, not inside it.)
2. Create a `public/` folder at your project root if you don't have one, and
   put `_headers` and `_redirects` there. Vite copies everything in `public/`
   to the build output as-is.
   NOTE: you already placed `500.html` in `public/` for the error page — keep
   it there; it coexists fine with these files.
3. Put `wrangler.toml` at the project root.

================================================================
STEP 3 — Remove (or keep) the Vercel files
================================================================
- DELETE `vercel.json` — it's Vercel-specific and ignored by Cloudflare.
- DELETE `api/contact.ts` (the old Vercel version) to avoid confusion. The
  new one lives at `functions/api/contact.ts`.
  (If you want a safety net, just leave them — Cloudflare ignores `vercel.json`
  and the `api/` folder. But removing them is cleaner.)

================================================================
STEP 4 — Commit and push
================================================================
```
git add -A
git commit -m "Add Cloudflare Pages config (functions, headers, redirects)"
git push
```

================================================================
STEP 5 — Create the Cloudflare Pages project
================================================================
1. Log in to Cloudflare → in the left sidebar choose "Workers & Pages".
2. Click "Create" → "Pages" tab → "Connect to Git".
3. Authorise GitHub and select your siari-build repository.
4. Configure the build:
   - Framework preset: Vite
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: leave as `/` (unless your app is in a subfolder)
5. BEFORE the first deploy, expand "Environment variables (advanced)" and add
   your variables (see Step 6). You can also add them after and re-deploy.
6. Click "Save and Deploy".

================================================================
STEP 6 — Environment variables
================================================================
Add these in the Cloudflare Pages project → Settings → Environment variables
(set them for "Production"; add to "Preview" too if you want preview builds
to work).

Frontend (build-time, must be prefixed VITE_):
- VITE_SANITY_PROJECT_ID = f0yvhrzy
- VITE_SANITY_DATASET = production
- VITE_SANITY_API_VERSION = 2025-06-18
- VITE_TURNSTILE_SITE_KEY = (your Turnstile site key)
- VITE_SITE_URL = https://siaribuild.com.au  (or your Pages URL until DNS is live)

Server (runtime, used by the Pages Function — NO prefix):
- SANITY_PROJECT_ID = f0yvhrzy
- SANITY_DATASET = production
- SANITY_API_VERSION = 2025-06-18
- SANITY_WRITE_TOKEN = (your Sanity write token)
- RESEND_API_KEY = (your Resend key)
- CONTACT_EMAIL = (where enquiries are sent)
- TURNSTILE_SECRET_KEY = (your Turnstile secret)
- MAIL_FROM = (your verified sender, once Resend domain is verified)

IMPORTANT: unlike Vercel, Cloudflare doesn't split VITE_ vs non-VITE_ by
location — they all go in the same place. The VITE_ ones are baked into the
build; the others are read at runtime by the function. Just add them all.

================================================================
STEP 7 — Enable the nodejs_compat flag (REQUIRED for the contact form)
================================================================
The contact function uses @sanity/client and resend, which need Node APIs.

1. Pages project → Settings → Functions → "Compatibility flags".
2. Add `nodejs_compat` to BOTH Production and Preview.
3. Confirm the Compatibility date is 2026-06-01 or later.
(The included wrangler.toml also sets this, but set it in the dashboard too to
be safe — the dashboard value is authoritative.)

Re-deploy after changing flags (Deployments → ... → Retry deployment, or push
a new commit).

================================================================
STEP 8 — Test on the Pages URL (before touching DNS)
================================================================
Cloudflare gives you a `*.pages.dev` URL. Test EVERYTHING there first:
- Pages load, navigation works, content shows
- A deep link / refresh on /about or /privacy-policy works (SPA fallback)
- A bad URL shows your branded 404
- Submit the contact form end-to-end — confirm the email arrives and the
  submission appears in Sanity. (This proves the Pages Function + nodejs_compat
  + env vars all work.)

If the form fails: check Pages → your project → Functions logs (real-time),
and re-check the env vars and the nodejs_compat flag.

================================================================
STEP 9 — Point the domain (only after Step 8 passes)
================================================================
1. Pages project → "Custom domains" → "Set up a custom domain".
2. Enter siaribuild.com.au (and www if you use it).
3. Because your DNS is already on Cloudflare, it will offer to add the records
   automatically — accept. (No manual CNAME juggling needed when DNS is on
   the same Cloudflare account.)
4. SSL provisions automatically (free).

================================================================
STEP 10 — Decommission Vercel
================================================================
Once the Cloudflare site is live on your domain and verified working:
1. In Vercel, remove the custom domain from the Vercel project (so it's not
   competing for the domain).
2. Optionally delete the Vercel project, or leave it idle (it's free on Hobby).
Keep it around for a few days as a fallback if you like, then remove.

================================================================
NOTES & CAVEATS
================================================================
- HTML caching: Vercel's vercel.json set aggressive s-maxage caching on the
  HTML. This package deliberately does NOT replicate that. Cloudflare Pages
  caches assets natively and their docs warn that custom HTML caching can
  serve stale content after deploys. Let Cloudflare handle it — it's better
  at this than a hand-rolled rule.
- The 500.html error page works the same on Cloudflare (static file in the
  output). Cloudflare also auto-detects SPAs; with _redirects in place you're
  covered either way.
- Spend protection: on Cloudflare's free tier there are no bandwidth charges
  to protect against. The only metered thing is Workers/Functions requests
  (100,000/day free) — your contact form will never approach this.
- If you later see a build error about Node built-ins, it's almost always the
  nodejs_compat flag not being set (Step 7).
