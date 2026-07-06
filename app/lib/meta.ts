import type { MetaDescriptor } from 'react-router'
import { img, srcSet } from './image'

// ─────────────────────────────────────────────────────────────────────────────
// Ports the old <Seo> component to React Router v7 `meta` descriptors.
// Each route exports a `meta` function that calls buildMeta(); RR merges the
// result into the document <head> at build time (react-helmet-async is gone).
//
// VITE_SITE_URL is now REQUIRED (there is no window at build time). Set it per
// environment — e.g. https://siaribuild.com.au in production. This also fixes
// the earlier Lighthouse "canonical is not an absolute URL" failure, because
// the canonical is now always built from an absolute origin.
// ─────────────────────────────────────────────────────────────────────────────

const SITE_URL = (import.meta.env.VITE_SITE_URL || '').replace(/\/$/, '')

interface SeoData {
  metaTitle?: string | null
  metaDescription?: string | null
  metaImage?: string | null
  nofollowAttributes?: boolean | null
  seoKeywords?: string[] | null
  openGraph?: { title?: string | null; description?: string | null; siteName?: string | null; image?: string | null } | null
  twitter?: { cardType?: string | null; site?: string | null; creator?: string | null; handle?: string | null } | null
}

interface BuildMetaArgs {
  pageSeo?: SeoData | null
  fallbackTitle?: string | null
  fallbackDescription?: string | null
  fallbackImage?: string | null
  path?: string
  /** Emit GeneralContractor JSON-LD (home page only). */
  organization?: boolean
  /** Hero image URL to responsively preload (improves LCP on hero-led pages). */
  preloadImage?: string | null
  preloadWidths?: number[]
  /** RR passes `matches`; we read the root loader's baked site settings from it. */
  matches?: Array<{ id: string; data?: unknown }>
}

export function buildMeta({
  pageSeo,
  fallbackTitle,
  fallbackDescription,
  fallbackImage,
  path = '',
  organization,
  preloadImage,
  preloadWidths,
  matches,
}: BuildMetaArgs): MetaDescriptor[] {
  const settings =
    (matches?.find((m) => m?.id === 'root')?.data as { settings?: any } | undefined)?.settings ?? {}

  const siteName = pageSeo?.openGraph?.siteName || settings?.siteName || 'SIARI BUILD'

  const title = pageSeo?.metaTitle || pageSeo?.openGraph?.title || fallbackTitle || siteName
  const fullTitle = title === siteName ? title : `${title} | ${siteName}`

  const description =
    pageSeo?.metaDescription ||
    pageSeo?.openGraph?.description ||
    fallbackDescription ||
    settings?.tagline ||
    ''

  const image = pageSeo?.openGraph?.image || pageSeo?.metaImage || fallbackImage || ''
  const canonical = `${SITE_URL}${path}`
  const robots = pageSeo?.nofollowAttributes ? 'noindex, nofollow' : 'index, follow'

  const tags: MetaDescriptor[] = [
    { title: fullTitle },
    { name: 'description', content: description },
    { name: 'robots', content: robots },
    { tagName: 'link', rel: 'canonical', href: canonical },

    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: siteName },
    { property: 'og:title', content: pageSeo?.openGraph?.title || fullTitle },
    { property: 'og:description', content: pageSeo?.openGraph?.description || description },
    { property: 'og:url', content: canonical },

    { name: 'twitter:card', content: pageSeo?.twitter?.cardType || 'summary_large_image' },
    { name: 'twitter:title', content: pageSeo?.openGraph?.title || fullTitle },
    { name: 'twitter:description', content: pageSeo?.openGraph?.description || description },
  ]

  // Responsive hero preload — matches the hero <img> (crossOrigin anonymous +
  // 100vw srcset), so the LCP image starts downloading immediately without the
  // browser waiting to discover it, and without over-fetching on mobile.
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

  if (pageSeo?.seoKeywords?.length) tags.push({ name: 'keywords', content: pageSeo.seoKeywords.join(', ') })
  if (image) {
    tags.push({ property: 'og:image', content: image })
    tags.push({ name: 'twitter:image', content: image })
  }
  if (pageSeo?.twitter?.site) tags.push({ name: 'twitter:site', content: pageSeo.twitter.site })
  if (pageSeo?.twitter?.creator) tags.push({ name: 'twitter:creator', content: pageSeo.twitter.creator })

  if (organization) {
    tags.push({
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@type': 'GeneralContractor',
        name: siteName,
        url: SITE_URL || undefined,
        image: image || undefined,
        description: description || undefined,
        telephone: settings?.phone || undefined,
        email: settings?.email || undefined,
        address: settings?.address
          ? { '@type': 'PostalAddress', streetAddress: settings.address }
          : undefined,
        geo:
          settings?.mapLocation?.lat != null && settings?.mapLocation?.lng != null
            ? {
                '@type': 'GeoCoordinates',
                latitude: settings.mapLocation.lat,
                longitude: settings.mapLocation.lng,
              }
            : undefined,
      },
    })
  }

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
