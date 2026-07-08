import { Link } from 'react-router'
import { useRootData } from '../lib/root-data'
import { img } from '../lib/image'

// Rendered by routes/not-found.tsx (the "*" route + SPA fallback) and by the
// page/project routes when a slug has no published document. SEO for the 404 is
// emitted by the route's `meta` export; content comes from baked Site Settings.
export function NotFoundPage() {
  const { settings } = useRootData()

  const heading = settings?.notFoundHeading || 'PAGE NOT FOUND'
  const message = settings?.notFoundMessage || "The page you're looking for doesn't exist or has been moved."
  const buttonLabel = settings?.notFoundButtonLabel || 'Back to Home'
  const bgImage = settings?.notFoundImage

  return (
    <section className="on-media section--dark relative min-h-screen flex items-center justify-center overflow-hidden">
      {bgImage && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25 hero-zoom"
          style={{ backgroundImage: `url(${img(bgImage, { w: 1920 })})` }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/40" />

      <div
        className="absolute top-0 left-0 w-96 h-96 corner-bracket"
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% 60px, 60px 60px, 60px 100%, 0 100%)' }}
      />

      <div className="relative z-10 text-center px-6 py-24">
        <div className="mb-4 text-sm tracking-[0.3em] uppercase text-accent">Error 404</div>
        <h1
          className="mb-6 uppercase"
          style={{ fontSize: 'clamp(3.5rem, min(12vw, 16vh), 9rem)', fontWeight: 700, lineHeight: 0.9, letterSpacing: '-0.02em' }}
        >
          {heading}
        </h1>
        <p className="text-xl max-w-2xl mx-auto opacity-90 mb-10">{message}</p>
        <Link
          to="/"
          className="btn-bronze inline-block px-10 py-4 text-sm tracking-wider uppercase transition-all"
          style={{ clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))' }}
        >
          {buttonLabel}
        </Link>
      </div>
    </section>
  )
}
