// Post-build step:  react-router build  &&  node scripts/finalize-build.mjs
//
//   1. LOCAL IMAGE FALLBACKS — downloads a single-size copy of every Sanity
//      image referenced in the built output to build/client/img-fallback/, so
//      CdnImage can swap to a same-origin copy if cdn.sanity.io is unavailable.
//   2. sitemap.xml — generated from the prerendered pages.
//
// Node 20+ (global fetch). No extra dependencies.

import { readdir, readFile, writeFile, mkdir, stat, rename, rmdir } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { createClient } from '@sanity/client'
import { config as loadEnv } from 'dotenv'

// This runs as a SEPARATE node process after `react-router build`, so — unlike
// vite.config.ts / maintenance.ts — Vite hasn't populated env for us. Load
// .env.local then .env (dotenv won't override already-set vars, so .env.local
// wins, matching Vite's precedence) before reading any VITE_* value.
loadEnv({ path: '.env.local' })
loadEnv()

const OUT = 'build/client'
const SITE_URL = (process.env.VITE_SITE_URL || '').replace(/\/$/, '')

async function walk(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await walk(p)))
    else out.push(p)
  }
  return out
}

// ── Clean, no-slash URLs on Cloudflare Pages ────────────────────────────────
// Cloudflare Pages derives its trailing-slash canonical from the file layout:
//   dir/index.html  →  /dir/ serves 200,  /dir  → 308 → /dir/   (slash form)
//   dir.html        →  /dir  serves 200,  /dir/ → 308 → /dir     (no-slash form)
// Our <link rel="canonical"> and sitemap use the NO-SLASH form, so we move every
// non-root  X/index.html → X.html  to make CF serve no-slash natively. Combined
// with the public/_redirects rule ("/*/ → /:splat 301") this gives a clean
// single 301 from the slash form to the no-slash form with no redirect loop
// (the no-slash target is a real flat file, so CF doesn't re-add the slash).
// The root index.html is left untouched, so the homepage keeps its single "/".
async function flattenCleanUrls() {
  const htmls = (await walk(OUT)).filter(
    (f) => relative(OUT, f).replace(/\\/g, '/').endsWith('/index.html'),
  )
  let moved = 0
  for (const f of htmls) {
    const rel = relative(OUT, f).replace(/\\/g, '/')
    const dir = rel.slice(0, -'/index.html'.length) // "projects" | "projects/<slug>"
    if (!dir || dir.startsWith('__')) continue // safety (root handled by the filter)
    await rename(f, join(OUT, `${dir}.html`))
    // Drop the directory if flattening emptied it (leaf slug dirs); parent dirs
    // that still hold siblings (.data, nested .html) simply fail rmdir → ignored.
    try {
      await rmdir(join(OUT, dir))
    } catch {}
    moved++
  }
  console.log(`clean-urls: flattened ${moved} index.html → *.html (no-slash canonical)`)
}

