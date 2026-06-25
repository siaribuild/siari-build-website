import { themeBg, themeCard, themeCardHover, themeIconTile, type Theme } from './themeUtils'

interface Card {
  icon?: string
  title: string
  text?: string
}

interface Props {
  theme?: Theme
  eyebrow?: string
  heading?: string
  cards: Card[]
  columns: 2 | 3 | 4
}

const colMap = {
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
}

export function CardGrid({ theme = 'light', eyebrow, heading, cards, columns }: Props) {
  return (
    <section className={`py-24 lg:py-32 ${themeBg(theme)}`}>
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        {(eyebrow || heading) && (
          <div className="text-center mb-16">
            {eyebrow && (
              <div className="mb-4 text-sm tracking-[0.3em] uppercase text-[#B8946A]">{eyebrow}</div>
            )}
            {heading && (
              <h2 className="uppercase" style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 700, lineHeight: 1 }}>
                {heading}
              </h2>
            )}
          </div>
        )}
        <div className={`grid ${colMap[columns]} gap-6`}>
          {cards.map((card, i) => (
            <div
              key={i}
              className={`group ${themeCard(theme)} ${themeCardHover(theme)} p-8 border-l-4 border-[#B8946A] transition-all cursor-default`}
              style={{ clipPath: 'polygon(0 0, calc(100% - 30px) 0, 100% 30px, 100% 100%, 0 100%)' }}
            >
              {card.icon && (
                <div
                  className={`mb-6 p-4 inline-block transition-colors ${themeIconTile(theme)}`}
                  style={{ clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)' }}
                >
                  <img src={card.icon} alt="" className="w-8 h-8 object-contain" />
                </div>
              )}
              <h3 className="mb-3" style={{ fontSize: '1.25rem', fontWeight: 600 }}>{card.title}</h3>
              {card.text && <p className="opacity-70 text-sm leading-relaxed">{card.text}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
