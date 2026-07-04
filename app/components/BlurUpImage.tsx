import { useState } from 'react'
import { img, srcSet, localFallbackPath } from '../lib/image'

type Props = {
  url: string
  /** Sanity's base64 low-quality image placeholder (asset->metadata.lqip). */
  lqip?: string
  alt?: string
  sizes?: string
  widths?: number[]
  /** Intrinsic width for the non-srcset `src`. */
  w?: number
  q?: number
  className?: string
}

/**
 * Blur-up image for galleries. Sanity gives us a tiny base64 `lqip` blur in the
 * image metadata; we paint that instantly (so every slot shows *something* the
 * moment it's in view), then fade the full image in over the top once it loads —
 * so photos sharpen into place instead of popping in at random. Fills its parent
 * (parent must be `relative` with a reserved height/aspect).
 *
 * crossOrigin="anonymous" keeps cookies off the cdn.sanity.io request (Best
 * Practices), and onError falls back to the baked local copy if Sanity is down.
 */
export function BlurUpImage({
  url, lqip, alt = '', sizes = '100vw', widths, w = 1000, q, className = '',
}: Props) {
  const [loaded, setLoaded] = useState(false)
  const fallback = localFallbackPath(url)

  return (
    <>
      {lqip && (
        <img
          src={lqip}
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 w-full h-full object-cover scale-105 blur-xl transition-opacity duration-700 ${
            loaded ? 'opacity-0' : 'opacity-100'
          }`}
        />
      )}
      <img
        src={img(url, { w, q })}
        srcSet={srcSet(url, { widths, q }) || undefined}
        sizes={sizes}
        alt={alt}
        loading="lazy"
        decoding="async"
        crossOrigin="anonymous"
        onLoad={() => setLoaded(true)}
        onError={
          fallback
            ? (e) => {
                const el = e.currentTarget
                if (el.dataset.fellBack) return
                el.dataset.fellBack = '1'
                el.srcset = ''
                el.src = fallback
                setLoaded(true)
              }
            : () => setLoaded(true)
        }
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
          loaded ? 'opacity-100' : 'opacity-0'
        } ${className}`.trim()}
      />
    </>
  )
}