async function main() {
  const files = await walk(OUT)

  // ── 0. SPA fallback via Cloudflare Pages' NATIVE not-found handling ─────────
  // Pages serves build/client/404.html for any route that doesn't match a real
  // file — WITHOUT overriding "/", real pages, or /assets/* (unlike a greedy
  // `/* /__spa-fallback 200` rule, which was serving the empty shell for "/").
  // React Router's SPA shell is __spa-fallback.html, so we copy it to 404.html.
  try {
    const shell = await readFile(join(OUT, '__spa-fallback.html'), 'utf8')
    await writeFile(join(OUT, '404.html'), shell)
    console.log('spa-fallback: wrote 404.html from __spa-fallback.html')
  } catch (err) {
    console.warn('spa-fallback: could not create 404.html —', err.message)
  }

  // ── 1. Local image fallbacks ──────────────────────────────────────────────
  const textFiles = files.filter((f) => /\.(html|js|data|txt|json)$/.test(f))
  const assets = new Map() // key: `${hash}.${ext}`  ->  base Sanity URL (no query)

  const urlRe = /https:\/\/cdn\.sanity\.io\/images\/[a-z0-9]+\/[a-z0-9_-]+\/([a-f0-9]+)-\d+x\d+\.(\w+)/gi
  for (const f of textFiles) {
    const text = await readFile(f, 'utf8')
    let m
    while ((m = urlRe.exec(text))) {
      const ext = m[2].toLowerCase()
      if (ext === 'svg') continue // SVGs are inlined elsewhere
      assets.set(`${m[1]}.${ext}`, m[0])
    }
  }

  if (assets.size) {
    const dir = join(OUT, 'img-fallback')
    await mkdir(dir, { recursive: true })
    let ok = 0, fail = 0
    await Promise.all(
      [...assets].map(async ([name, baseUrl]) => {
        const dest = join(dir, name)
        try {
          await stat(dest) // skip if already present
          ok++
          return
        } catch {}
        const ext = name.split('.').pop()
        // One modest size, format matched to the extension.
        const dl = `${baseUrl}?w=1200&q=80&fm=${ext === 'jpg' ? 'jpg' : ext}`
        try {
          const res = await fetch(dl)
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const buf = Buffer.from(await res.arrayBuffer())
          await writeFile(dest, buf)
          ok++
        } catch (err) {
          fail++
          console.warn(`  fallback skip ${name}: ${err.message}`)
        }
      }),
    )
    console.log(`img-fallback: ${ok} saved, ${fail} skipped (${assets.size} unique assets)`)
  } else {
    console.log('img-fallback: no Sanity images found in output')
  }

  // ── 2. sitemap.xml ────────────────────────────────────────────────────────
  // Sanity-driven so it can (a) carry a real <lastmod> from each document's
  // _updatedAt and (b) EXCLUDE noindex URLs (e.g. Privacy Policy) — neither of
  // which the filesystem walk can know. Includes every page + every project
  // detail page. Falls back to the filesystem list only if Sanity is
  // unreachable, so a transient blip never ships a site with no sitemap.
  if (!SITE_URL) {
    console.warn('sitemap: VITE_SITE_URL not set — skipping sitemap.xml')
    await flattenCleanUrls()
    return
  }

  // W3C date (YYYY-MM-DD) is a valid <lastmod>; drop the time for stability.
  const lastmod = (iso) => (iso ? String(iso).slice(0, 10) : undefined)
  const urlEntry = (loc, mod) =>
    `  <url><loc>${loc}</loc>${mod ? `<lastmod>${mod}</lastmod>` : ''}</url>`

  let entries = []
  try {
    const projectId = process.env.VITE_SANITY_PROJECT_ID
    const dataset = process.env.VITE_SANITY_DATASET
    if (!projectId || !dataset) throw new Error('VITE_SANITY_PROJECT_ID / VITE_SANITY_DATASET not set')

    const sanity = createClient({
      projectId,
      dataset,
      apiVersion: process.env.VITE_SANITY_API_VERSION || '2025-06-18',
      useCdn: true,
      perspective: 'published',
    })

    // `noindex` mirrors resolveRobots() in app/lib/meta.ts: the Noindex toggle
    // OR an explicit "noindex" in robotsMeta[].
    const NOINDEX = `(seo.nofollowAttributes == true || "noindex" in (seo.robotsMeta[]))`
    const { pages, projects } = await sanity.fetch(
      `{
        "pages": *[_type == "page" && defined(slug.current)]{ "slug": slug.current, _updatedAt, "noindex": ${NOINDEX} },
        "projects": *[_type == "project" && defined(slug.current)]{ "slug": slug.current, _updatedAt, "noindex": ${NOINDEX} }
      }`,
    )

    for (const p of pages ?? []) {
      if (p.noindex) continue
      // "home" is the site root; every other page is /<slug> (no trailing slash,
      // matching the canonical in app/lib/meta.ts).
      const loc = p.slug === 'home' ? `${SITE_URL}/` : `${SITE_URL}/${p.slug}`
      entries.push({ loc, mod: lastmod(p._updatedAt), sort: p.slug === 'home' ? '' : p.slug })
    }
    for (const pr of projects ?? []) {
      if (pr.noindex) continue
      entries.push({ loc: `${SITE_URL}/projects/${pr.slug}`, mod: lastmod(pr._updatedAt), sort: `projects/${pr.slug}` })
    }
    console.log(`sitemap: built from Sanity (${entries.length} indexable urls)`)
  } catch (err) {
    // Fallback: derive from prerendered output (no lastmod, no noindex filter).
    console.warn(`sitemap: Sanity fetch failed (${err.message}) — falling back to filesystem list`)
    const htmlFiles = files.filter((f) => f.endsWith('index.html'))
    const seen = new Set()
    for (const f of htmlFiles) {
      const rel = relative(OUT, f).replace(/\\/g, '/').replace(/\/?index\.html$/, '')
      if (rel.startsWith('__')) continue
      if (seen.has(rel)) continue
      seen.add(rel)
      entries.push({ loc: `${SITE_URL}/${rel}`, mod: undefined, sort: rel })
    }
  }

  const body = entries
    .sort((a, b) => a.sort.localeCompare(b.sort))
    .map((e) => urlEntry(e.loc, e.mod))
    .join('\n')
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
  await writeFile(join(OUT, 'sitemap.xml'), xml)
  console.log(`sitemap: ${entries.length} urls -> ${join(OUT, 'sitemap.xml')}`)

  // ── 3. clean, no-slash URLs (must run AFTER the sitemap's filesystem walk) ──
  await flattenCleanUrls()
}

main().catch((err) => {
  console.error('finalize-build failed:', err)
  process.exit(1)
})
