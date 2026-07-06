import { client } from './sanity'
import {
  FEATURED_PROJECTS_QUERY,
  PROJECTS_QUERY,
  CATEGORIES_QUERY,
  ALL_CATEGORIES_QUERY,
} from './queries'
import type {
  PAGE_QUERY_RESULT,
  FEATURED_PROJECTS_QUERY_RESULT,
  PROJECTS_QUERY_RESULT,
  CATEGORIES_QUERY_RESULT,
  ALL_CATEGORIES_QUERY_RESULT,
} from './sanity.types'

// ─────────────────────────────────────────────────────────────────────────────
// Below-the-fold blocks used to fetch their own collections in the browser via
// useSanity (featured projects, the projects grid + category filter, the contact
// project-type dropdown). Those browser requests fail with 403 from any origin
// not in the Sanity CORS allow-list (and are absent from the static HTML anyway).
//
// This runs those same queries at BUILD TIME (in Node, where CORS doesn't apply)
// so the data is baked and passed to the blocks as props. Also inlines any
// Sanity-hosted SVG icons as data URIs, so card/footer icons don't need a
// cross-origin image request either.
// ─────────────────────────────────────────────────────────────────────────────

export interface BlockData {
  featuredProjects?: FEATURED_PROJECTS_QUERY_RESULT | null
  projects?: PROJECTS_QUERY_RESULT | null
  categories?: CATEGORIES_QUERY_RESULT | null
  allCategories?: ALL_CATEGORIES_QUERY_RESULT | null
}

// Deep-walk any object/array and replace Sanity-hosted *.svg URLs with an inline
// data URI (fetched at build). Defensive: any failure leaves the original URL,
// which still works from an allow-listed origin (e.g. production).
export async function inlineSanitySvgs(node: unknown): Promise<void> {
  const jobs: Promise<void>[] = []

  const walk = (value: any) => {
    if (!value || typeof value !== 'object') return
    if (Array.isArray(value)) {
      value.forEach(walk)
      return
    }
    for (const [k, v] of Object.entries(value)) {
      if (
        typeof v === 'string' &&
        v.includes('cdn.sanity.io') &&
        v.split('?')[0].toLowerCase().endsWith('.svg')
      ) {
        jobs.push(
          (async () => {
            try {
              const res = await fetch(v)
              if (res.ok) {
                const svg = await res.text()
                // Base64 (not encodeURIComponent): some icon SVGs contain
                // characters like ' that encodeURIComponent leaves untouched,
                // which then break the unquoted CSS url() and render as a solid
                // box. Base64 has no such characters.
                const b64 = Buffer.from(svg, 'utf8').toString('base64')
                value[k] = `data:image/svg+xml;base64,${b64}`
              }
            } catch {
              /* keep original URL */
            }
          })(),
        )
      } else if (v && typeof v === 'object') {
        walk(v)
      }
    }
  }

  walk(node)
  await Promise.all(jobs)
}

// Fetch whatever collections the page's blocks need, based on section types
// present. Also inlines SVG icons in the page sections (mutates in place).
export async function loadBlockData(page: PAGE_QUERY_RESULT): Promise<BlockData> {
  if (!page?.sections?.length) return {}

  const types = new Set<string>(page.sections.map((s) => s._type))

  const [featuredProjects, projects, categories, allCategories] = await Promise.all([
    types.has('featuredProjects') ? client.fetch(FEATURED_PROJECTS_QUERY) : Promise.resolve(null),
    types.has('projectsGrid') ? client.fetch(PROJECTS_QUERY) : Promise.resolve(null),
    types.has('projectsGrid') ? client.fetch(CATEGORIES_QUERY) : Promise.resolve(null),
    types.has('contactFormBlock') ? client.fetch(ALL_CATEGORIES_QUERY) : Promise.resolve(null),
  ])

  // Bake card icons (cardGrid / cardGridText / any icon field) into the HTML.
  await inlineSanitySvgs(page.sections)

  return { featuredProjects, projects, categories, allCategories }
}
