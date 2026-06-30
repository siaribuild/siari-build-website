import { Link } from 'react-router-dom'
import { useSanity } from '../hooks/useSanity'
import { SITE_SETTINGS_QUERY, NAVIGATION_QUERY } from '../lib/queries'
import { ObfuscatedEmail } from './ObfuscatedEmail'
import logo from '../../imports/logo-black-200-2.png'

export function Footer() {
  const { data: settings } = useSanity<any>(SITE_SETTINGS_QUERY)
  const { data: nav } = useSanity<any>(NAVIGATION_QUERY)

  const footerItems = nav?.footerMenu || []
  const socialItems = nav?.socialMenu || []

  const hrefFor = (slug: string) => (slug === 'home' ? '/' : `/${slug}`)

  return (
    <footer className="bg-[#0a0a0a] text-[#F5F3EF] py-20 border-t-2 border-[#B8946A] relative overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          <div className="text-center">
            <img src={logo} alt={settings?.siteName || 'SIARI BUILD'} width={200} height={200} className="h-32 w-auto brightness-0 invert mb-6 mx-auto opacity-70" />
          </div>
          <div>
            <p className="opacity-70 leading-relaxed">{settings?.tagline || 'Premium residential construction across Melbourne. Built with precision, designed to last.'}</p>
          </div>
          <div>
            <h4 className="mb-6 text-sm tracking-[0.2em] uppercase text-[#B8946A]">Navigation</h4>
            <nav className="space-y-3">
              {footerItems.map((item: any) => (
                <Link
                  key={item.pageSlug}
                  to={hrefFor(item.pageSlug)}
                  className="block opacity-70 hover:opacity-100 hover:text-[#B8946A] transition-all"
                >
                  {item.label || item.pageTitle}
                </Link>
              ))}
            </nav>
          </div>
          <div>
            <h4 className="mb-6 text-sm tracking-[0.2em] uppercase text-[#B8946A]">Contact</h4>
            <div className="space-y-3 opacity-70">
              {settings?.address && <p className="whitespace-pre-line">{settings.address}</p>}
              {settings?.email && <ObfuscatedEmail email={settings.email} className="block hover:text-[#B8946A] transition-all" />}
              {settings?.phone && (
                <a
                  href={`tel:${String(settings.phone).replace(/[^\d+]/g, '')}`}
                  className="block hover:text-[#B8946A] transition-all"
                >
                  {settings.phone}
                </a>
              )}
            </div>
          </div>
          <div>
            <h4 className="mb-6 text-sm tracking-[0.2em] uppercase text-[#B8946A]">Follow</h4>
            <div className="flex flex-col gap-3">
              {socialItems.map((item: any) => (
                <a
                  key={item.label}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 opacity-70 hover:opacity-100 hover:text-[#B8946A] transition-all"
                >
                  {item.icon && <img src={item.icon} alt="" className="w-5 h-5 object-contain" />}
                  <span>{item.label}</span>
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
