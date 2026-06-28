import { useNavigate } from 'react-router-dom'
import { themeBg, themePrimaryBtn, sectionPad, type Theme } from './themeUtils'
import { renderMultiline } from './renderMultiline'

interface Props {
  theme?: Theme
  joinTop?: boolean
  joinBottom?: boolean
  eyebrow?: string
  heading?: string
  body?: string
  buttonLabel?: string
  buttonLink?: string
}

export function CtaBlock({ theme = 'gray', eyebrow, heading, body, buttonLabel, buttonLink, joinTop, joinBottom }: Props) {
  const navigate = useNavigate()

  return (
    <section className={`${sectionPad(joinTop, joinBottom, 'pt-32 lg:pt-40', 'pb-32 lg:pb-40')} ${themeBg(theme)}`}>
      <div className="max-w-[1200px] mx-auto px-6 lg:px-12 text-center">
        {eyebrow && (
          <div className="mb-4 text-sm tracking-[0.3em] uppercase text-[#B8946A]">{eyebrow}</div>
        )}
        {heading && (
          <h2
            className="mb-8 uppercase"
            style={{ fontSize: 'clamp(3rem, 8vw, 5rem)', fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em' }}>{renderMultiline(heading)}</h2>
        )}
        {body && <p className="text-xl mb-12 max-w-2xl mx-auto opacity-70">{body}</p>}
        {buttonLabel && (
          <button
            onClick={() => buttonLink && navigate(buttonLink)}
            className={`px-12 py-5 text-sm tracking-wider uppercase transition-all ${themePrimaryBtn(theme)}`}
            style={{ clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 15px 100%, 0 calc(100% - 15px))' }}
          >
            {buttonLabel}
          </button>
        )}
      </div>
    </section>
  )
}
