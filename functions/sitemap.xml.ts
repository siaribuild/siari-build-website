// Cloudflare Pages Function — serves GET /sitemap.xml
//
// Generates the sitemap LIVE from Sanity on request, so it's always current as
// pages and projects are added in the CMS — no rebuild or manual step ever.
//
// It runs only when /sitemap.xml is requested (i.e. by search-engine crawlers,
// rarely). Normal visitors never hit this URL, so there is zero impact on their
// experience. The response is cached at Cloudflare's edge (see Cache-Control),
// so even repeated crawler fetches don't re-query Sanity within the cache
// window.
//
// Uses the Sanity HTTP query API directly (no SDK) to keep the function tiny.

interface Env {
  SANITY_PROJECT_ID: string
  SANITY_DATASET: string
  SANITY_API_VERSION: string
  // Optional override; defaults to the production domain.
  SITE_URL?: string
}

// Pages that always exist / aren't Sanity documents can be listed here if
// needed. Currently every public page is a Sanity "page" document, so we pull
// them all dynamically below.
const STATIC_FALLBACK_PATHS: string[] = []

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function urlEntry(loc: string, priority: string, changefreq: string): string {
  return `  <url>\n    <loc>${xmlEscape(loc)}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context

  const projectId = env.SANITY_PROJECT_ID
  const dataset = env.SANITY_DATASET
  const apiVersion = env.SANITY_API_VERSION || '2025-06-18'
  const siteUrl = (env.SITE_URL || 'https://siaribuild.com.au').replace(/\/$/, '')

  // GROQ: all published page slugs, and all project slugs. The published
  // perspective is the default for the query endpoint without a token.
  const groq = encodeURIComponent(
    `{
      "pages": *[_type == "page" && defined(slug.current)].slug.current,
      "projects": *[_type == "project" && defined(slug.current)] | order(orderRank).slug.current
    }`
  )

  const apiUrl = `https://${projectId}.apicdn.sanity.io/v${apiVersion}/data/query/${dataset}?query=${groq}`

  let pages: string[] = []
  let projects: string[] = []

  try {
    const res = await fetch(apiUrl, { headers: { Accept: 'application/json' } })
    if (res.ok) {
      const json = (await res.json()) as { result?: { pages?: string[]; projects?: string[] } }
      pages = json.result?.pages ?? []
      projects = json.result?.projects ?? []
    }
  } catch {
    // On any failure, fall back to at least the homepage so we never serve a
    // broken/empty sitemap.
  }

  const entries: string[] = []

  // Homepage (the "home" page slug maps to "/")
  entries.push(urlEntry(`${siteUrl}/`, '1.0', 'weekly'))

  // Other pages (skip "home" — it's the root above)
  for (const slug of pages) {
    if (!slug || slug === 'home') continue
    const priority = slug === 'projects' ? '0.9' : slug === 'privacy-policy' ? '0.3' : '0.7'
    const freq = slug === 'projects' ? 'weekly' : 'monthly'
    entries.push(urlEntry(`${siteUrl}/${slug}`, priority, freq))
  }

  // Project detail pages
  for (const slug of projects) {
    if (!slug) continue
    entries.push(urlEntry(`${siteUrl}/projects/${slug}`, '0.6', 'monthly'))
  }

  for (const path of STATIC_FALLBACK_PATHS) {
    entries.push(urlEntry(`${siteUrl}${path}`, '0.5', 'monthly'))
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      // Cache at Cloudflare's edge for 1 hour; allow serving slightly stale
      // while revalidating. Keeps it fresh without re-querying on every fetch.
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
