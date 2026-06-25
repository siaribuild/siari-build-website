import { PortableText } from '@portabletext/react'
import { themeBg, themeStatCard, type Theme } from './themeUtils'

interface Stat { value: string; label: string }
interface Props {
  theme?: Theme
  eyebrow?: string
  heading?: string
  text?: any[]
  stats?: Stat[]
}

export function OurStory({ theme = 'light', eyebrow, heading, text, stats }: Props) {
  return (
    <section className={`py-24 lg:py-32 ${themeBg(theme)}`}>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            {eyebrow && (
              <div className="mb-4 text-sm tracking-[0.3em] uppercase text-[#B8946A]">{eyebrow}</div>
            )}
            {heading && (
              <h2 className="mb-8 uppercase" style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 700, lineHeight: 1.1 }}>
                {heading}
              </h2>
            )}
            {text && (
              <div className="space-y-6 text-lg opacity-80 leading-relaxed">
                <PortableText value={text} />
              </div>
            )}
          </div>
          {stats && stats.length > 0 && (
            <div className="grid grid-cols-2 gap-6">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className={`p-10 border-l-4 border-[#B8946A] ${themeStatCard(theme)}`}
                  style={{ clipPath: 'polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 0 100%)' }}
                >
                  <div className="text-5xl mb-3" style={{ fontWeight: 700 }}>{stat.value}</div>
                  <div className="text-sm tracking-wider uppercase">{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
