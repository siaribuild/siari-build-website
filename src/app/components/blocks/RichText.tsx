import { PortableText } from '@portabletext/react'
import { themeBg, type Theme } from './themeUtils'
import { portableTextComponents } from './portableTextComponents'

interface Props {
  theme?: Theme
  eyebrow?: string
  heading?: string
  content?: any[]
}

export function RichText({ theme = 'light', eyebrow, heading, content }: Props) {
  return (
    <section className={`py-24 lg:py-32 ${themeBg(theme)}`}>
      <div className="max-w-3xl mx-auto px-6 lg:px-12">
        {eyebrow && (
          <div className="mb-4 text-sm tracking-[0.3em] uppercase text-[#B8946A]">{eyebrow}</div>
        )}
        {heading && (
          <h1
            className="mb-10 uppercase"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.02em' }}
          >
            {heading}
          </h1>
        )}
        {content && (
          <div className="text-lg">
            <PortableText value={content} components={portableTextComponents} />
          </div>
        )}
      </div>
    </section>
  )
}
