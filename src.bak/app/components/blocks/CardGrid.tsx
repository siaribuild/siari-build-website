import { themeBg, themeCard, themeSectionFill, themeIconMaskColor, sectionPad, type Theme } from './themeUtils'
import { renderMultiline } from './renderMultiline'

interface Card {
  icon?: string
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

const FULL_CLIP = 'polygon(0 0, calc(100% - 30px) 0, 100% 30px, 100% 100%, 0 100%)'
const COMPACT_CLIP = 'polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 0 100%)'
const TILE_CLIP = 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)'

function maskStyle(url: string) {
  return {
    WebkitMaskImage: `url(${url})`,
    maskImage: `url(${url})`,
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    maskPosition: 'center',
    WebkitMaskSize: 'contain',
    maskSize: 'contain',
  } as const
}

export function CardGrid({ theme = 'light', eyebrow, heading, cards, columns, joinTop, joinBottom }: Props) {
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
          {cards.map((card, i) => {
            // No body text → compact card (icon + title only), per the design.
            const compact = !card.text
            return (
              <div
                key={i}
                className={`${themeCard(theme)} p-8 border-l-4 border-[#B8946A]`}
                style={{ clipPath: compact ? COMPACT_CLIP : FULL_CLIP }}
              >
                {card.icon && !compact && (
                  <div className={`mb-6 p-4 inline-block ${themeSectionFill(theme)}`} style={{ clipPath: TILE_CLIP }}>
                    <span aria-hidden="true" className={`block w-8 h-8 ${themeIconMaskColor(theme)}`} style={maskStyle(card.icon)} />
                  </div>
                )}
                {card.icon && compact && (
                  <span aria-hidden="true" className="block w-7 h-7 mb-4 bg-[#B8946A]" style={maskStyle(card.icon)} />
                )}
                <h3 className="mb-3" style={{ fontSize: compact ? '1.125rem' : '1.25rem', fontWeight: 600 }}>{card.title}</h3>
                {card.text && <p className="opacity-70 text-sm leading-relaxed">{card.text}</p>}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
