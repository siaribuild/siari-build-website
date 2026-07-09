// Post-build step:  react-router build  &&  node scripts/finalize-build.mjs
//
//   1. LOCAL IMAGE FALLBACKS — downloads a single-size copy of every Sanity
//      image referenced in the built output to build/client/img-fallback/, so
//      CdnImage can swap to a same-origin copy if cdn.sanity.io is unavailable.
//   2. sitemap.xml — generated from the prerendered pages.
//
// Node 20+ (global fetch). No extra dependencies.

import { readdir, readFile, writeFile, mkdir, stat } from 'node:fs/promises'
import { join, relative } from 'node:path'

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
  if (!SITE_URL) {
    console.warn('sitemap: VITE_SITE_URL not set — skipping sitemap.xml')
    return
  }
  const htmlFiles = files.filter((f) => f.endsWith('index.html'))
  const paths = new Set()
  for (const f of htmlFiles) {
    // build/client/index.html -> ""  |  build/client/about/index.html -> "about"
    const rel = relative(OUT, f).replace(/\\/g, '/').replace(/\/?index\.html$/, '')
    if (rel.startsWith('__')) continue // skip SPA fallback / error shells
    paths.add(rel)
  }
  const body = [...paths]
    .sort()
    // Emit URLs WITHOUT a trailing slash (except root) to match the route
    // canonicals in app/lib/meta.ts (e.g. /about, /projects/<slug>). Keeping the
    // sitemap and <link rel="canonical"> identical avoids duplicate-URL signals.
    .map((p) => `  <url><loc>${SITE_URL}/${p}</loc></url>`)
    .join('\n')
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
  await writeFile(join(OUT, 'sitemap.xml'), xml)
  console.log(`sitemap: ${paths.size} urls -> ${join(OUT, 'sitemap.xml')}`)
}

main().catch((err) => {
  console.error('finalize-build failed:', err)
  process.exit(1)
})
