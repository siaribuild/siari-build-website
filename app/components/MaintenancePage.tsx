import { Phone, Mail } from 'lucide-react'
import { useRootData } from '../lib/root-data'
import { ObfuscatedEmail } from './ObfuscatedEmail'
import { img } from '../lib/image'
import logo from '../../imports/logo-black-200-2.png'

// The ENTIRE site renders this when the build was produced with maintenance ON
// (root.tsx returns it instead of the Header/Outlet/Footer). Because it's a
// build-time decision, the real page content is never generated or shipped —
// there is nothing to bypass by disabling JS or reading source. Content comes
// from the baked root-loader settings (maintenance* fields).
export function MaintenancePage() {
  const { settings } = useRootData()

  const heading = settings?.maintenanceHeading
  const message = settings?.maintenanceMessage
  const showContact = settings?.maintenanceShowContact
  const bgImage = settings?.maintenanceImage

  const boxStyle = { clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }

  return (
    <section className="on-media section--dark relative min-h-screen flex items-center justify-center overflow-hidden">
      {bgImage && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20 hero-zoom"
          style={{ backgroundImage: `url(${img(bgImage, { w: 1920 })})` }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/40" />

      <div
        className="absolute top-0 left-0 w-96 h-96 corner-bracket"
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% 60px, 60px 60px, 60px 100%, 0 100%)' }}
      />

      <div className="relative z-10 text-center px-6 py-24 max-w-3xl">
        <img src={logo} alt={settings?.siteName || 'SIARI BUILD'} width={200} height={200} className="h-20 w-auto brightness-0 invert mx-auto mb-12 opacity-90" />

        <div className="mb-4 text-sm tracking-[0.3em] uppercase text-accent">Maintenance</div>
        <h1
          className="mb-6 uppercase"
          style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)', fontWeight: 700, lineHeight: 0.95, letterSpacing: '-0.02em' }}
        >
          {heading || "WE'LL BE RIGHT BACK"}
        </h1>
        <p className="text-xl opacity-90 mb-12">
          {message || "Our site is currently undergoing scheduled maintenance. We'll be back online shortly."}
        </p>

        {showContact && (settings?.phone || settings?.email) && (
          <div className="flex flex-wrap gap-6 justify-center">
            {settings?.phone && (
              <a
                href={`tel:${settings.phone}`}
                className="contact-chip flex items-center gap-3 px-6 py-3 transition-all"
                style={boxStyle}
              >
                <Phone size={18} className="text-accent" />
                <span>{settings.phone}</span>
              </a>
            )}
            {settings?.email && (
              <div
                className="contact-chip flex items-center gap-3 px-6 py-3 transition-all"
                style={boxStyle}
              >
                <Mail size={18} className="text-accent" />
                <ObfuscatedEmail email={settings.email} className="cursor-pointer" />
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
