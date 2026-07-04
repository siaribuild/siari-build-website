# SIARI BUILD → React Router v7 (framework mode) + SSG — Migration Guide

This converts the site from a **Vite + React SPA (React Router v6, runtime Sanity
fetch)** to **React Router v7 framework mode with build-time prerendering (SSG)**,
deployed as static assets on **Cloudflare Pages**.

**Why:** the measured Lighthouse bottleneck was **LCP 4.4s** — the hero `<h1>`
couldn't paint until the JS bundle parsed *and* the Sanity page query returned.
Prerendering bakes that text (and all `PAGE_QUERY` section content) into the
static HTML, removing the data-fetch gate. TBT/CLS were already 0, so this targets
the one real lever. It also fixes the **canonical "not absolute URL"** SEO failure
(via mandatory `VITE_SITE_URL`) and the **heading-order** a11y failure (footer
`h4`→`h3`).

---

## 0. What this package contains

```
react-router.config.ts        NEW  ssr:false + prerender() enumerating Sanity slugs
vite.config.ts                NEW  reactRouter() + tailwind v4 plugins
package.json.template         NEW  deps to add/remove (merge into yours)
tsconfig.json.template        NEW  RR7 typegen include (merge into yours)
public/_redirects             NEW  SPA fallback for non-prerendered paths
public/_headers               NEW  immutable asset caching + security headers
app/root.tsx                  NEW  HTML document + global (settings/nav) build-time loader + ErrorBoundary
app/routes.ts                 NEW  route table (index / project / :slug / *)
app/routes/home.tsx           NEW  loader + meta for "/"
app/routes/page.tsx           NEW  loader + meta for "/:slug"
app/routes/project.tsx        NEW  loader + meta for "/projects/:projectId"
app/routes/not-found.tsx      NEW  meta + "*" / SPA-fallback 404
app/lib/meta.ts               NEW  Seo.tsx logic ported to RR7 meta descriptors
app/lib/root-data.ts          NEW  useRootData() — read baked settings/nav anywhere

app/lib/sanity.ts             CHANGED  now the single client (exports client + urlFor)
app/pages/DynamicPage.tsx     CHANGED  presentational (props in; no useSanity/Seo/loading)
app/pages/ProjectDetailPage.tsx CHANGED  presentational (props in; no useSanity/Seo/loading)
app/pages/NotFoundPage.tsx    CHANGED  reads useRootData(); no <Seo>
app/components/Header.tsx     CHANGED  reads useRootData() instead of useSanity
app/components/Footer.tsx     CHANGED  reads useRootData(); footer titles h4→h3
app/components/MaintenanceGate.tsx CHANGED  SSG-safe client-side runtime check
<all other components>        CHANGED  import 'react-router-dom' → 'react-router' only

DELETED: app/App.tsx, app/sanity.ts (dup client), app/components/Seo.tsx,
         app/pages/DynamicPageBySlug.tsx, app/components/ScrollToTop.tsx,
         index.html, main.tsx        ← delete these from your repo
```

> Everything **not** listed as CHANGED/DELETED is byte-identical to your current
> source (all block components, PortableText, brand.css / theme.css, image.ts,
> CdnImage, the UI kit). The migration relocates the data layer; it does not
> touch your design system.

---

## 1. Local steps

1. **Back up / branch:** `git checkout -b rr7-ssg`.
2. **Copy this package over your repo root** (it mirrors your structure: `app/`,
   `styles/`, `public/`, and the root config files).
3. **Delete** the files listed under DELETED above (including `index.html` and
   `main.tsx` — framework mode renders the document via `app/root.tsx`).
4. **Merge `package.json.template` into `package.json`** — add `react-router`,
   `@react-router/dev`, `@tailwindcss/vite`, `vite-tsconfig-paths`; keep your
   existing versions for Sanity/motion/lucide/fontsource; **remove
   `react-router-dom` and `react-helmet-async`**; set `"type": "module"`.
5. **Merge `tsconfig.json.template`** (the `.react-router/types` include is what
   makes generated route types resolve).
6. `npm install`
7. Create **`.env.local`** (all are build-time `VITE_` vars):
   ```
   VITE_SANITY_PROJECT_ID=f0yvhrzy
   VITE_SANITY_DATASET=production
   VITE_SANITY_API_VERSION=2025-06-18
   VITE_SITE_URL=http://localhost:5173      # https://siaribuild.com.au in prod
   VITE_PREVIEW_KEY=your-preview-secret
   ```
8. `npm run dev` → verify locally.
9. **Build the static site:** `npm run build` → output in **`build/client/`**.
   You should see a real `.html` per page/project plus `__spa-fallback.html`.
   Confirm the hero heading text is present in `build/client/index.html`
   (`grep -i "<h1" build/client/index.html`) — that's the LCP fix, baked.
10. Re-run Lighthouse against the built output (e.g. `npx serve build/client`).

---

## 2. Cloudflare Pages setup

### 2a. Build settings (Pages → your project → Settings → Builds & deployments)
| Setting | Value |
|---|---|
| Framework preset | **None** (or Vite) |
| Build command | `npm run build` |
| Build output directory | **`build/client`** |
| Root directory | (repo root) |

