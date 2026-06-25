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
      {sections.map((section) => {
        const key = section._key
        const s = section as any

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
                eyebrow={s.eyebrow}
                heading={s.heading}
                ctaLabel={s.ctaLabel}
                ctaLink={s.ctaLink}
              />
            )

          case 'projectsGrid':
            return <ProjectsGrid key={key} theme={s.theme} />

          case 'cardGrid2':
            return <CardGrid key={key} theme={s.theme} eyebrow={s.eyebrow} heading={s.heading} cards={s.cards || []} columns={2} />
          case 'cardGrid3':
            return <CardGrid key={key} theme={s.theme} eyebrow={s.eyebrow} heading={s.heading} cards={s.cards || []} columns={3} />
          case 'cardGrid4':
            return <CardGrid key={key} theme={s.theme} eyebrow={s.eyebrow} heading={s.heading} cards={s.cards || []} columns={4} />

          case 'textImage':
            return (
              <TextImage
                key={key}
                theme={s.theme}
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
            return <StatsRow key={key} theme={s.theme} stats={s.stats || []} />

          case 'ourStory':
            return (
              <OurStory key={key} theme={s.theme} eyebrow={s.eyebrow} heading={s.heading} text={s.text} stats={s.stats} />
            )

          case 'testimonialsBlock':
            return (
              <TestimonialsBlock key={key} theme={s.theme} eyebrow={s.eyebrow} heading={s.heading} testimonials={s.testimonials} />
            )

          case 'ctaBlock':
            return (
              <CtaBlock key={key} theme={s.theme} eyebrow={s.eyebrow} heading={s.heading} body={s.body} buttonLabel={s.buttonLabel} buttonLink={s.buttonLink} />
            )

          case 'contactFormBlock':
            return <ContactFormBlock key={key} theme={s.theme} formHeading={s.formHeading} infoHeading={s.infoHeading} />

          case 'richTextBlock':
            return <RichText key={key} theme={s.theme} eyebrow={s.eyebrow} heading={s.heading} content={s.content} />

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
