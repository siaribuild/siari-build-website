import { useNavigate } from 'react-router'
import { SmartLink } from '../SmartLink'
import type { SanityLink } from '../../lib/links'
import { themeBg, sectionPad, type Theme } from './themeUtils'
import { renderMultiline } from './renderMultiline'
import { CdnImage } from '../CdnImage'

interface Props {
  theme?: Theme
  joinTop?: boolean
  joinBottom?: boolean
  eyebrow?: string
  heading?: string
  ctaLabel?: string
  ctaLink?: SanityLink | null
  /** Baked at build time by the route loader; falls back to a client fetch if absent. */
  projects?: any[]
}

export function FeaturedProjects({ theme = 'dark', eyebrow, heading, ctaLabel, ctaLink, joinTop, joinBottom, projects }: Props) {
  const navigate = useNavigate()

  if (!projects?.length) return null

  const [first, ...rest] = projects

  // Outline button adapts to the section theme via CSS vars (.btn-outline):
  // dark → cream border, light/gray → dark border; both fill bronze on hover.
  const outlineBtn = 'btn-outline'

  return (
    <section className={`${sectionPad(joinTop, joinBottom)} ${themeBg(theme)}`}>
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        <div className="flex justify-between items-end mb-16">
          <div>
            {eyebrow && (
              <div className="mb-4 text-sm tracking-[0.3em] uppercase text-accent">{eyebrow}</div>
            )}
            {heading && (
              <h2 className="uppercase" style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 700, lineHeight: 1 }}>
                {renderMultiline(heading)}
              </h2>
            )}
          </div>
          {ctaLabel && (
            <SmartLink
              link={ctaLink}
              className={`inline-block px-8 py-3 text-sm tracking-wider uppercase transition-all ${outlineBtn}`}
              style={{ clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 15px 100%, 0 calc(100% - 15px))' }}
            >
              {ctaLabel}
            </SmartLink>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div
            className="on-media relative h-[600px] group cursor-pointer overflow-hidden"
            onClick={() => navigate(`/projects/${first.slug}`)}
            style={{ clipPath: 'polygon(0 0, calc(100% - 60px) 0, 100% 60px, 100% 100%, 0 100%)' }}
          >
            <CdnImage src={first.heroImage} alt={first.title}
              className="transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              fill sizes="(max-width: 1024px) 100vw, 50vw" widths={[640, 768, 1024, 1400]} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent group-hover:from-black/60 transition-all duration-500" />
            <div className="absolute top-0 inset-x-0 h-1/3 bg-gradient-to-b from-black/70 to-transparent group-hover:from-black/50 transition-all duration-500 pointer-events-none" />
            <div className="absolute top-0 left-0 p-6 text-[#F5F3EF] z-10">
              <div className="text-sm opacity-90">{first.details?.location} • {first.details?.year}</div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-10 text-[#F5F3EF] z-10">
              <div className="text-xs tracking-[0.2em] uppercase mb-3 text-accent">{first.details?.category}</div>
              <h3 style={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1.1 }}>{first.title}</h3>
              <div className="h-1 rule-accent w-16 mt-3 group-hover:w-full transition-all duration-500 ease-out" />
            </div>
          </div>

          <div className="flex flex-col gap-6 md:flex-row lg:flex-col">
            {rest.map((project: any) => (
              <div
                key={project._id}
                className="on-media relative h-[293px] md:flex-1 md:min-w-0 lg:flex-none group cursor-pointer overflow-hidden"
                onClick={() => navigate(`/projects/${project.slug}`)}
                style={{ clipPath: 'polygon(0 0, calc(100% - 45px) 0, 100% 45px, 100% 100%, 0 100%)' }}
              >
                <CdnImage src={project.heroImage} alt={project.title}
                  className="transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  fill sizes="(max-width: 767px) 100vw, 50vw" widths={[480, 640, 768, 1000]} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent group-hover:from-black/60 transition-all duration-500" />
                <div className="absolute top-0 inset-x-0 h-1/3 bg-gradient-to-b from-black/70 to-transparent group-hover:from-black/50 transition-all duration-500 pointer-events-none" />
                <div className="absolute top-0 left-0 p-6 text-[#F5F3EF] z-10">
                  <div className="text-sm opacity-90">{project.details?.location} • {project.details?.year}</div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-8 text-[#F5F3EF] z-10">
                  <div className="text-xs tracking-[0.2em] uppercase mb-2 text-accent">{project.details?.category}</div>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 700, lineHeight: 1.1 }}>{project.title}</h3>
                  <div className="h-1 rule-accent w-12 mt-2 group-hover:w-full transition-all duration-500 ease-out" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
