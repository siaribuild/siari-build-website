import { Helmet } from 'react-helmet-async'
import { useSanity } from '../hooks/useSanity'
import { SITE_SETTINGS_QUERY } from '../lib/queries'

interface SeoData {
  metaTitle?: string
  metaDescription?: string
  metaImage?: string
  nofollowAttributes?: boolean
  seoKeywords?: string
  openGraph?: {
    title?: string
    description?: string
    siteName?: string
    image?: string
  }
  twitter?: {
    cardType?: string
    site?: string
    creator?: string
    handle?: string
  }
}

interface Props {
  seo?: SeoData
  // Fallbacks used when the SEO object doesn't specify a value
  fallbackTitle?: string
  fallbackDescription?: string
  fallbackImage?: string
  path?: string
}

// Canonical/OG absolute URL base. Set VITE_SITE_URL per environment
// (e.g. https://siaribuild.com.au in production). Falls back to the Vercel
// deployment URL so previews still produce valid absolute URLs.
const SITE_URL = (
  import.meta.env.VITE_SITE_URL || 'https://siari-build-website.vercel.app'
).replace(/\/$/, '')

export function Seo({ seo, fallbackTitle, fallbackDescription, fallbackImage, path = '' }: Props) {
  const { data: settings } = useSanity<{ siteName?: string; tagline?: string }>(SITE_SETTINGS_QUERY)

  const siteName = seo?.openGraph?.siteName || settings?.siteName || 'SIARI BUILD'

  // Title: explicit meta title → OG title → page fallback → site name
  const title = seo?.metaTitle || seo?.openGraph?.title || fallbackTitle || siteName
  const fullTitle = title === siteName ? title : `${title} | ${siteName}`

  // Description cascade
  const description =
    seo?.metaDescription ||
    seo?.openGraph?.description ||
    fallbackDescription ||
    settings?.tagline ||
    ''

  // Image cascade
  const image = seo?.openGraph?.image || seo?.metaImage || fallbackImage || ''

  const canonical = `${SITE_URL}${path}`

  const robots = seo?.nofollowAttributes ? 'noindex, nofollow' : 'index, follow'

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {seo?.seoKeywords && <meta name="keywords" content={seo.seoKeywords} />}
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonical} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={seo?.openGraph?.title || fullTitle} />
      <meta property="og:description" content={seo?.openGraph?.description || description} />
      <meta property="og:url" content={canonical} />
      {image && <meta property="og:image" content={image} />}

      {/* Twitter */}
      <meta name="twitter:card" content={seo?.twitter?.cardType || 'summary_large_image'} />
      {seo?.twitter?.site && <meta name="twitter:site" content={seo.twitter.site} />}
      {seo?.twitter?.creator && <meta name="twitter:creator" content={seo.twitter.creator} />}
      <meta name="twitter:title" content={seo?.openGraph?.title || fullTitle} />
      <meta name="twitter:description" content={seo?.openGraph?.description || description} />
      {image && <meta name="twitter:image" content={image} />}
    </Helmet>
  )
}
