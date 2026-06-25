import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { useSanity } from '../hooks/useSanity'
import { SITE_SETTINGS_QUERY } from '../lib/queries'
import { Seo } from '../components/Seo'

export function NotFoundPage() {
  const { data: settings } = useSanity<any>(SITE_SETTINGS_QUERY)

  const heading = settings?.notFoundHeading || 'PAGE NOT FOUND'
  const message = settings?.notFoundMessage || "The page you're looking for doesn't exist or has been moved."
  const buttonLabel = settings?.notFoundButtonLabel || 'Back to Home'
  const bgImage = settings?.notFoundImage

  return (
    <>
      <Seo seo={{ nofollowAttributes: true }} fallbackTitle="Page Not Found" path="/404" />

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#111111] text-[#F5F3EF]">
        {bgImage && (
          <motion.div
            className="absolute inset-0 bg-cover bg-center opacity-25"
            style={{ backgroundImage: `url(${bgImage})` }}
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

        <div className="relative z-10 text-center px-6 py-24">
          <div className="mb-4 text-sm tracking-[0.3em] uppercase text-[#B8946A]">Error 404</div>
          <h1
            className="mb-6"
            style={{ fontSize: 'clamp(3.5rem, 12vw, 9rem)', fontWeight: 700, lineHeight: 0.9, letterSpacing: '-0.02em' }}
          >
            {heading}
          </h1>
          <p className="text-xl max-w-2xl mx-auto opacity-90 mb-10">{message}</p>
          <Link
            to="/"
            className="inline-block bg-[#B8946A] text-[#F5F3EF] px-10 py-4 text-sm tracking-wider uppercase transition-all hover:bg-[#F5F3EF] hover:text-[#111111]"
            style={{ clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))' }}
          >
            {buttonLabel}
          </Link>
        </div>
      </section>
    </>
  )
}
