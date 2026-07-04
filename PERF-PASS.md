# SIARI BUILD — Performance pass (review items) + Sanity image fallback

Implements the actionable items from the independent review, plus your local
image-fallback idea. All files are syntax-verified (not build-run — I can't build
your full toolchain here).

---

## What's included

### 1. Sanity query client removed from the browser bundle  ✅ (review Priority 1)
The three data blocks (`FeaturedProjects`, `ProjectsGrid`, `ContactFormBlock`) no
longer import `useSanity`/GROQ queries — they're pure consumers of the baked
loader props now, and the `useSanity` hook is deleted. `PortableText` used to pull
in the Sanity **client** via `urlFor`; it now uses a new lightweight
`app/lib/image-url.ts` (built on `@sanity/image-url` with a plain `{projectId,
dataset}` config, no `@sanity/client`). Net: `@sanity/client` (the ~100KB
query/fetch chunk the review flagged) is now **server/build-only** — no browser
component imports it.

### 2. Motion runtime removed  ✅ (review Priority 2)
All 6 `motion/react` usages were the identical hero zoom (`scale 1.05→1, 2.5s
ease-out`). Replaced with a CSS keyframe (`.hero-zoom` in `styles/theme.css`,
with a `prefers-reduced-motion` guard). `motion/react` is now imported nowhere in
the app — you can remove `motion` from `package.json` dependencies. Dead
`app/components/blocks/Blocks.tsx` (which also used motion) was deleted.

### 3. Fonts trimmed to the latin subset  ✅ (review Priority 5)
`styles/fonts.css` now imports the `latin-<weight>.css` Fontsource variants
instead of the full `<weight>.css` (which pulled in cyrillic/greek/vietnamese/
latin-ext). Drops ~26 of ~33 `@font-face` rules. All current weights are kept
(Inter 400/500/600, Space Grotesk 400/500/600/700) — I trimmed *subsets*, not
weights, to avoid a heading rendering at a fallback weight. Trim weights later if
you confirm which are unused.

### 4. sitemap.xml generated  ✅ (review Priority 3, the real gap)
`scripts/finalize-build.mjs` writes `build/client/sitemap.xml` from the
prerendered pages, using `VITE_SITE_URL`. (The canonical/`SITE_URL` half of
Priority 3 is just setting that env var, already covered.)
→ Add `Sitemap: https://siaribuild.com.au/sitemap.xml` to your `public/robots.txt`.

### 5. Sanity image local fallback  ✅ (your idea)
Sanity's on-the-fly transforms stay the **primary** source. At build,
`scripts/finalize-build.mjs` downloads a single 1200px copy of every Sanity image
referenced in the output to `build/client/img-fallback/<assetId>.<ext>`.
`CdnImage` now has an `onError` handler (`app/lib/image.ts` → `localFallbackPath`)
that swaps to that same-origin, Cloudflare-served copy **only if** the Sanity CDN
request fails. So if `cdn.sanity.io` is down, content images still render.
(Limitation: CSS `background-image` uses — the maintenance/404 decorative
backdrops — can't use `onError`, so those specific backgrounds aren't covered.
All `<img>`/CdnImage content imagery is.)

---

## Files

```
NEW:
  app/lib/image-url.ts                 client-safe urlFor (no @sanity/client)
  scripts/finalize-build.mjs           post-build: image fallbacks + sitemap.xml

CHANGED:
  styles/theme.css                     + .hero-zoom keyframe
  styles/fonts.css                     latin-subset imports
  app/lib/image.ts                     + localFallbackPath()
  app/lib/sanity.ts                    client only (urlFor moved out)
  app/components/CdnImage.tsx          + onError local-fallback swap
  app/components/PortableText.tsx      urlFor from image-url.ts
  app/components/MaintenancePage.tsx   motion → .hero-zoom
  app/components/blocks/HeroHome.tsx   motion → .hero-zoom
  app/components/blocks/HeroInner.tsx  motion → .hero-zoom
  app/components/blocks/FeaturedProjects.tsx   Sanity fetch removed (props only)
  app/components/blocks/ProjectsGrid.tsx       Sanity fetch removed (props only)
  app/components/blocks/ContactFormBlock.tsx   Sanity fetch removed (props only)
  app/pages/NotFoundPage.tsx           motion → .hero-zoom
  app/pages/ProjectDetailPage.tsx      motion → .hero-zoom

DELETED (remove from your repo):
  app/hooks/useSanity.ts               no longer used
  app/components/blocks/Blocks.tsx     dead code (also used motion)
```

## Apply

1. Copy the files over (same paths); delete the two files above.
2. `package.json`:
   - change the build script to run the finalizer:
     `"build": "react-router build && node scripts/finalize-build.mjs"`
   - remove `"motion"` from dependencies.
   - `@sanity/image-url` stays (used by `image-url.ts`); `@sanity/client` stays
     (build/loaders). Keep `@fontsource/*`.
3. `npm install` (to drop motion), then `npm run build`.
4. Add the `Sitemap:` line to `public/robots.txt`.

## Verify

```
npm run build
# fallback images downloaded + sitemap written (watch the finalizer's log lines)
ls build/client/img-fallback | head
cat build/client/sitemap.xml | head

npx sirv-cli build/client --single __spa-fallback.html --port 4173
```

Then check the browser bundle no longer ships Sanity/motion:
```
grep -rl "apicdn.sanity.io\|createClient" build/client/assets/*.js || echo "no Sanity query client in browser bundle"
```
(You should see the "no Sanity query client" line — image URLs to cdn.sanity.io in
the HTML are fine; those are `<img>` sources, not the query client.)

---

## Deliberately NOT done — and why

**Hero image `<link rel=preload>` (review Priority 4).** Skipped on purpose. Your
hero is now a real prerendered `<img fetchpriority="high">` sitting in the static
HTML, so the browser already discovers and prioritises it immediately — a preload
adds little over that. A *fixed-size* preload would also risk making mobile fetch
a larger image than it needs, and a correct *responsive* preload
(`imagesrcset`/`imagesizes`) is fiddly to get right in RR's meta and I couldn't
build-test it. Low reward, real risk → left out. Easy to add later if a deployed
measurement shows the hero is still LCP-bound.

**Dropping to plain MPA / removing client-side routing (review Priority 6).** Not
a fix — it's re-architecting away from the React Router framework mode you just
migrated to (effectively the Astro rebuild we discussed and deferred). Your TBT is
already 0, so the client runtime isn't costing measured performance. This stays a
strategic decision for later, not a change to make mid-stream.

## Still the most important next step

Almost none of this can be judged on the `sirv` localhost number (uncompressed —
that's what produced the misleading 62). **Deploy to a Cloudflare Pages preview
and Lighthouse that**, compressed, against your live SPA. That's the real
before/after — and it'll tell you whether any remaining item (like the hero
preload) is even worth revisiting.
