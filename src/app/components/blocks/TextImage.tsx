import { PortableText } from '@portabletext/react'
import { SmartLink } from '../SmartLink'
import { resolveHref, type SanityLink } from '../../lib/links'
import { ArrowRight } from 'lucide-react'
import { themeBg, themeStatCard, themePrimaryBtn, sectionPad, type Theme } from './themeUtils'
import { renderMultiline } from './renderMultiline'
import { img } from '../../lib/image'

interface Stat { value: string; label: string }

// Literal classes so Tailwind's JIT actually generates them (a `grid-cols-${n}`
// template string would be purged).
const statColMap: Record<number, string> = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3' }

// Initial desktop image height; stays responsive via the smaller mobile base.
const imgHeightMap: Record<string, string> = {
  tall: 'h-[500px] lg:h-[700px]',
  medium: 'h-[450px] lg:h-[600px]',
  short: 'h-[400px] lg:h-[500px]',
}

interface Props {
  theme?: Theme
  joinTop?: boolean
  joinBottom?: boolean
  imagePosition?: 'left' | 'right'
  imageSize?: 'tall' | 'medium' | 'short'
  image: string
  eyebrow?: string
  heading?: string
  text?: any[]
  stats?: Stat[]
  ctaLabel?: string
  ctaLink?: SanityLink | null
}

export function TextImage({ theme = 'light', imagePosition = 'left', imageSize = 'tall', image, eyebrow, heading, text, stats, ctaLabel, ctaLink, joinTop, joinBottom }: Props) {
  const imageCol = imagePosition === 'left' ? 'lg:order-1' : 'lg:order-2'
  const textCol = imagePosition === 'left' ? 'lg:order-2' : 'lg:order-1'
  // When the block is just a heading (no eyebrow, stats, or button), let it run large.
  const minimal = !eyebrow && (!stats || stats.length === 0) && !(ctaLabel && resolveHref(ctaLink))
  const headingStyle = minimal
    ? { fontSize: 'clamp(3rem, 8vw, 5.5rem)', fontWeight: 700, lineHeight: 0.9, letterSpacing: '-0.02em' }
    : { fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em' }

  return (
    <section className={`${sectionPad(joinTop, joinBottom)} ${themeBg(theme)}`}>
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div
            className={`relative ${imgHeightMap[imageSize] || imgHeightMap.tall} overflow-hidden order-1 ${imageCol}`}
            style={{ clipPath: 'polygon(0 0, calc(100% - 60px) 0, 100% 60px, 100% 100%, 0 100%)' }}
          >
            <div className="absolute inset-0 bg-cover bg-center w-full h-full" style={{ backgroundImage: `url(${img(image, { w: 1200 })})` }}>
              <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-transparent" />
            </div>
          </div>

          <div className={`order-2 ${textCol}`}>
            {eyebrow && (
              <div className="mb-4 text-sm tracking-[0.3em] uppercase text-accent">{eyebrow}</div>
            )}
            {heading && (
              <h2
                className="mb-8 uppercase"
                style={headingStyle}>{renderMultiline(heading)}</h2>
            )}
            {text && (
              <div className="space-y-6 text-lg opacity-80 leading-relaxed">
                <PortableText value={text} />
              </div>
            )}

            {stats && stats.length > 0 && (
              <div className={`mt-12 grid ${statColMap[Math.min(stats.length, 3)] || 'grid-cols-3'} gap-6`}>
                {stats.map((stat, i) => (
                  <div
                    key={i}
                    className={`p-8 brand-border-left ${themeStatCard(theme)}`}
                    style={{ clipPath: 'polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 0 100%)' }}
                  >
                    <div className="text-4xl mb-2" style={{ fontWeight: 700 }}>{stat.value}</div>
                    <div className="text-sm tracking-wider uppercase">{stat.label}</div>
                  </div>
                ))}
              </div>
            )}

            {ctaLabel && (
              <SmartLink
                link={ctaLink}
                className={`mt-10 px-10 py-4 text-sm tracking-wider uppercase transition-all inline-flex items-center gap-3 ${themePrimaryBtn(theme)}`}
                style={{ clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 15px 100%, 0 calc(100% - 15px))' }}
              >
                {ctaLabel}
                <ArrowRight size={18} />
              </SmartLink>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
