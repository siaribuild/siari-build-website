import { useId, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { themeBg, sectionPad, type Theme } from './themeUtils'

interface FaqItem {
  question: string
  answer: string
}

interface Props {
  theme?: Theme
  joinTop?: boolean
  joinBottom?: boolean
  /** Group label shown beside the questions, e.g. "Getting Started". */
  title?: string
  items: FaqItem[]
}

// One FAQ group: accent label on the left, accordion of question/answer rows
// on the right. Multiple blocks stack to form a full FAQ page — consecutive
// same-background blocks are joined by the PageBuilder.
export function FaqBlock({ theme = 'light', title, items, joinTop, joinBottom }: Props) {
  const baseId = useId()
  const [open, setOpen] = useState<Set<number>>(new Set())

  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })

  if (!items.length) return null

  return (
    <section className={`${sectionPad(joinTop, joinBottom)} ${themeBg(theme)}`}>
      <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 lg:gap-16">
          {/* Group label */}
          <div className="lg:pt-7">
            {title && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-px rule-accent" />
                <span className="text-xs tracking-[0.25em] uppercase text-accent">{title}</span>
              </div>
            )}
          </div>

          {/* Accordion */}
          <div>
            {items.map((item, i) => {
              const isOpen = open.has(i)
              const panelId = `${baseId}-faq-${i}`
              return (
                <div key={i} className="border-b faq-divider last:border-b-0">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => toggle(i)}
                    className="w-full flex items-start justify-between gap-6 py-7 text-left group"
                  >
                    <span className="text-base lg:text-lg font-medium leading-snug transition-colors duration-200 group-hover-accent">
                      {item.question}
                    </span>
                    <span aria-hidden="true" className="mt-1 flex-shrink-0 w-6 h-6 flex items-center justify-center faq-toggle">
                      {isOpen ? <Minus size={14} strokeWidth={1.5} /> : <Plus size={14} strokeWidth={1.5} />}
                    </span>
                  </button>
                  <div
                    id={panelId}
                    className="grid overflow-hidden transition-all duration-300 ease-out"
                    style={{ gridTemplateRows: isOpen ? '1fr' : '0fr', opacity: isOpen ? 1 : 0 }}
                  >
                    <div className="min-h-0">
                      <p className="pb-7 text-base leading-relaxed opacity-70 max-w-3xl whitespace-pre-line">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
