import type { Config } from '@react-router/dev/config'
import { buildClient } from './maintenance'

// ─────────────────────────────────────────────────────────────────────────────
//  ssr: false   → static output for Cloudflare Pages, no runtime server.
//
//  prerender()  → always prerenders every page + project slug. We do NOT reduce
//  the list during maintenance: under ssr:false, a route's `loader` is only valid
//  if that route is matched by a prerender path, so the dynamic routes (:slug,
//  :projectId) must always be covered or the build errors ("invalid route
//  export: loader").
//
//  Maintenance is handled entirely in the app, not here:
//    • vite.config.ts bakes __MAINTENANCE__ into the bundle,
//    • root.tsx renders <MaintenancePage/> for every route when it's true,
//    • the route loaders short-circuit to null when it's true (so no real page
//      content is fetched or baked).
//  Result during a maintenance build: every path is prerendered as the
//  maintenance page, with no real content in any .html or .data file.
// ─────────────────────────────────────────────────────────────────────────────
// Enumerating slugs for prerender is the one Sanity call that gates the whole
// build. Give it a timeout + a couple of retries so a transient network blip
// doesn't fail the deploy. A PERSISTENT failure still throws: refusing to build
// is correct here, because succeeding with missing slugs would publish a static
// site missing its CMS-driven pages over the currently-working one.
const SANITY_TIMEOUT_MS = 15_000
const SANITY_MAX_RETRIES = 2

async function fetchSlugs(label: string, query: string): Promise<string[]> {
  let lastErr: unknown
  for (let attempt = 0; attempt <= SANITY_MAX_RETRIES; attempt++) {
    try {
      return await buildClient.fetch<string[]>(query, {}, { signal: AbortSignal.timeout(SANITY_TIMEOUT_MS) })
    } catch (err) {
      lastErr = err
      if (attempt < SANITY_MAX_RETRIES) {
        console.warn(
          `[build] Sanity ${label} fetch failed (attempt ${attempt + 1}/${SANITY_MAX_RETRIES + 1}) — retrying…`,
        )
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
      }
    }
  }
  throw new Error(
    `\n[build] Could not reach Sanity to enumerate ${label} for prerendering after ` +
      `${SANITY_MAX_RETRIES + 1} attempts. Refusing to build an incomplete site.\n` +
      `  Original error: ${String(lastErr)}\n`,
  )
}

export default {
  appDirectory: 'app',
  ssr: false,
  async prerender() {
    const [pages, projects] = await Promise.all([
      fetchSlugs('pages', `*[_type == "page" && defined(slug.current)].slug.current`),
      fetchSlugs('projects', `*[_type == "project" && defined(slug.current)].slug.current`),
    ])

    const paths = new Set<string>(['/'])
    for (const slug of pages ?? []) if (slug && slug !== 'home') paths.add(`/${slug}`)
    for (const slug of projects ?? []) if (slug) paths.add(`/projects/${slug}`)
    return [...paths]
  },
} satisfies Config
