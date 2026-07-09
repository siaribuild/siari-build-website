import { useEffect, useRef, useState } from 'react'
import { useRootData } from '../../lib/root-data'

interface Props {
  height?: 'small' | 'medium' | 'large'
}

const HEIGHTS: Record<string, number> = { small: 300, medium: 500, large: 700 }

// Map styling tuned to the site palette: warm cream land, muted features, no
// noisy POIs or icons — so the map reads as part of the brand, not a default
// Google map. (A JSON `styles` array only applies when no mapId is set, which
// is why this uses the classic styled-map approach. )
const BRAND_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#F5F3EF' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#6f6a61' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#F5F3EF' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#C8C5BE' }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ color: '#ECE8E0' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#DFE2D4' }, { visibility: 'on' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#E4E0D8' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8a8478' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#EBE6DC' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#D7D2C8' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#9a9488' }] },
]

// Bronze teardrop pin to match the brand. Colours read from the CSS tokens
// (--brand-primary / --surface-black) so the pin follows the 3-shade system
// and the legacy fallback with no code change.
function cssToken(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}
const PIN_PATH = 'M12 0C7.582 0 4 3.582 4 8c0 5.25 8 16 8 16s8-10.75 8-16c0-4.418-3.582-8-8-8z'
function pinIcon() {
  return {
    path: PIN_PATH,
    fillColor: cssToken('--brand-primary', '#B8946A'),
    fillOpacity: 1,
    strokeColor: cssToken('--surface-black', '#111111'),
    strokeWeight: 1.25,
    scale: 1.6,
  }
}

let mapsPromise: Promise<any> | null = null

// Loads the Maps JS API.
//
// IMPORTANT: `loading=async` means the API explicitly does NOT signal readiness
// via the script's load event — Google's docs require the `callback` parameter
// instead. Resolving on `script.onload` (the previous behaviour) is a race: the
// script had loaded but `google.maps.Map` was not necessarily defined yet, so
// `new google.maps.Map()` could throw and the block would silently hide itself.
function loadGoogleMaps(apiKey: string): Promise<any> {
  const w = window as any
  if (w.google?.maps?.Map) return Promise.resolve(w.google)
  if (mapsPromise) return mapsPromise

  mapsPromise = new Promise((resolve, reject) => {
    const callbackName = '__siariInitGoogleMaps__'

    // Auth failures (bad key, referrer not allowed, API not enabled, billing off)
    // do NOT fire script.onerror — the script loads fine, then Google calls this.
    w.gm_authFailure = () => {
      console.error(
        '[MapBlock] Google rejected the API key. Check the console for the exact code ' +
          '(RefererNotAllowedMapError = add this hostname to the key restrictions; ' +
          'ApiNotActivatedMapError = enable "Maps JavaScript API"; ' +
          'BillingNotEnabledMapError = enable billing).',
      )
      reject(new Error('Google Maps authentication failed'))
    }

    w[callbackName] = () => {
      delete w[callbackName]
      resolve(w.google)
    }

    const script = document.createElement('script')
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}` +
      `&loading=async&callback=${callbackName}`
    script.async = true
    script.onerror = () => reject(new Error('Google Maps script failed to load (network/blocked)'))
    document.head.appendChild(script)
  })
  return mapsPromise
}

export function MapBlock({ height = 'medium' }: Props) {
  const { settings } = useRootData()
  const ref = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)

  const apiKey = (import.meta.env as any).VITE_GOOGLE_MAPS_API_KEY as string | undefined
  const loc = settings?.mapLocation as { lat?: number; lng?: number } | undefined
  const zoom: number = settings?.mapZoom || 15
  const label: string | undefined = settings?.mapAddressLabel ?? undefined
  // Unset (null) == unchecked in Studio == pin shown. See the schema comment.
  const showPin: boolean = settings?.mapHidePin !== true
  const areaRadius: number | undefined = settings?.mapAreaRadius ?? undefined
  const hasMap = Boolean(apiKey && loc?.lat != null && loc?.lng != null)
  const px = HEIGHTS[height] || HEIGHTS.medium

  // Diagnostics: this block hides itself when unconfigured, which makes a missing
  // key and a missing pin look identical (both = no map, no error). Say which.
  // Client-only (inside an effect) so it never spams the prerender build log.
  useEffect(() => {
    if (hasMap) return
    const missing: string[] = []
    if (!apiKey) missing.push('VITE_GOOGLE_MAPS_API_KEY (build-time env var — set it, then REBUILD; it is baked into the bundle, not read at runtime)')
    if (loc?.lat == null || loc?.lng == null) missing.push('Site Settings → Maps → Map Location (the geopoint pin) in Sanity Studio')
    console.warn(`[MapBlock] Map hidden. Missing: ${missing.join(' AND ')}`)
  }, [hasMap, apiKey, loc?.lat, loc?.lng])

  useEffect(() => {
    if (!hasMap || !ref.current) return
    let cancelled = false
    loadGoogleMaps(apiKey as string)
      .then((google) => {
        if (cancelled || !ref.current) return
        const center = { lat: loc!.lat as number, lng: loc!.lng as number }
        const map = new google.maps.Map(ref.current, {
          center,
          zoom,
          styles: BRAND_MAP_STYLE,
          disableDefaultUI: true,
          zoomControl: true,
          keyboardShortcuts: false,
          gestureHandling: 'cooperative',
        })
        // Optional service-area circle — shows the region served without marking
        // an exact address. Drawn under any pin.
        if (areaRadius && areaRadius > 0) {
          new google.maps.Circle({
            map,
            center,
            radius: areaRadius,
            strokeColor: cssToken('--brand-primary', '#B8946A'),
            strokeOpacity: 0.65,
            strokeWeight: 1.5,
            fillColor: cssToken('--brand-primary', '#B8946A'),
            fillOpacity: 0.12,
            clickable: false,
          })
        }

        // Exact pin — skipped when the site opts out of showing a precise address.
        if (showPin) {
          const marker = new google.maps.Marker({
            position: center,
            map,
            icon: { ...pinIcon(), anchor: new google.maps.Point(12, 24) },
            title: label || '',
          })
          if (label) {
            // Build the InfoWindow content as a DOM node and set the CMS-supplied
            // label via textContent (never string-interpolated into HTML) so a
            // label authored in Sanity can't inject markup/script into the page.
            const el = document.createElement('div')
            el.style.cssText = 'font-family:Inter,sans-serif;font-size:13px;color:#111;padding:2px 4px'
            el.textContent = label
            const info = new google.maps.InfoWindow({ content: el })
            marker.addListener('click', () => info.open({ anchor: marker, map }))
          }
        }
      })
      .catch((err) => {
        if (cancelled) return
        console.error('[MapBlock] Google Maps failed to load. Check the browser console for a Google error code (ApiNotActivatedMapError / RefererNotAllowedMapError / BillingNotEnabledMapError).', err)
        setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [hasMap, apiKey, loc?.lat, loc?.lng, zoom, label, showPin, areaRadius])

  // Not configured (no API key or no pin) — hide the block entirely.
  if (!hasMap || failed) return null

  return (
    <section className="w-full --brand-primary" style={{ height: px }}>
      <div ref={ref} className="w-full h-full" />
    </section>
  )
}
