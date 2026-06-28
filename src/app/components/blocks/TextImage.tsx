import { PortableText } from '@portabletext/react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { themeBg, themeStatCard, themePrimaryBtn, sectionPad, type Theme } from './themeUtils'
import { renderMultiline } from './renderMultiline'
import { img } from '../../lib/image'

interface Stat { value: string; label: string }

// Literal classes so Tailwind's JIT actually generates them (a `grid-cols-${n}`
// template string would be purged).
const statColMap: Record<number, string> = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3' }

interface Props {
  theme?: Theme
  joinTop?: boolean
  joinBottom?: boolean
  imagePosition?: 'left' | 'right'
  image: string
  eyebrow?: string
  heading?: string
  text?: any[]
  stats?: Stat[]
  ctaLabel?: string
  ctaLink?: string
}

export function TextImage({ theme = 'light', imagePosition = 'left', image, eyebrow, heading, text, stats, ctaLabel, ctaLink, joinTop, joinBottom }: Props) {
  const navigate = useNavigate()
  const imageCol = imagePosition === 'left' ? 'lg:order-1' : 'lg:order-2'
  const textCol = imagePosition === 'left' ? 'lg:order-2' : 'lg:order-1'

  return (
    <section className={`${sectionPad(joinTop, joinBottom)} ${themeBg(theme)}`}>
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div
            className={`relative h-[500px] lg:h-[700px] overflow-hidden order-1 ${imageCol}`}
            style={{ clipPath: 'polygon(0 0, calc(100% - 60px) 0, 100% 60px, 100% 100%, 0 100%)' }}
          >
            <div className="absolute inset-0 bg-cover bg-center w-full h-full" style={{ backgroundImage: `url(${img(image, { w: 1200 })})` }}>
              <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-transparent" />
            </div>
          </div>

          <div className={`order-2 ${textCol}`}>
            {eyebrow && (
              <div className="mb-4 text-sm tracking-[0.3em] uppercase text-[#B8946A]">{eyebrow}</div>
            )}
            {heading && (
              <h2
                className="mb-8 uppercase"
                style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em' }}>{renderMultiline(heading)}</h2>
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
                    className={`p-8 border-l-4 border-[#B8946A] ${themeStatCard(theme)}`}
                    style={{ clipPath: 'polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 0 100%)' }}
                  >
                    <div className="text-4xl mb-2" style={{ fontWeight: 700 }}>{stat.value}</div>
                    <div className="text-sm tracking-wider uppercase">{stat.label}</div>
                  </div>
                ))}
              </div>
            )}

            {ctaLabel && ctaLink && (
              <button
                onClick={() => navigate(ctaLink)}
                className={`mt-10 px-10 py-4 text-sm tracking-wider uppercase transition-all inline-flex items-center gap-3 ${themePrimaryBtn(theme)}`}
                style={{ clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 15px 100%, 0 calc(100% - 15px))' }}
              >
                {ctaLabel}
                <ArrowRight size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
