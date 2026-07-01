import { themeBg, themeCard, sectionPad, type Theme } from './themeUtils'
import { renderMultiline } from './renderMultiline'

interface Card {
  label?: string
  title: string
  text?: string
}

interface Props {
  theme?: Theme
  joinTop?: boolean
  joinBottom?: boolean
  eyebrow?: string
  heading?: string
  cards: Card[]
  columns: 2 | 3 | 4
}

const colMap: Record<number, string> = {
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
}

const CLIP = 'polygon(0 0, calc(100% - 30px) 0, 100% 30px, 100% 100%, 0 100%)'

export function CardGridText({ theme = 'light', eyebrow, heading, cards, columns, joinTop, joinBottom }: Props) {
  // On dark sections the faded label reads as bronze; on light it's near-black.
  // The dark opacity is higher so its presence roughly matches the light card.
  const isDark = theme === 'dark'
  const labelColor = isDark ? '#B8946A' : '#111111'
  const labelOpacity = isDark ? 0.35 : 0.1
  return (
    <section className={`${sectionPad(joinTop, joinBottom)} ${themeBg(theme)}`}>
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        {(eyebrow || heading) && (
          <div className="text-center mb-16">
            {eyebrow && <div className="mb-4 text-sm tracking-[0.3em] uppercase text-[#B8946A]">{eyebrow}</div>}
            {heading && (
              <h2 className="uppercase" style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 700, lineHeight: 1 }}>
                {renderMultiline(heading)}
              </h2>
            )}
          </div>
        )}
        <div className={`grid ${colMap[columns] || colMap[3]} gap-6`}>
          {cards.map((card, i) => (
            <div
              key={i}
              className={`relative ${themeCard(theme)} p-8 border-l-4 border-[#B8946A]`}
              style={{ clipPath: CLIP }}
            >
              {card.label && (
                // Large faded label (e.g. "01") — bronze on dark, near-black on light.
                <div className="leading-none mb-6" style={{ fontSize: '4.5rem', fontWeight: 700, color: labelColor, opacity: labelOpacity }}>
                  {card.label}
                </div>
              )}
              <h3 className="mb-3" style={{ fontSize: '1.5rem', fontWeight: 700 }}>{card.title}</h3>
              {card.text && <p className="opacity-70 text-sm leading-relaxed">{card.text}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
