import { useEffect, useState } from 'react'
import { useSanity } from '../hooks/useSanity'
import { SITE_SETTINGS_QUERY } from '../lib/queries'
import { MaintenanceScreen } from './MaintenanceScreen'

interface Props {
  children: React.ReactNode
}

const BYPASS_KEY = 'siari-maintenance-bypass'

// Wraps the whole site. When maintenance mode is enabled in Site Settings,
// every visitor sees the MaintenanceScreen instead of the site — UNLESS they
// have the bypass flag set for their browser session.
//
// To bypass (so you can view the live site while maintenance is on):
//   visit any URL with ?preview=true appended, e.g.
//   https://siari-build-website.vercel.app/?preview=true
// The flag persists for the rest of that browser session (until the tab is
// closed). To clear it manually, visit ?preview=false.
export function MaintenanceGate({ children }: Props) {
  const { data: settings, loading } = useSanity<any>(SITE_SETTINGS_QUERY)
  const [bypass, setBypass] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const preview = params.get('preview')

    if (preview === 'true') {
      sessionStorage.setItem(BYPASS_KEY, '1')
    } else if (preview === 'false') {
      sessionStorage.removeItem(BYPASS_KEY)
    }

    setBypass(sessionStorage.getItem(BYPASS_KEY) === '1')
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#111111]">
        <div className="w-8 h-8 border-2 border-[#B8946A] border-t-transparent rounded-full animate-spin" />
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

  return <>{children}</>
}
