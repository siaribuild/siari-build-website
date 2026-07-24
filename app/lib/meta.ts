import type { MetaDescriptor } from 'react-router'
import { img, srcSet } from './image'
import { buildJsonLd } from './jsonld'

// ─────────────────────────────────────────────────────────────────────────────
// Ports the old <Seo> component to React Router v7 `meta` descriptors, and adds
// the technical SEO/AEO scaffolding from the July 2026 audit brief:
//   • Task 1 — <title> renders seo.metaTitle VERBATIM (no brand double-append).
//   • Task 2 — JSON-LD @graph (business + website + webpage + breadcrumb + FAQ).
//   • Task 5 — complete Open Graph + Twitter tag set (locale, image dims, alt…).
//   • Task 6 — robots built from nofollowAttributes + robotsMeta[], de-duped.
//   • Task 7 — self-referencing absolute canonical (home keeps its trailing /).
//   • Task 8 — NO <meta name="keywords"> (kept internal in Sanity only).
//
// Each route exports a `meta` function that calls buildMeta(); RR merges the
// result into the document <head> at build time (react-helmet-async is gone).
//
// VITE_SITE_URL is REQUIRED (there is no window at build time). Set it per
// environment — e.g. https://siaribuild.com.au in production.
// ─────────────────────────────────────────────────────────────────────────────

const SITE_URL = (import.meta.env.VITE_SITE_URL || '').replace(/\/$/, '')
const DEFAULT_OG_IMAGE = SITE_URL ? `${SITE_URL}/og-default.png` : '/og-default.png'
const OG_W = 1200
const OG_H = 630

interface SchemaOrgData {
  schemaType?: string | null
  datePublished?: string | null
  dateModified?: string | null
}

interface SeoData {
  metaTitle?: string | null
  metaDescription?: string | null
  metaImage?: string | null
  nofollowAttributes?: boolean | null
  robotsMeta?: string[] | null
  seoKeywords?: string[] | null
  openGraph?: { title?: string | null; description?: string | null; siteName?: string | null; image?: string | null } | null
  twitter?: { cardType?: string | null; site?: string | null; creator?: string | null; handle?: string | null } | null
  schemaOrg?: SchemaOrgData | null
}

interface BuildMetaArgs {
  pageSeo?: SeoData | null
  fallbackTitle?: string | null
  fallbackDescription?: string | null
  fallbackImage?: string | null
  path?: string
  /** Kept for backward-compat with callers; JSON-LD is now always emitted. */
  organization?: boolean
  /** Hero image URL to responsively preload (improves LCP on hero-led pages). */
  preloadImage?: string | null
  preloadWidths?: number[]
  /** Q&A pairs from the page's visible FAQ block(s) — see faqItemsOf(). */
  faqItems?: Array<{ question?: string | null; answer?: string | null }> | null
  /** This page's representative photo (its hero) — drives WebPage.primaryImageOfPage.
   *  JSON-LD only; never affects og:image. */
  pagePhoto?: string | null
  /** RR passes `matches`; we read the root loader's baked settings + nav from it. */
  matches?: Array<{ id: string; data?: unknown }>
}

// Resolve an OG/Twitter image to an absolute 1200x630 URL. Sanity images get a
// crop transform so the declared width/height are truthful; the packaged default
// is already 1200x630 and is returned unchanged.
function ogImageUrl(image: string): string {
  if (!image) return ''
  if (image.includes('cdn.sanity.io')) return img(image, { w: OG_W, h: OG_H, fit: 'crop' })
  return image
}

// Task 6 — merge the CMS index controls into one robots directive string.
function resolveRobots(seo?: SeoData | null): string {
  const directives: string[] = []
  const push = (v: string) => {
    const t = v.trim()
    if (t && !directives.some((d) => d.toLowerCase() === t.toLowerCase())) directives.push(t)
  }

  // The "Noindex" toggle (stored as nofollowAttributes) => noindex.
  if (seo?.nofollowAttributes === true) push('noindex')
  // Any explicit robots values from the CMS (max-image-preview:large, noindex…).
  for (const r of seo?.robotsMeta ?? []) if (r) push(r)

  const hasIndexDirective = directives.some((d) => /^(no)?index$/i.test(d))
  if (!hasIndexDirective) {
    // Default indexable — prepend so the primary directive reads first.
    directives.unshift('index', 'follow')
  }
  return directives.join(', ')
}

