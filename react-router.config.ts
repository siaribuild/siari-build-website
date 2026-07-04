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
export default {
  appDirectory: 'app',
  ssr: false,
  async prerender() {
    const [pages, projects] = await Promise.all([
      buildClient.fetch<string[]>(`*[_type == "page" && defined(slug.current)].slug.current`),
      buildClient.fetch<string[]>(`*[_type == "project" && defined(slug.current)].slug.current`),
    ])

    const paths = new Set<string>(['/'])
    for (const slug of pages ?? []) if (slug && slug !== 'home') paths.add(`/${slug}`)
    for (const slug of projects ?? []) if (slug) paths.add(`/projects/${slug}`)
    return [...paths]
  },
} satisfies Config
