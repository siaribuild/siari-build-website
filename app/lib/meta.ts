import type { MetaDescriptor } from 'react-router'

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
  metaTitle?: string
  metaDescription?: string
  metaImage?: string
  nofollowAttributes?: boolean
  seoKeywords?: string
  openGraph?: { title?: string; description?: string; siteName?: string; image?: string }
  twitter?: { cardType?: string; site?: string; creator?: string; handle?: string }
}

interface BuildMetaArgs {
  pageSeo?: SeoData
  fallbackTitle?: string
  fallbackDescription?: string
  fallbackImage?: string
  path?: string
  /** Emit GeneralContractor JSON-LD (home page only). */
  organization?: boolean
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

  if (pageSeo?.seoKeywords) tags.push({ name: 'keywords', content: pageSeo.seoKeywords })
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
