import { useEffect, useState } from 'react'
import { useSanity } from '../hooks/useSanity'
import { SITE_SETTINGS_QUERY } from '../lib/queries'
import { MaintenanceScreen } from './MaintenanceScreen'

interface Props {
  children: React.ReactNode
}

const BYPASS_KEY = 'siari-preview-access'

// The secret that unlocks preview access. Set VITE_PREVIEW_KEY in your env
// (locally in .env.local and in the Cloudflare Pages project). If it's unset,
// preview bypass is disabled entirely (fail closed — no accidental open door).
const PREVIEW_KEY = import.meta.env.VITE_PREVIEW_KEY || ''

// Wraps the whole site. When maintenance mode is on in Site Settings, every
// visitor sees the MaintenanceScreen — UNLESS they've unlocked preview access.
//
// HOW AN AUTHORISED PERSON PREVIEWS THE LIVE SITE DURING MAINTENANCE
//   Visit any page with the secret key appended once:
//     https://siaribuild.com.au/?preview=YOUR_SECRET_KEY
//   On a correct key the browser remembers it (localStorage), so you can then
//   browse the entire site normally — every page, across sessions — while the
//   public still sees the maintenance screen. No need to re-add the key.
//   To turn preview off again on that browser: visit ?preview=off
//
// Works identically on localhost and production.
export function MaintenanceGate({ children }: Props) {
  const { data: settings, loading } = useSanity<{
    maintenanceEnabled?: boolean
    maintenanceHeading?: string
    maintenanceMessage?: string
    maintenanceShowContact?: boolean
    maintenanceImage?: string
  }>(SITE_SETTINGS_QUERY)

  const [bypass, setBypass] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const preview = params.get('preview')

    if (preview !== null) {
      if (preview === 'off') {
        // Explicit opt-out
        localStorage.removeItem(BYPASS_KEY)
      } else if (PREVIEW_KEY && preview === PREVIEW_KEY) {
        // Correct secret — unlock and remember
        localStorage.setItem(BYPASS_KEY, '1')
      }
      // Any other value (wrong key) is ignored — no unlock, no error leak.

      // Strip the ?preview param from the URL so the secret isn't left sitting
      // in the address bar / browser history / shared screenshots.
      params.delete('preview')
      const clean =
        window.location.pathname +
        (params.toString() ? `?${params}` : '') +
        window.location.hash
      window.history.replaceState({}, '', clean)
    }

    setBypass(localStorage.getItem(BYPASS_KEY) === '1')
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#111111]">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (settings?.maintenanceEnabled && !bypass) {
    return (
      <MaintenanceScreen
        heading={settings.maintenanceHeading}
        message={settings.maintenanceMessage}
        showContact={settings.maintenanceShowContact}
        bgImage={settings.maintenanceImage}
      />
    )
  }

  return (
    <>
      {children}
      {settings?.maintenanceEnabled && bypass && <PreviewBadge />}
    </>
  )
}

// Small fixed badge shown ONLY to a preview viewer while maintenance is on, so
// they always know the public is seeing the maintenance screen, not the site.
// Normal visitors never reach this (they're served the MaintenanceScreen).
function PreviewBadge() {
  const [hidden, setHidden] = useState(false)
  if (hidden) return null
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '16px',
        left: '16px',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: '#111111',
        color: '#F5F3EF',
        border: '1px solid var(--brand-primary)',
        padding: '8px 12px',
        fontSize: '12px',
        letterSpacing: '0.05em',
        borderRadius: '2px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand-primary)', display: 'inline-block' }} />
      <span>Preview mode — public sees maintenance</span>
      <button
        onClick={() => setHidden(true)}
        aria-label="Dismiss preview indicator"
        style={{ background: 'none', border: 'none', color: '#C8C5BE', cursor: 'pointer', fontSize: '14px', lineHeight: 1, padding: 0 }}
      >
        ✕
      </button>
    </div>
  )
}
