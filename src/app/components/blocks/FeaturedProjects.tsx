import { useNavigate } from 'react-router-dom'
import { useSanity } from '../../hooks/useSanity'
import { FEATURED_PROJECTS_QUERY } from '../../lib/queries'
import { themeBg, type Theme } from './themeUtils'
import { img } from '../../lib/image'

interface Props {
  theme?: Theme
  eyebrow?: string
  heading?: string
  ctaLabel?: string
  ctaLink?: string
}

export function FeaturedProjects({ theme = 'dark', eyebrow, heading, ctaLabel, ctaLink }: Props) {
  const navigate = useNavigate()
  const { data: projects, loading } = useSanity<any[]>(FEATURED_PROJECTS_QUERY)

  if (loading || !projects?.length) return null

  const [first, ...rest] = projects

  // Outline button adapts: on dark theme it's light-bordered; on light/gray it's dark-bordered
  const outlineBtn =
    theme === 'dark'
      ? 'border-2 border-[#F5F3EF] text-[#F5F3EF] hover:bg-[#B8946A] hover:border-[#B8946A]'
      : 'border-2 border-[#111111] text-[#111111] hover:bg-[#B8946A] hover:border-[#B8946A] hover:text-[#F5F3EF]'

  return (
    <section className={`py-24 lg:py-32 ${themeBg(theme)}`}>
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        <div className="flex justify-between items-end mb-16">
          <div>
            {eyebrow && (
              <div className="mb-4 text-sm tracking-[0.3em] uppercase text-[#B8946A]">{eyebrow}</div>
            )}
            {heading && (
              <h2 className="uppercase" style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 700, lineHeight: 1 }}>
                {heading}
              </h2>
            )}
          </div>
          {ctaLabel && (
            <button
              onClick={() => ctaLink && navigate(ctaLink)}
              className={`px-8 py-3 text-sm tracking-wider uppercase transition-all ${outlineBtn}`}
              style={{ clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 15px 100%, 0 calc(100% - 15px))' }}
            >
              {ctaLabel}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div
            className="relative h-[600px] group cursor-pointer overflow-hidden"
            onClick={() => navigate(`/projects/${first.slug}`)}
            style={{ clipPath: 'polygon(0 0, calc(100% - 60px) 0, 100% 60px, 100% 100%, 0 100%)' }}
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              style={{ backgroundImage: `url(${img(first.heroImage, { w: 1400 })})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent group-hover:from-black/60 transition-all duration-500" />
            <div className="absolute top-0 left-0 p-6 text-[#F5F3EF] z-10">
              <div className="text-sm opacity-90">{first.details?.location} • {first.details?.year}</div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-10 text-[#F5F3EF] z-10">
              <div className="text-xs tracking-[0.2em] uppercase mb-3 text-[#B8946A]">{first.details?.category}</div>
              <h3 style={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1.1 }}>{first.title}</h3>
              <div className="h-1 bg-[#B8946A] w-16 mt-3 group-hover:w-full transition-all duration-500 ease-out" />
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {rest.map((project: any) => (
              <div
                key={project._id}
                className="relative h-[293px] group cursor-pointer overflow-hidden"
                onClick={() => navigate(`/projects/${project.slug}`)}
                style={{ clipPath: 'polygon(0 0, calc(100% - 45px) 0, 100% 45px, 100% 100%, 0 100%)' }}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  style={{ backgroundImage: `url(${img(project.heroImage, { w: 1000 })})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent group-hover:from-black/60 transition-all duration-500" />
                <div className="absolute top-0 left-0 p-6 text-[#F5F3EF] z-10">
                  <div className="text-sm opacity-90">{project.details?.location} • {project.details?.year}</div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-8 text-[#F5F3EF] z-10">
                  <div className="text-xs tracking-[0.2em] uppercase mb-2 text-[#B8946A]">{project.details?.category}</div>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 700, lineHeight: 1.1 }}>{project.title}</h3>
                  <div className="h-1 bg-[#B8946A] w-12 mt-2 group-hover:w-full transition-all duration-500 ease-out" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