Set the Node version to 20+ — add an **environment variable** `NODE_VERSION = 20`
(or commit a `.nvmrc` containing `20`). RR7 + Vite 6 require it.

### 2b. Environment variables (set for **Production** and **Preview**)
These are read **at build time**, so they must be present in the Pages env, not
just locally:
```
VITE_SANITY_PROJECT_ID   = f0yvhrzy
VITE_SANITY_DATASET      = production
VITE_SANITY_API_VERSION  = 2025-06-18
VITE_SITE_URL            = https://siaribuild.com.au      # REQUIRED now
VITE_PREVIEW_KEY         = <your preview secret>
```
`VITE_SITE_URL` is mandatory in SSG (there is no `window` at build time) — it also
produces the correct absolute canonical/OG URLs, fixing the earlier Lighthouse
canonical failure. Use your real Sanity values (the ones already in your current
`.env`).

### 2c. Static files
`public/_redirects` and `public/_headers` are copied into `build/client` on
build. Also **copy your existing `public/favicon.ico`** into `public/` (it wasn't
in the source I had). The `_redirects` catch-all only fires for paths that don't
exist as static files, so prerendered pages serve directly and unknown paths get
the branded 404 via the SPA fallback.

---

## 3. Sanity → Cloudflare rebuild webhook (required)

Because content is baked at build, publishing in Sanity must trigger a rebuild.

1. **Create a Deploy Hook in Cloudflare:** Pages → project → Settings → Builds &
   deployments → **Deploy hooks** → *Add* → name `sanity-publish`, branch
   `main`. Copy the generated URL (looks like
   `https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/…`).
2. **Create the Sanity webhook** (Manage UI → *API* → *Webhooks* → *Create*, or
   CLI `sanity hook create`):
   - **URL:** the Cloudflare deploy-hook URL from step 1
   - **Dataset:** `production`
   - **Trigger on:** Create, Update, Delete
   - **HTTP method:** `POST`
   - **Filter (GROQ):** limit to content that affects the build:
     ```
     _type in ["page","project","siteSettings","navigation","projectCategory","testimonial"]
     ```
3. Publish a change → confirm a new Pages deployment starts automatically.

New or renamed pages/projects go live on the **next rebuild** (usually seconds
after publish). This is the one behavioural shift from the old always-live runtime
fetch — expected for SSG.

---

## 4. Behavioural changes to know

- **Maintenance mode stays instant.** `MaintenanceGate` is deliberately a
  **client-side runtime** check — during prerender it renders the real site (so
  the static HTML is never a maintenance screen), then enforces maintenance after
  hydration. Toggling it in Sanity works immediately, **no rebuild needed**. The
  `?preview=KEY` bypass is unchanged.
- **Global nav/contact/SEO are baked** and refresh on rebuild (via the webhook).
- **Below-the-fold collection blocks still hydrate client-side** — see §5.

---

## 5. Optional phase 2 — bake the below-fold project lists too

`PAGE_QUERY` (all section content incl. the LCP hero) **is** prerendered. But four
blocks fetch *extra* collections via `useSanity` and therefore still hydrate on
the client (they render empty at build, fill in after mount):

- `FeaturedProjects` → `FEATURED_PROJECTS_QUERY`
- `ProjectsGrid` → `PROJECTS_QUERY` + `CATEGORIES_QUERY`
- `MapBlock` → `SITE_SETTINGS_QUERY`
- `ContactFormBlock` → `ALL_CATEGORIES_QUERY` (+ Turnstile — must stay client-side)

This is fine for the **measured** problem: none of these are the LCP element, and
TBT stays 0. The only cost is that those specific project cards/links aren't in
the initial HTML (minor SEO). It was left as phase 2 deliberately, because
`MapBlock` (runtime pin colour via `getComputedStyle`) and `ContactFormBlock`
(Turnstile) are risky to convert blind.

**Recipe when you want it:** add the queries to the relevant route `loader`
(e.g. `FEATURED_PROJECTS_QUERY` + `PROJECTS_QUERY` + `CATEGORIES_QUERY` to
`routes/page.tsx` / `routes/home.tsx`), pass the results through `PageBuilder`
into the blocks as props, and have each block prefer the prop and fall back to
`useSanity` (so it works whether or not data is supplied). Keep the contact
form's Turnstile and the category dropdown client-side.

---

## 6. Verification checklist

- [ ] `npm run build` succeeds; `build/client/` has one `.html` per page/project
- [ ] `grep "<h1" build/client/index.html` shows the real hero text (LCP baked)
- [ ] `<link rel="canonical" href="https://siaribuild.com.au/…">` is absolute
- [ ] GeneralContractor JSON-LD present in home HTML
- [ ] Footer column titles are `<h3>` (heading-order fixed)
- [ ] Deep-link straight to `/projects/<slug>` returns real HTML (not a shell)
- [ ] Unknown URL shows the branded 404 via `__spa-fallback.html`
- [ ] Toggling maintenance in Sanity flips the live site without a rebuild
- [ ] Publishing content triggers a Cloudflare deployment
- [ ] Lighthouse: Performance now green (LCP resolved); SEO 100; A11y ~100
