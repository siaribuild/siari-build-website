import { img, srcSet, localFallbackPath } from '../lib/image'

type Props = {
  src: string | undefined | null
  alt: string
  /** `sizes` attribute — how wide the image renders at each breakpoint. */
  sizes?: string
  /** Intrinsic width the `src` fallback is generated at. */
  width?: number
  height?: number
  /** LCP image: eager + high priority. Everything else stays lazy. */
  priority?: boolean
  className?: string
  style?: React.CSSProperties
  widths?: number[]
  /** Cover the parent (absolute inset-0 object-cover). Used for hero/card fills. */
  fill?: boolean
  q?: number
  /** Sanity hotspot {x,y} in 0..1. When set on a `fill` image, drives
   *  object-position so the focal point (e.g. a face) stays in frame at any
   *  aspect ratio. Falls back to centered cropping when absent. */
  hotspot?: { x?: number; y?: number } | null
}

/**
 * Responsive Sanity image. Emits `srcset`/`sizes` so the browser downloads the
 * smallest file that fits, sets `fetchpriority`/`loading`/`decoding` correctly,
 * and (for the LCP hero) can be paired with a `<link rel="preload">`.
 *
 * RESILIENCE: if the Sanity CDN request fails (e.g. cdn.sanity.io is down), the
 * `onError` handler swaps to a same-origin local copy baked into the build at
 * /img-fallback/<assetId>.<ext> (see scripts/finalize-build.mjs). Sanity's
 * on-the-fly transforms remain the primary source; this only catches failure.
 */
export function CdnImage({
  src, alt, sizes = '100vw', width, height,
  priority = false, className = '', style, widths, fill = false, q, hotspot,
}: Props) {
  if (!src) return null
  const set = srcSet(src, { widths, q })
  const fillCls = fill ? 'absolute inset-0 w-full h-full object-cover' : ''
  const fallback = localFallbackPath(src)
  const objectPosition =
    fill && hotspot && hotspot.x != null && hotspot.y != null
      ? `${(hotspot.x * 100).toFixed(2)}% ${(hotspot.y * 100).toFixed(2)}%`
      : undefined
  const mergedStyle = objectPosition ? { ...style, objectPosition } : style

  return (
    <img
      src={img(src, { w: width || 1600, q })}
      srcSet={set || undefined}
      sizes={set ? sizes : undefined}
      alt={alt}
      width={width}
      height={height}
      className={`${fillCls} ${className}`.trim()}
      style={mergedStyle}
      loading={priority ? 'eager' : 'lazy'}
      // @ts-expect-error fetchpriority is a valid HTML attribute React passes through
      fetchpriority={priority ? 'high' : undefined}
      decoding={priority ? 'sync' : 'async'}
      crossOrigin="anonymous"
      onError={
        fallback
          ? (e) => {
              const el = e.currentTarget
              // Guard against a loop if the fallback itself 404s.
              if (el.dataset.fellBack) return
              el.dataset.fellBack = '1'
              el.srcset = ''
              el.sizes = ''
              el.src = fallback
            }
          : undefined
      }
    />
  )
}
