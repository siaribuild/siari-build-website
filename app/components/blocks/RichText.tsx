import { PortableText } from '@portabletext/react'
import { themeBg, sectionPad, type Theme } from './themeUtils'
import { renderMultiline } from './renderMultiline'
import { portableTextComponents } from './portableTextComponents'

interface Props {
  theme?: Theme
  joinTop?: boolean
  joinBottom?: boolean
  eyebrow?: string
  heading?: string
  content?: any[]
}

export function RichText({ theme = 'light', eyebrow, heading, content, joinTop, joinBottom }: Props) {
  return (
    <section className={`${sectionPad(joinTop, joinBottom)} ${themeBg(theme)}`}>
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        {eyebrow && (
          <div className="mb-4 text-sm tracking-[0.3em] uppercase text-accent">{eyebrow}</div>
        )}
        {heading && (
          // Section heading — NOT the page title (the hero supplies the single
          // <h1>). Kept visually identical via the classes/inline styles below.
          <h2
            className="mb-10 uppercase"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.02em' }}
          >
            {renderMultiline(heading)}
          </h2>
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
