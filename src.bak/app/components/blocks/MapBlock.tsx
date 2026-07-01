import { useEffect, useRef, useState } from 'react'
import { useSanity } from '../../hooks/useSanity'
import { SITE_SETTINGS_QUERY } from '../../lib/queries'

interface Props {
  height?: 'small' | 'medium' | 'large'
}

const HEIGHTS: Record<string, number> = { small: 300, medium: 500, large: 700 }

// Map styling tuned to the site palette: warm cream land, muted features, no
// noisy POIs or icons — so the map reads as part of the brand, not a default
// Google map. (A JSON `styles` array only applies when no mapId is set, which
// is why this uses the classic styled-map approach.)
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

// Bronze teardrop pin to match the accent.
const PIN = {
  path: 'M12 0C7.582 0 4 3.582 4 8c0 5.25 8 16 8 16s8-10.75 8-16c0-4.418-3.582-8-8-8z',
  fillColor: '#B8946A',
  fillOpacity: 1,
  strokeColor: '#111111',
  strokeWeight: 1.25,
  scale: 1.6,
}

let mapsPromise: Promise<any> | null = null
function loadGoogleMaps(apiKey: string): Promise<any> {
  const w = window as any
  if (w.google?.maps) return Promise.resolve(w.google)
  if (mapsPromise) return mapsPromise
  mapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&loading=async`
    script.async = true
    script.defer = true
    script.onload = () => resolve((window as any).google)
    script.onerror = () => reject(new Error('Google Maps failed to load'))
    document.head.appendChild(script)
  })
  return mapsPromise
}

export function MapBlock({ height = 'medium' }: Props) {
  const { data: settings } = useSanity<any>(SITE_SETTINGS_QUERY)
  const ref = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)

  const apiKey = (import.meta.env as any).VITE_GOOGLE_MAPS_API_KEY as string | undefined
  const loc = settings?.mapLocation as { lat?: number; lng?: number } | undefined
  const zoom: number = settings?.mapZoom || 15
  const label: string | undefined = settings?.mapAddressLabel
  const hasMap = Boolean(apiKey && loc?.lat != null && loc?.lng != null)
  const px = HEIGHTS[height] || HEIGHTS.medium

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
        const marker = new google.maps.Marker({
          position: center,
          map,
          icon: { ...PIN, anchor: new google.maps.Point(12, 24) },
          title: label || '',
        })
        if (label) {
          const info = new google.maps.InfoWindow({ content: `<div style="font-family:Inter,sans-serif;font-size:13px;color:#111;padding:2px 4px">${label}</div>` })
          marker.addListener('click', () => info.open({ anchor: marker, map }))
        }
      })
      .catch(() => !cancelled && setFailed(true))
    return () => {
      cancelled = true
    }
  }, [hasMap, apiKey, loc?.lat, loc?.lng, zoom, label])

  // Not configured (no API key or no pin) — hide the block entirely.
  if (!hasMap || failed) return null

  return (
    <section className="w-full" style={{ height: px }}>
      <div ref={ref} className="w-full h-full" />
    </section>
  )
}
