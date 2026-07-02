# Lighthouse Audit & Improvements — SIARI BUILD

**Method note.** A Lighthouse *score* requires the site running over HTTP with
Chrome driving it. That can't be produced in this environment (no deploy, and
the build toolchain/lockfile wasn't part of the source drop). So this is a
**code-level audit mapped to the exact audits Lighthouse runs**, grounded in
your actual source — plus the high-leverage fixes implemented directly. Run the
real audit after deploying the updated build (see "How to measure" at the end).

Because many images are still placeholders, treat any absolute score as
provisional — but the *structural* issues below are what will cap your score
regardless of which photos you drop in, and they're now fixed.

---

## The headline issue (read this first)

This is a **client-rendered SPA**: the initial HTML is essentially empty, and
content + images + meta tags only appear after the JS bundle downloads, React
mounts, and a Sanity query round-trips. Lighthouse measures the *user-visible*
result, so an SPA structurally starts behind on **FCP, LCP, TBT, and SEO** (meta
tags aren't in the initial HTML).

Two of the biggest wins are therefore architectural and need your build config
(covered in "Remaining high-value work"): **prerendering/SSG**. Everything else
below I've implemented in the source now.

---

## Performance

### What was wrong, and what I changed

**1. The hero LCP was a CSS `background-image`.** ✅ Fixed
A CSS background can't be preloaded, can't carry `fetchpriority`, and can't be
responsive — the worst possible form for your Largest Contentful Paint element.
`HeroHome`, `HeroInner`, and the project-detail hero now render a real
`<img fetchpriority="high" loading="eager" decoding="sync">` with a responsive
`srcset`. This is the single biggest LCP lever on the site.

**2. No responsive images anywhere — every image shipped at one fixed width.** ✅ Fixed
No `srcset`/`sizes` existed, so a phone downloaded desktop-sized files. Added:
- `srcSet()` in `lib/image.ts` (builds a width ladder against the Sanity CDN).
- A reusable `<CdnImage>` component emitting `srcset` + `sizes` + intrinsic
  `width`/`height` + correct `loading`/`decoding`/`fetchpriority`.
- Applied across `FeaturedProjects`, `ProjectsGrid`, and the project-detail
  gallery + "more projects" grid. All below-the-fold images are now lazy and
  responsive. (Your `img()` helper already did `auto=format` → WebP/AVIF, good.)

**3. Below-the-fold hero/card images weren't lazy.** ✅ Fixed
The featured-projects and gallery grids used eager CSS backgrounds. Now real
`<img loading="lazy">`, so off-screen images don't compete with the LCP.

**4. Missing intrinsic dimensions → Cumulative Layout Shift risk.** ✅ Fixed
Grid images now carry `width`/`height` so the browser reserves space before load.

**5. Large initial JS bundle (framer-motion, portable-text, Turnstile, maps).** ✅ Partly fixed
Added **route-level code splitting** (`React.lazy` + `Suspense`) in `App.tsx`:
the landing page stays in the main bundle for fast first paint, while the
project-detail route (lightbox + motion) and the contact route (Turnstile) load
on demand — cutting initial JS and Total Blocking Time.

**6. Render-blocking font `@import` chain, no preload.** ⚠️ Needs index.html
`fonts.css` chains seven Fontsource `@import`s; CSS `@import` is render-blocking
and sequential. See `index-head-snippet.html` for the `<link rel="preload">` on
the two above-the-fold weights (Space Grotesk 700 for the hero H1, Inter 400).
Also consider dropping weights you don't actually use.

**7. No `preconnect` to the image/data origin.** ⚠️ Needs index.html
Added recommended `preconnect`/`dns-prefetch` for `cdn.sanity.io` — parallelizes
the CDN TLS handshake with HTML parsing (~100–300 ms off the hero).

**8. Google Maps + Turnstile third-party JS.** ✅ Adequate / scoped
Maps already loads with `loading=async` and only when configured; Turnstile is
scoped to the contact block. With route-splitting, neither touches other routes.
Optional further win: defer the Maps script until the map scrolls into view
(IntersectionObserver) — noted, not yet implemented to avoid behaviour change.

### Net effect
LCP: background→prioritized responsive `<img>` + preconnect + (optional) preload
is typically the difference between a red and green LCP. TBT: route-splitting
trims the initial parse/eval. CLS: dimensions added. Remaining ceiling is the
SPA/no-SSR nature — see below.

---

## Accessibility

**1. Form labels weren't programmatically associated.** ✅ Fixed
`ContactFormBlock` labels were visual-only. Added `htmlFor`/`id` pairs on all six
controls (name, email, phone, project type, message) so screen readers announce
them and Lighthouse's "form elements have labels" passes.

**2. Icon-only buttons had no accessible name.** ✅ Fixed
Added `aria-label`s to the project-detail carousel arrows and the lightbox
close/prev/next buttons. (The header hamburger already had one.)

**3. Images need meaningful `alt`.** ✅ Improved
Decorative hero/background images use `alt=""` (correct); content images
(project cards, gallery, lightbox) now carry descriptive alt text.

**4. Colour contrast.** ✅ Already handled by the 3-shade refactor
The earlier brand work fixed eyebrow-on-light from 2.8:1 → 5.0:1. **Deploy with
the three distinct shades**, not the legacy fallback, to keep AA. One thing to
watch: cream text on the primary bronze button is ~3.5:1 — fine for large/bold
button text (AA large ≥ 3.0) but not for small body text on bronze.

**5. `<html lang>`.** ⚠️ Needs index.html — set `<html lang="en">` (a11y + SEO).

Still worth a manual pass: heading order (a page with multiple heroes can emit
multiple `<h1>`s), and visible focus states on custom buttons.

---

## Best Practices

- **HTTPS / no mixed content** — Cloudflare handles TLS; all image/CDN URLs are
  https. ✅
- **Security headers** — added a `_headers` file (X-Content-Type-Options,
  Referrer-Policy, X-Frame-Options). ⚠️ deploy it.
- **`rel="noopener"`** on external links — already present in the footer. ✅
- **Image aspect ratios** — dimensions now set, so no distortion warnings. ✅
- **Console errors** — verify none at runtime (the Maps/Turnstile keys must be
  set, or those blocks no-op cleanly, which they're written to do). ✅ by design
- **`theme-color`** meta — added to the head snippet. ⚠️

---

## SEO

**1. Canonical/OG URL fell back to a stale `vercel.app` host.** ✅ Fixed
You're on Cloudflare, but `Seo.tsx` hardcoded a Vercel fallback — every canonical
and OG URL would point at the wrong domain when `VITE_SITE_URL` was unset. Now
falls back to the actual serving `origin`. **Still set `VITE_SITE_URL` to your
production domain** so server-side/social crawlers get the canonical host.

**2. No structured data.** ✅ Fixed
Added `GeneralContractor` JSON-LD (name, url, phone, email, address, geo) emitted
on the home page — a strong local-SEO signal (rich results, local pack
eligibility) for a construction business.

**3. Meta tags are client-rendered.** ⚠️ Architectural
`react-helmet-async` sets tags after JS runs. Google usually renders JS, but
social scrapers (and some crawlers) don't. Prerendering (below) resolves this.

**4. `robots.txt` / `sitemap.xml`.** ⚠️ Provided
Added a `robots.txt` template pointing at a sitemap. Generate a `sitemap.xml`
from your Sanity slugs at build time and set the real domain in both.

**5. Soft 404.** ⚠️ Note
A SPA returns HTTP 200 for unknown paths even though it shows the 404 page.
Consider a Cloudflare Pages rule / prerendered 404 so crawlers see a real 404.

---

## Remaining high-value work (needs your build config)

**Prerender / SSG — the biggest remaining score mover.**
For a mostly-static marketing site whose pages come from Sanity, prerender the
routes to static HTML at build time. This puts real content + meta in the initial
HTML, transforming FCP/LCP and fixing the SEO/meta-visibility gap in one move.
Options, in rough order of effort:
- `vite-react-ssg` or `vite-plugin-ssr`/`vike` — prerender your React routes.
- Cloudflare Pages Functions for on-demand SSR if content changes frequently.
- A simple build-time prerender of just `/`, `/about`, `/projects`, `/contact`.

Pair it with the `preconnect` + font `preload` + hero image `preload` from the
head snippet and the LCP will be dominated by a single, prioritized, correctly
sized image.

---

## Priority order

1. **Deploy the code changes here** (hero LCP img, responsive images, code
   splitting, a11y labels, SEO canonical + JSON-LD). Low risk, high payoff.
2. **Add the head snippet** (`lang`, preconnect, font preload) + `_headers` +
   `robots.txt` to `index.html`/`public`. Set `VITE_SITE_URL`.
3. **Measure** (below), then decide on **prerendering/SSG** — the ceiling-raiser.
4. Optional polish: defer Maps to viewport, drop unused font weights, sitemap.

## How to measure (real numbers)

```bash
npm run build && npm run preview          # serve the production build locally
npx lighthouse http://localhost:4173 \
  --only-categories=performance,accessibility,best-practices,seo \
  --preset=desktop --view
# repeat with --preset=mobile (mobile is throttled and is what Google ranks on)
```

Test the **home** route (hero LCP), a **project detail** route (image-heavy,
lazy loading), and **contact** (Turnstile/forms). Compare mobile before/after —
that's where the image + LCP work shows the largest delta.

---

## Files changed in this pass

- `app/lib/image.ts` — added `srcSet()` responsive helper.
- `app/components/CdnImage.tsx` — **new** responsive image component.
- `app/components/blocks/HeroHome.tsx`, `HeroInner.tsx`,
  `app/pages/ProjectDetailPage.tsx` — hero LCP → prioritized responsive `<img>`.
- `app/components/blocks/FeaturedProjects.tsx`, `ProjectsGrid.tsx`,
  `ProjectDetailPage.tsx` — grids/gallery → lazy responsive images + dimensions.
- `app/App.tsx` — route-level code splitting with `Suspense`.
- `app/components/Seo.tsx` — canonical fallback fix + `GeneralContractor` JSON-LD.
- `app/pages/DynamicPage.tsx` — emit organization schema on home.
- `app/components/blocks/ContactFormBlock.tsx` — label/id association.
- `app/pages/ProjectDetailPage.tsx` — aria-labels + descriptive alt.

Deliverables that go in `index.html` / `public/` (not React):
`_perf_recommendations/index-head-snippet.html`, `robots.txt`, `_headers`.
