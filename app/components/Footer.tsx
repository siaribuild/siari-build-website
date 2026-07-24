import { Link } from 'react-router'
import { useRootData } from '../lib/root-data'
import { ObfuscatedEmail } from './ObfuscatedEmail'
import logo from '../../imports/logo-black-200-2.png'

export function Footer() {
  const { settings, navigation: nav } = useRootData()

  const footerItems = nav?.footerMenu || []
  // Display-only filter: items flagged "Hide from Follow menu" are omitted here
  // but still feed the business schema's sameAs (see app/lib/meta.ts) — that's
  // how an SEO-only profile (e.g. Google Business Profile) is managed. Unset
  // means visible, so ordinary links need no toggling at all.
  const socialItems = (nav?.socialMenu || []).filter((s: any) => s?.hideFromMenu !== true && s?.url)

  const hrefFor = (slug?: string | null) => (!slug || slug === 'home' ? '/' : `/${slug}`)

  // Address links to Google Maps only when a map pin (geopoint) is set.
  const loc = settings?.mapLocation as { lat?: number; lng?: number } | undefined
  const mapsUrl =
    loc?.lat != null && loc?.lng != null
      ? `https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`
      : undefined

  const telHref = settings?.phone ? `tel:${String(settings.phone).replace(/[^\d+]/g, '')}` : undefined

  // Recolour an uploaded icon SVG to bronze via CSS mask (an <img> can't be
  // recoloured, so a black-filled icon would vanish on the dark footer).
  const maskStyle = (url: string) => ({
    WebkitMaskImage: `url(${url})`,
    maskImage: `url(${url})`,
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    maskPosition: 'center',
    WebkitMaskSize: 'contain',
    maskSize: 'contain',
  }) as const

  return (
    <footer className="on-media bg-[#0a0a0a] text-[#F5F3EF] py-20 brand-border-top-accent relative overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand — logo + tagline */}
          <div>
            <img src={logo} alt={settings?.siteName || 'SIARI Build'} width={200} height={200} className="h-24 w-auto brightness-0 invert mb-6 opacity-70 mx-auto" />
            <p className="opacity-70 leading-relaxed text-center">{settings?.tagline || 'Premium residential construction across Melbourne. Built with precision, designed to last.'}</p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="mb-6 text-sm tracking-[0.2em] uppercase text-accent">Navigation</h3>
            <nav className="space-y-3">
              {footerItems.map((item: any) => (
                <Link
                  key={item.pageSlug}
                  to={hrefFor(item.pageSlug)}
                  className="block opacity-70 hover:opacity-100 hover-accent transition-all"
                >
                  {item.label || item.pageTitle}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-6 text-sm tracking-[0.2em] uppercase text-accent">Contact</h3>
            <div className="space-y-3 opacity-70">
              {settings?.address && (
                mapsUrl ? (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block whitespace-pre-line hover:opacity-100 hover-accent transition-all"
                  >
                    {settings.address}
                  </a>
                ) : (
                  <p className="whitespace-pre-line">{settings.address}</p>
                )
              )}
              {settings?.email && <ObfuscatedEmail email={settings.email} className="block hover-accent transition-all" />}
              {settings?.phone && (
                <a href={telHref} className="block hover-accent transition-all">
                  {settings.phone}
                </a>
              )}
            </div>
          </div>

          {/* Follow */}
          <div>
            <h3 className="mb-6 text-sm tracking-[0.2em] uppercase text-accent">Follow</h3>
            <div className="flex flex-col gap-3">
              {socialItems.map((item: any) => (
                <a
                  key={item.label}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 hover-accent transition-colors"
                >
                  {item.icon && (
                    <span
                      aria-hidden="true"
                      className="icon-mask-primary w-5 h-5 shrink-0"
                      style={maskStyle(item.icon)}
                    />
                  )}
                  <span className="opacity-70 group-hover:opacity-100 transition-opacity">{item.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="pt-8 border-t border-[#F5F3EF]/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm opacity-50">© {new Date().getFullYear()} {settings?.siteName || 'SIARI BUILD'}. {settings?.copyrightText || 'All rights reserved.'}</div>
          <div className="text-sm opacity-50">{settings?.legalLine || 'ABN 12 345 678 901 | Builder License VIC 123456'}</div>
        </div>
      </div>
    </footer>
  )
}
