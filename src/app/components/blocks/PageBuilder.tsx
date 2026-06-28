import { HeroHome } from './HeroHome'
import { HeroInner } from './HeroInner'
import { FeaturedProjects } from './FeaturedProjects'
import { ProjectsGrid } from './ProjectsGrid'
import { CardGrid } from './CardGrid'
import { TextImage } from './TextImage'
import { StatsRow } from './StatsRow'
import { OurStory } from './OurStory'
import { TestimonialsBlock } from './TestimonialsBlock'
import { CtaBlock } from './CtaBlock'
import { ContactFormBlock } from './ContactFormBlock'
import { RichText } from './RichText'
import { themeBgColor, type Theme } from './themeUtils'

// Resolve a block's effective background colour so the renderer can tell when
// two consecutive blocks share a background and should be visually joined.
// Heroes and the (unrendered) map block never participate.
const DEFAULT_THEME: Record<string, Theme> = {
  featuredProjects: 'dark',
  ctaBlock: 'gray',
  statsRow: 'gray',
}
function bgOf(section?: { _type: string; [k: string]: unknown }): string | null {
  if (!section) return null
  const t = section._type
  if (t === 'heroHome' || t === 'heroInner' || t === 'mapBlock') return null
  return themeBgColor(((section as any).theme as Theme) || DEFAULT_THEME[t] || 'light')
}

interface Section {
  _type: string
  _key: string
  [key: string]: unknown
}

interface Props {
  sections?: Section[]
}

export function PageBuilder({ sections }: Props) {
  if (!sections?.length) return null

  return (
    <>
      {sections.map((section, i) => {
        const key = section._key
        const s = section as any

        // Join a block to its neighbour when both share a background colour.
        const myBg = bgOf(section)
        const joinTop = myBg !== null && bgOf(sections[i - 1]) === myBg
        const joinBottom = myBg !== null && bgOf(sections[i + 1]) === myBg

        switch (section._type) {
          case 'heroHome':
            return (
              <HeroHome
                key={key}
                eyebrow={s.eyebrow}
                heading={s.heading}
                subheading={s.subheading}
                backgroundImage={s.backgroundImage}
                primaryButtonLabel={s.primaryButtonLabel}
                primaryButtonLink={s.primaryButtonLink}
                secondaryButtonLabel={s.secondaryButtonLabel}
                secondaryButtonLink={s.secondaryButtonLink}
              />
            )

          case 'heroInner':
            return (
              <HeroInner
                key={key}
                height={s.height}
                eyebrow={s.eyebrow}
                heading={s.heading}
                subheading={s.subheading}
                backgroundImage={s.backgroundImage}
              />
            )

          case 'featuredProjects':
            return (
              <FeaturedProjects
                key={key}
                theme={s.theme}
                joinTop={joinTop}
                joinBottom={joinBottom}
                eyebrow={s.eyebrow}
                heading={s.heading}
                ctaLabel={s.ctaLabel}
                ctaLink={s.ctaLink}
              />
            )

          case 'projectsGrid':
            return <ProjectsGrid key={key} theme={s.theme} joinTop={joinTop} joinBottom={joinBottom} />

          case 'cardGrid2':
            return <CardGrid key={key} theme={s.theme} eyebrow={s.eyebrow} heading={s.heading} cards={s.cards || []} columns={2} joinTop={joinTop} joinBottom={joinBottom} />
          case 'cardGrid3':
            return <CardGrid key={key} theme={s.theme} eyebrow={s.eyebrow} heading={s.heading} cards={s.cards || []} columns={3} joinTop={joinTop} joinBottom={joinBottom} />
          case 'cardGrid4':
            return <CardGrid key={key} theme={s.theme} eyebrow={s.eyebrow} heading={s.heading} cards={s.cards || []} columns={4} joinTop={joinTop} joinBottom={joinBottom} />

          case 'textImage':
            return (
              <TextImage
                key={key}
                theme={s.theme}
                joinTop={joinTop}
                joinBottom={joinBottom}
                imagePosition={s.imagePosition}
                image={s.image}
                eyebrow={s.eyebrow}
                heading={s.heading}
                text={s.text}
                ctaLabel={s.ctaLabel}
                ctaLink={s.ctaLink}
              />
            )

          case 'textImageStats2':
          case 'textImageStats3':
            return (
              <TextImage
                key={key}
                theme={s.theme}
                joinTop={joinTop}
                joinBottom={joinBottom}
                imagePosition={s.imagePosition}
                image={s.image}
                eyebrow={s.eyebrow}
                heading={s.heading}
                text={s.text}
                stats={s.stats}
                ctaLabel={s.ctaLabel}
                ctaLink={s.ctaLink}
              />
            )

          case 'statsRow':
            return <StatsRow key={key} theme={s.theme} stats={s.stats || []} joinTop={joinTop} joinBottom={joinBottom} />

          case 'ourStory':
            return (
              <OurStory key={key} theme={s.theme} eyebrow={s.eyebrow} heading={s.heading} text={s.text} stats={s.stats} joinTop={joinTop} joinBottom={joinBottom} />
            )

          case 'testimonialsBlock':
            return (
              <TestimonialsBlock key={key} theme={s.theme} eyebrow={s.eyebrow} heading={s.heading} testimonials={s.testimonials} joinTop={joinTop} joinBottom={joinBottom} />
            )

          case 'ctaBlock':
            return (
              <CtaBlock key={key} theme={s.theme} eyebrow={s.eyebrow} heading={s.heading} body={s.body} buttonLabel={s.buttonLabel} buttonLink={s.buttonLink} joinTop={joinTop} joinBottom={joinBottom} />
            )

          case 'contactFormBlock':
            return <ContactFormBlock key={key} theme={s.theme} formHeading={s.formHeading} infoHeading={s.infoHeading} joinTop={joinTop} joinBottom={joinBottom} />

          case 'richTextBlock':
            return <RichText key={key} theme={s.theme} eyebrow={s.eyebrow} heading={s.heading} content={s.content} joinTop={joinTop} joinBottom={joinBottom} />

          case 'mapBlock':
            // Reserved — Google Map embed block not yet implemented on the frontend.
            return null

          default:
            return null
        }
      })}
    </>
  )
}
