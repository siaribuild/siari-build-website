import { SmartLink } from '../SmartLink'
import { themeBg, themeStatCard, sectionPad, type Theme } from './themeUtils'
import { renderMultiline } from './renderMultiline'

interface LinkedRef {
  _type: string
  slug?: string
  title?: string
}

interface Testimonial {
  _id: string
  quote: string
  clientName: string
  link?: LinkedRef | null
}

interface Props {
  theme?: Theme
  joinTop?: boolean
  joinBottom?: boolean
  eyebrow?: string
  heading?: string
  testimonials?: Testimonial[]
}

export function TestimonialsBlock({ theme = 'light', eyebrow, heading, testimonials, joinTop, joinBottom }: Props) {
  if (!testimonials?.length) return null

  return (
    <section className={`${sectionPad(joinTop, joinBottom)} ${themeBg(theme)}`}>
      <div className="max-w-4xl mx-auto px-6 lg:px-12">
        {(eyebrow || heading) && (
          <div className="text-center mb-16">
            {eyebrow && (
              <div className="mb-4 text-sm tracking-[0.3em] uppercase text-[#B8946A]">{eyebrow}</div>
            )}
            {heading && (
              <h2 className="uppercase" style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 700, lineHeight: 1 }}>
                {renderMultiline(heading)}
              </h2>
            )}
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {testimonials.map((t) => (
            <div
              key={t._id}
              className={`p-10 border-l-4 border-[#B8946A] ${themeStatCard(theme)}`}
              style={{ clipPath: 'polygon(0 0, calc(100% - 36px) 0, 100% 36px, 100% 100%, 0 100%)' }}
            >
              <div className="text-5xl mb-6 text-[#B8946A] opacity-20">"</div>
              <p className="text-lg mb-8 leading-relaxed">{t.quote}</p>
              <div className="pl-4">
                <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>{t.clientName}</div>
                {t.link?.title && t.link.slug && (
                  <SmartLink
                    link={{ kind: 'internal', internal: { _type: t.link._type, slug: t.link.slug } }}
                    className="inline-block text-sm opacity-70 mt-1 hover:opacity-100 hover:text-[#B8946A] transition-colors"
                  >
                    {t.link.title}
                  </SmartLink>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