export function buildMeta({
  pageSeo,
  fallbackTitle,
  fallbackDescription,
  fallbackImage,
  path = '',
  preloadImage,
  preloadWidths,
  faqItems,
  pagePhoto,
  matches,
}: BuildMetaArgs): MetaDescriptor[] {
  const root = matches?.find((m) => m?.id === 'root')?.data as
    | { settings?: any; navigation?: any; services?: any; businessImage?: string | null }
    | undefined
  const settings = root?.settings ?? {}
  const navigation = root?.navigation ?? {}
  // Site-wide brand image (settings.businessImage), resolved once in the root
  // loader and baked into every page — drives GeneralContractor.image.
  const businessImage = root?.businessImage ?? null
  // Home "What we do" cards, baked into root data — feeds #business.makesOffer.
  const services = Array.isArray(root?.services) ? root.services : []

  const siteName = pageSeo?.openGraph?.siteName || settings?.siteName || 'SIARI Build'

  // ── Task 1: title verbatim ────────────────────────────────────────────────
  // metaTitle already contains the brand → output it AS-IS. Only when it's empty
  // do we compose "<Page> | <Brand>". og/twitter titles follow the same chain:
  // openGraph.title verbatim → metaTitle verbatim → composed fallback.
  const metaTitle = pageSeo?.metaTitle?.trim()
  const composed =
    fallbackTitle && fallbackTitle.trim() && fallbackTitle.trim() !== siteName
      ? `${fallbackTitle.trim()} | ${siteName}`
      : fallbackTitle?.trim() || siteName
  const documentTitle = metaTitle || composed
  const socialTitle = pageSeo?.openGraph?.title?.trim() || metaTitle || composed

  const description =
    pageSeo?.metaDescription ||
    pageSeo?.openGraph?.description ||
    fallbackDescription ||
    settings?.tagline ||
    ''

  // ── Task 7: canonical (home keeps a single trailing slash) ────────────────
  const canonical = path === '' || path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`

  // ── Image resolution chain → absolute 1200x630 ────────────────────────────
  const rawImage =
    pageSeo?.openGraph?.image || pageSeo?.metaImage || fallbackImage || DEFAULT_OG_IMAGE
  const image = ogImageUrl(rawImage)
  const imageAlt = fallbackTitle?.trim() || documentTitle

  const robots = resolveRobots(pageSeo)

  // ── Task 5: og:type + article times ───────────────────────────────────────
  const isProject = path.startsWith('/projects/')
  const ogType = isProject ? 'article' : 'website'
  const datePublished = pageSeo?.schemaOrg?.datePublished || undefined
  const dateModified = pageSeo?.schemaOrg?.dateModified || undefined

  const tags: MetaDescriptor[] = [
    { title: documentTitle },
    { name: 'description', content: description },
    { name: 'robots', content: robots },
    { tagName: 'link', rel: 'canonical', href: canonical },

    // Open Graph
    { property: 'og:type', content: ogType },
    { property: 'og:site_name', content: siteName },
    { property: 'og:locale', content: 'en_AU' },
    { property: 'og:title', content: socialTitle },
    { property: 'og:description', content: description },
    { property: 'og:url', content: canonical },

    // Twitter
    { name: 'twitter:card', content: pageSeo?.twitter?.cardType || 'summary_large_image' },
    { name: 'twitter:title', content: socialTitle },
    { name: 'twitter:description', content: description },
  ]

  if (isProject && datePublished) tags.push({ property: 'article:published_time', content: datePublished })
  if (isProject && dateModified) tags.push({ property: 'article:modified_time', content: dateModified })

  if (image) {
    tags.push({ property: 'og:image', content: image })
    tags.push({ property: 'og:image:width', content: String(OG_W) })
    tags.push({ property: 'og:image:height', content: String(OG_H) })
    tags.push({ property: 'og:image:alt', content: imageAlt })
    tags.push({ name: 'twitter:image', content: image })
    tags.push({ name: 'twitter:image:alt', content: imageAlt })
  }

  // Only emit twitter:site / :creator when a REAL handle exists (never guess).
  if (pageSeo?.twitter?.site) tags.push({ name: 'twitter:site', content: pageSeo.twitter.site })
  if (pageSeo?.twitter?.creator) tags.push({ name: 'twitter:creator', content: pageSeo.twitter.creator })

  // Task 8: intentionally NO <meta name="keywords"> — seoKeywords stays internal.

  // ── Responsive hero preload (LCP) ─────────────────────────────────────────
  if (preloadImage) {
    tags.push({
      tagName: 'link',
      rel: 'preload',
      as: 'image',
      href: img(preloadImage, { w: 1600 }),
      imageSrcSet: srcSet(preloadImage, { widths: preloadWidths ?? [768, 1024, 1366, 1600, 1920] }),
      imageSizes: '100vw',
      fetchPriority: 'high',
      crossOrigin: 'anonymous',
    } as MetaDescriptor)
  }

  // ── Task 2: JSON-LD @graph ────────────────────────────────────────────────
  // EVERY social link feeds sameAs — deliberately NOT filtered by hideFromMenu.
  // That toggle controls the visible Follow menu only (see Footer.tsx), so a
  // profile can strengthen the entity (e.g. Google Business Profile) without
  // appearing as a "follow us" link. Never add a hideFromMenu filter here.
  const socialUrls: string[] = Array.isArray(navigation?.socialMenu)
    ? navigation.socialMenu.map((s: any) => s?.url).filter((u: any): u is string => typeof u === 'string' && !!u)
    : []

  const graph = buildJsonLd({
    siteUrl: SITE_URL,
    settings,
    socialUrls,
    services,
    canonical,
    title: fallbackTitle?.trim() || documentTitle,
    description,
    image,
    schemaType: pageSeo?.schemaOrg?.schemaType,
    path,
    datePublished,
    dateModified,
    faqItems,
    businessImage,
    pagePhoto,
  })
  if (graph) tags.push({ 'script:ld+json': graph } as MetaDescriptor)

  return tags
}

// Returns the hero section's background image URL for a page, if present — used
// to preload the LCP image (see buildMeta `preloadImage`).
export function heroImageOf(page: any): string | undefined {
  const s = (page?.sections ?? []).find(
    (x: any) => x?._type === 'heroHome' || x?._type === 'heroInner',
  )
  return s?.backgroundImage || undefined
}

// Flattens every faqBlock on a page into a single Q&A list. This is the bridge
// that makes FAQ "just work": the same visible block content that renders on
// the page (FaqBlock accordion) also feeds the FAQPage JSON-LD, so dropping FAQ
// blocks onto any page (e.g. /faq's five category groups) automatically emits
// the structured data — all groups flatten into one mainEntity list.
export function faqItemsOf(page: any): Array<{ question?: string | null; answer?: string | null }> {
  return (page?.sections ?? [])
    .filter((s: any) => s?._type === 'faqBlock')
    .flatMap((s: any) => (Array.isArray(s?.items) ? s.items : []))
    .map((i: any) => ({ question: i?.question ?? null, answer: i?.answer ?? null }))
}
