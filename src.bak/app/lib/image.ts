// Appends Sanity CDN transform params to an image URL so we serve a resized,
// modern-format (WebP/AVIF) image instead of the raw original. Sanity's image
// CDN performs these transforms on the fly from the query string.
//
// Safe to call on any URL: non-Sanity URLs, data: URIs, SVGs, and empty values
// are returned unchanged, so it can wrap every image src/background uniformly.

type ImageOpts = {
  /** Target display width in px. Pick ~2x the largest CSS width for retina. */
  w?: number
  /** Optional target height in px. */
  h?: number
  /** JPEG/WebP quality, 1-100. Default 75. */
  q?: number
  /** Sanity fit mode. Default 'max' (never upscales past the original). */
  fit?: 'clip' | 'crop' | 'fill' | 'fillmax' | 'max' | 'min' | 'scale'
}

export function img(url: string | undefined | null, opts: ImageOpts = {}): string {
  if (!url) return ''
  // Only transform Sanity-hosted raster images. Leave SVGs and anything else as-is.
  if (!url.includes('cdn.sanity.io')) return url
  if (/\.svg($|\?)/i.test(url)) return url

  const { w, h, q = 75, fit = 'max' } = opts
  const params = new URLSearchParams()
  if (w) params.set('w', String(w))
  if (h) params.set('h', String(h))
  params.set('q', String(q))
  params.set('fit', fit)
  params.set('auto', 'format') // hands WebP/AVIF to browsers that support them

  // Respect any params already present on the URL (rare, but don't clobber them).
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}${params.toString()}`
}
