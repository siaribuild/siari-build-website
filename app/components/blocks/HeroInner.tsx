import { renderMultiline } from './renderMultiline'
import { CdnImage } from '../CdnImage'

const heightMap = {
  tall: 'min-h-[70vh]',
  half: 'min-h-[40vh]',
  compact: 'min-h-[30vh]',
}

interface Props {
  height?: 'tall' | 'half' | 'compact'
  eyebrow?: string
  heading: string
  subheading?: string
  backgroundImage: string
  backgroundImageHotspot?: { x?: number; y?: number } | null
  /** Authored alt text; empty (decorative) when the editor leaves it blank. */
  backgroundImageAlt?: string | null
}

export function HeroInner({ height = 'half', eyebrow, heading, subheading, backgroundImage, backgroundImageHotspot, backgroundImageAlt }: Props) {
  return (
    <section className={`on-media section--dark relative ${heightMap[height]} flex items-center justify-center overflow-hidden`}>
      <div className="absolute inset-0 opacity-30 hero-zoom">
        <CdnImage src={backgroundImage} hotspot={backgroundImageHotspot} alt={backgroundImageAlt || ''} fill priority sizes="100vw"
          widths={[768, 1024, 1366, 1600, 1920]} />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <div className="corner-bracket absolute top-0 left-0 w-96 h-96" />

      <div className="relative z-10 text-center px-6 py-24">
        {eyebrow && (
          <div className="mb-4 eyebrow">{eyebrow}</div>
        )}
        <h1
          className="mb-6 uppercase"
          style={{ fontSize: 'clamp(3rem, min(8vw, 11vh), 6rem)', fontWeight: 700, lineHeight: 0.95, letterSpacing: '-0.02em' }}>{renderMultiline(heading)}</h1>
        {subheading && (
          <p className="text-xl max-w-3xl mx-auto opacity-90">{subheading}</p>
        )}
      </div>
    </section>
  )
}
