import { motion } from 'motion/react'
import { Phone, Mail } from 'lucide-react'
import { useSanity } from '../hooks/useSanity'
import { SITE_SETTINGS_QUERY } from '../lib/queries'
import { ObfuscatedEmail } from './ObfuscatedEmail'
import { img } from '../lib/image'
import logo from '../../imports/logo-black-200-2.png'

interface Props {
  heading?: string
  message?: string
  showContact?: boolean
  bgImage?: string
}

export function MaintenanceScreen({ heading, message, showContact, bgImage }: Props) {
  const { data: settings } = useSanity<any>(SITE_SETTINGS_QUERY)

  const boxStyle = { clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#111111] text-[#F5F3EF]">
      {bgImage && (
        <motion.div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${img(bgImage, { w: 1920 })})` }}
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2.5, ease: 'easeOut' }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/40" />

      <div
        className="absolute top-0 left-0 w-96 h-96 border-l-2 border-t-2 border-[#B8946A]/30"
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% 60px, 60px 60px, 60px 100%, 0 100%)' }}
      />

      <div className="relative z-10 text-center px-6 py-24 max-w-3xl">
        <img src={logo} alt={settings?.siteName || 'SIARI BUILD'} width={200} height={200} className="h-20 w-auto brightness-0 invert mx-auto mb-12 opacity-90" />

        <div className="mb-4 text-sm tracking-[0.3em] uppercase text-[#B8946A]">Maintenance</div>
        <h1
          className="mb-6"
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
                className="flex items-center gap-3 border border-[#B8946A]/40 px-6 py-3 transition-all hover:border-[#B8946A] hover:bg-[#B8946A]/10"
                style={boxStyle}
              >
                <Phone size={18} className="text-[#B8946A]" />
                <span>{settings.phone}</span>
              </a>
            )}
            {settings?.email && (
              <div
                className="flex items-center gap-3 border border-[#B8946A]/40 px-6 py-3 transition-all hover:border-[#B8946A] hover:bg-[#B8946A]/10"
                style={boxStyle}
              >
                <Mail size={18} className="text-[#B8946A]" />
                <ObfuscatedEmail email={settings.email} className="cursor-pointer" />
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
