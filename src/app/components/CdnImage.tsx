import { img, srcSet } from '../lib/image'

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
}

/**
 * Responsive Sanity image. Emits `srcset`/`sizes` so the browser downloads the
 * smallest file that fits, sets `fetchpriority`/`loading`/`decoding` correctly,
 * and (for the LCP hero) can be paired with a `<link rel="preload">` in index.html.
 *
 * Replaces CSS `background-image`, which can't be prioritized, made responsive,
 * or preloaded — the single biggest LCP win on this site.
 */
export function CdnImage({
  src, alt, sizes = '100vw', width, height,
  priority = false, className = '', style, widths, fill = false, q,
}: Props) {
  if (!src) return null
  const set = srcSet(src, { widths, q })
  const fillCls = fill ? 'absolute inset-0 w-full h-full object-cover' : ''
  return (
    <img
      src={img(src, { w: width || 1600, q })}
      srcSet={set || undefined}
      sizes={set ? sizes : undefined}
      alt={alt}
      width={width}
      height={height}
      className={`${fillCls} ${className}`.trim()}
      style={style}
      loading={priority ? 'eager' : 'lazy'}
      // @ts-expect-error fetchpriority is a valid HTML attribute React passes through
      fetchpriority={priority ? 'high' : undefined}
      decoding={priority ? 'sync' : 'async'}
    />
  )
}
