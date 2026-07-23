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

// ── Responsive helpers ──────────────────────────────────────────────────────
// A sensible width ladder for a full-bleed / large image. Trim per call site
// via `widths` when an image is known to be small (thumbnails, icons).
const DEFAULT_WIDTHS = [480, 768, 1024, 1366, 1600, 1920, 2560]

/**
 * Build a `srcset` string for a Sanity image across several widths, so the
 * browser can pick the smallest file that fits the layout + DPR. Non-Sanity
 * URLs return '' (no srcset — the plain src is used).
 */
export function srcSet(
  url: string | undefined | null,
  opts: Omit<ImageOpts, 'w'> & { widths?: number[] } = {},
): string {
  if (!url || !url.includes('cdn.sanity.io') || /\.svg($|\?)/i.test(url)) return ''
  const { widths = DEFAULT_WIDTHS, ...rest } = opts
  return widths.map((w) => `${img(url, { ...rest, w })} ${w}w`).join(', ')
}

// ── Local fallback (resilience if Sanity's CDN is unavailable) ──────────────
// A single-size copy of each Sanity image is downloaded into the build output at
// /img-fallback/<assetId>.<ext> by scripts/finalize-build.mjs. CdnImage swaps to
// this local (same-origin, Cloudflare-served) copy on error, so the site keeps
// its imagery even if cdn.sanity.io is down. Sanity's on-the-fly transforms stay
// the PRIMARY source; this is only the fallback. Returns '' for non-Sanity URLs.
export function localFallbackPath(url: string | undefined | null): string {
  if (!url || !url.includes('cdn.sanity.io/images')) return ''
  if (/\.svg($|\?)/i.test(url)) return ''
  const seg = (url.split('?')[0].split('/').pop() || '')
  const m = seg.match(/^([a-f0-9]+)-\d+x\d+\.(\w+)$/i)
  if (!m) return ''
  return `/img-fallback/${m[1]}.${m[2].toLowerCase()}`
}

// ── Alt-text fallback for project imagery ───────────────────────────────────
// Used when a project image has no authored alt (and, for gallery items, no
// caption): builds a descriptive, project-specific alt from CMS facts only —
// e.g. "Tarneit Cathedral Residence — Custom Home in Tarneit, VIC by SIARI
// Build (photo 3)". `photo` (0-based) keeps multiple gallery images distinct.
export function projectImageAlt(
  p: {
    title?: string | null
    details?: { category?: string | null; location?: string | null } | null
  },
  photo?: number,
): string {
  const subject = [p.title, p.details?.category].filter(Boolean).join(' — ')
  const base = `${subject || 'SIARI Build project'} in ${p.details?.location || 'Melbourne'} by SIARI Build`
  return photo != null ? `${base} (photo ${photo + 1})` : base
}
