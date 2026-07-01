import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { urlFor } from '../lib/sanity'
import { PortableText } from './PortableText'
import { useSanity } from '../hooks/useSanity'
import { FEATURED_PROJECTS_QUERY, PROJECTS_QUERY, CATEGORIES_QUERY, TESTIMONIALS_BY_IDS_QUERY } from '../lib/queries'
import { useState } from 'react'

// ─── Theme helper ─────────────────────────────────────────────────
function themeClasses(theme: string) {
  switch (theme) {
    case 'dark': return 'bg-[#111111] text-[#F5F3EF]'
    case 'gray': return 'bg-[#F5F3EF] text-[#111111]'
    default:     return 'bg-white text-[#111111]'
  }
}

function eyebrowColor(theme: string) {
  return 'text-[#B8946A]'
}

// ─── HERO HOME ────────────────────────────────────────────────────
export function HeroHome({ section }: { section: any }) {
  const navigate = useNavigate()
  return (
    <section className="relative h-screen flex items-center overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${urlFor(section.backgroundImage).width(1920).format('webp').url()})` }}
        initial={{ scale: 1.05 }}
        animate={{ scale: 1 }}
        transition={{ duration: 2.5, ease: 'easeOut' }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
      </motion.div>

      <div className="relative z-10 w-full px-6 lg:px-12">
        <div className="max-w-[1600px] mx-auto">
          <div className="max-w-4xl">
            {section.eyebrow && (
              <div className="mb-6 text-sm tracking-[0.3em] uppercase text-[#B8946A]">{section.eyebrow}</div>
            )}
            <h1 className="mb-8 text-[#F5F3EF]" style={{ fontSize: 'clamp(3.5rem, 10vw, 7rem)', fontWeight: 700, lineHeight: 0.9, letterSpacing: '-0.02em' }}>
              {section.heading}
            </h1>
            {section.subheading && (
              <p className="mb-10 text-xl max-w-2xl text-[#F5F3EF]/90">{section.subheading}</p>
            )}
            <div className="flex flex-wrap gap-4">
              {section.primaryButtonLabel && (
                <button
                  onClick={() => navigate(section.primaryButtonLink || '/contact')}
                  className="bg-[#B8946A] text-[#F5F3EF] px-10 py-4 text-sm tracking-wider uppercase transition-all hover:bg-[#F5F3EF] hover:text-[#111111]"
                  style={{ clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))' }}
                >
                  {section.primaryButtonLabel}
                </button>
              )}
              {section.secondaryButtonLabel && (
                <button
                  onClick={() => navigate(section.secondaryButtonLink || '/projects')}
                  className="border-2 border-[#F5F3EF] text-[#F5F3EF] px-10 py-4 text-sm tracking-wider uppercase transition-all hover:bg-[#F5F3EF] hover:text-[#111111]"
                  style={{ clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))' }}
                >
                  {section.secondaryButtonLabel}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── HERO INNER ───────────────────────────────────────────────────
export function HeroInner({ section }: { section: any }) {
  const heightClass = section.height === 'compact' ? 'min-h-[30vh]' : 'min-h-[40vh]'
  return (
    <section className={`relative ${heightClass} flex items-center justify-center overflow-hidden bg-[#111111] text-[#F5F3EF]`}>
      <motion.div
        className="absolute inset-0 bg-cover bg-center opacity-25"
        style={{ backgroundImage: `url(${urlFor(section.backgroundImage).width(1920).format('webp').url()})` }}
        initial={{ scale: 1.05 }}
        animate={{ scale: 1 }}
        transition={{ duration: 2.5, ease: 'easeOut' }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <div className="absolute top-0 left-0 w-96 h-96 border-l-2 border-t-2 border-[#B8946A]/30"
           style={{ clipPath: 'polygon(0 0, 100% 0, 100% 60px, 60px 60px, 60px 100%, 0 100%)' }} />
      <div className="relative z-10 text-center px-6 py-24">
        {section.eyebrow && (
          <div className="mb-4 text-sm tracking-[0.3em] uppercase text-[#B8946A]">{section.eyebrow}</div>
        )}
        <h1 className="mb-6" style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', fontWeight: 700, lineHeight: 0.95, letterSpacing: '-0.02em' }}>
          {section.heading}
        </h1>
        {section.subheading && (
          <p className="text-xl max-w-3xl mx-auto opacity-90">{section.subheading}</p>
        )}
      </div>
    </section>
  )
}

// ─── FEATURED PROJECTS ────────────────────────────────────────────
export function FeaturedProjects({ section }: { section: any }) {
  const navigate = useNavigate()
  const { data: projects, loading } = useSanity<any[]>(FEATURED_PROJECTS_QUERY)

  if (loading || !projects) return null

  return (
    <section className={`py-24 lg:py-32 ${themeClasses(section.theme)}`}>
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        <div className="flex justify-between items-end mb-16">
          <div>
            {section.eyebrow && (
              <div className={`mb-4 text-sm tracking-[0.3em] uppercase ${eyebrowColor(section.theme)}`}>{section.eyebrow}</div>
            )}
            {section.heading && (
              <h2 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 700, lineHeight: 1 }}>{section.heading}</h2>
            )}
          </div>
          {section.ctaLabel && (
            <button
              onClick={() => navigate(section.ctaLink || '/projects')}
              className="border-2 border-current px-8 py-3 text-sm tracking-wider uppercase transition-all hover:bg-[#B8946A] hover:border-[#B8946A] hover:text-[#F5F3EF]"
              style={{ clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 15px 100%, 0 calc(100% - 15px))' }}
            >
              {section.ctaLabel}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Large first project */}
          <div
            className="relative h-[600px] group cursor-pointer overflow-hidden"
            onClick={() => navigate(`/projects/${projects[0].slug}`)}
            style={{ clipPath: 'polygon(0 0, calc(100% - 60px) 0, 100% 60px, 100% 100%, 0 100%)' }}
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              style={{ backgroundImage: `url(${urlFor(projects[0].heroImage).width(900).format('webp').url()})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            <div className="absolute top-0 left-0 p-6 text-[#F5F3EF]">
              <div className="text-sm opacity-90">{projects[0].details?.location} • {projects[0].details?.year}</div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-10 text-[#F5F3EF]">
              <div className="text-xs tracking-[0.2em] uppercase mb-3 text-[#B8946A]">{projects[0].details?.category}</div>
              <h3 style={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1.1 }}>{projects[0].title}</h3>
              <div className="h-1 bg-[#B8946A] w-16 group-hover:w-full transition-all duration-500 ease-out mt-3" />
            </div>
          </div>

          {/* Smaller right projects */}
          <div className="flex flex-col gap-6">
            {projects.slice(1).map((project: any) => (
              <div
                key={project._id}
                className="relative h-[293px] group cursor-pointer overflow-hidden"
                onClick={() => navigate(`/projects/${project.slug}`)}
                style={{ clipPath: 'polygon(0 0, calc(100% - 45px) 0, 100% 45px, 100% 100%, 0 100%)' }}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  style={{ backgroundImage: `url(${urlFor(project.heroImage).width(700).format('webp').url()})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <div className="absolute top-0 left-0 p-6 text-[#F5F3EF]">
                  <div className="text-sm opacity-90">{project.details?.location} • {project.details?.year}</div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-8 text-[#F5F3EF]">
                  <div className="text-xs tracking-[0.2em] uppercase mb-2 text-[#B8946A]">{project.details?.category}</div>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 700, lineHeight: 1.1 }}>{project.title}</h3>
                  <div className="h-1 bg-[#B8946A] w-12 group-hover:w-full transition-all duration-500 ease-out mt-2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── PROJECTS GRID ────────────────────────────────────────────────
export function ProjectsGrid({ section }: { section: any }) {
  const navigate = useNavigate()
  const { data: projects, loading: projectsLoading } = useSanity<any[]>(PROJECTS_QUERY)
  const { data: categories, loading: categoriesLoading } = useSanity<any[]>(CATEGORIES_QUERY)
  const [activeCategory, setActiveCategory] = useState('all')

  if (projectsLoading || categoriesLoading || !projects || !categories) return null

  const filtered = activeCategory === 'all'
    ? projects
    : projects.filter((p: any) => p.details?.categorySlug === activeCategory)

  return (
    <section className={`${themeClasses(section.theme)}`}>
      {/* Filter */}
      <div className="py-12 border-b border-[#C8C5BE]/30">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-8 py-3 text-sm tracking-wider uppercase transition-all ${
                activeCategory === 'all'
                  ? 'bg-[#111111] text-[#F5F3EF]'
                  : 'bg-[#F5F3EF] text-[#111111] hover:bg-[#C8C5BE]'
              }`}
              style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}
            >
              All
            </button>
            {categories.map((cat: any) => (
              <button
                key={cat._id}
                onClick={() => setActiveCategory(cat.slug)}
                className={`px-8 py-3 text-sm tracking-wider uppercase transition-all ${
                  activeCategory === cat.slug
                    ? 'bg-[#111111] text-[#F5F3EF]'
                    : 'bg-[#F5F3EF] text-[#111111] hover:bg-[#C8C5BE]'
                }`}
                style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}
              >
                {cat.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="py-24 lg:py-32">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((project: any) => (
              <div
                key={project._id}
                className="group cursor-pointer"
                onClick={() => navigate(`/projects/${project.slug}`)}
              >
                <div
                  className="relative h-[400px] overflow-hidden"
                  style={{ clipPath: 'polygon(0 0, calc(100% - 45px) 0, 100% 45px, 100% 100%, 0 100%)' }}
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    style={{ backgroundImage: `url(${urlFor(project.heroImage).width(600).format('webp').url()})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  <div className="absolute top-0 left-0 p-4 text-[#F5F3EF]">
                    <div className="text-sm opacity-90">{project.details?.location} • {project.details?.year}</div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-[#F5F3EF]">
                    <div className="text-xs tracking-[0.2em] uppercase mb-2 text-[#B8946A]">{project.details?.category}</div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.1 }}>{project.title}</h3>
                    <div className="h-1 bg-[#B8946A] w-12 group-hover:w-full transition-all duration-500 ease-out mt-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── CARD GRID ────────────────────────────────────────────────────
function CardGrid({ section, cols }: { section: any; cols: number }) {
  const gridClass = cols === 2 ? 'md:grid-cols-2' : cols === 3 ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-4'

  return (
    <section className={`py-24 lg:py-32 ${themeClasses(section.theme)}`}>
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        {(section.eyebrow || section.heading) && (
          <div className="text-center mb-16">
            {section.eyebrow && (
              <div className={`mb-4 text-sm tracking-[0.3em] uppercase ${eyebrowColor(section.theme)}`}>{section.eyebrow}</div>
            )}
            {section.heading && (
              <h2 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 700, lineHeight: 1 }}>{section.heading}</h2>
            )}
          </div>
        )}
        <div className={`grid grid-cols-1 ${gridClass} gap-6`}>
          {section.cards?.map((card: any, i: number) => (
            <div
              key={i}
              className={`group p-8 transition-all hover:shadow-lg border-l-4 border-[#B8946A] ${
                section.theme === 'dark' ? 'bg-[#1a1a1a] hover:bg-[#222]' : 'bg-white hover:bg-[#111111] hover:text-[#F5F3EF]'
              }`}
              style={{ clipPath: 'polygon(0 0, calc(100% - 30px) 0, 100% 30px, 100% 100%, 0 100%)' }}
            >
              {card.icon && (
                <div className="mb-6">
                  <img
                    src={urlFor(card.icon).width(64).format('webp').url()}
                    alt={card.title}
                    className="w-12 h-12 object-contain"
                  />
                </div>
              )}
              {card.title && (
                <h3 className="mb-3" style={{ fontSize: '1.25rem', fontWeight: 600 }}>{card.title}</h3>
              )}
              {card.text && (
                <p className="opacity-70 text-sm leading-relaxed">{card.text}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function CardGrid2({ section }: { section: any }) { return <CardGrid section={section} cols={2} /> }
export function CardGrid3({ section }: { section: any }) { return <CardGrid section={section} cols={3} /> }
export function CardGrid4({ section }: { section: any }) { return <CardGrid section={section} cols={4} /> }

// ─── TEXT + IMAGE (base) ──────────────────────────────────────────
function TextImageBase({ section, stats }: { section: any; stats?: any[] }) {
  const navigate = useNavigate()
  const imageLeft = section.imagePosition === 'left'

  const imageEl = (
    <div
      className="relative h-[500px] lg:h-[700px] overflow-hidden"
      style={{ clipPath: imageLeft
        ? 'polygon(0 0, 100% 0, 100% 100%, 60px 100%, 0 calc(100% - 60px))'
        : 'polygon(0 0, 100% 0, 100% calc(100% - 60px), calc(100% - 60px) 100%, 0 100%)' }}
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${urlFor(section.image).width(900).format('webp').url()})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-transparent" />
      </div>
    </div>
  )

  const contentEl = (
    <div>
      {section.eyebrow && (
        <div className="mb-4 text-sm tracking-[0.3em] uppercase text-[#B8946A]">{section.eyebrow}</div>
      )}
      {section.heading && (
        <h2 className="mb-8" style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em' }}>
          {section.heading}
        </h2>
      )}
      {section.text && (
        <div className="space-y-4">
          <PortableText value={section.text} />
        </div>
      )}

      {stats && stats.length > 0 && (
        <div className={`mt-12 grid grid-cols-${stats.length} gap-6`}>
          {stats.map((stat: any, i: number) => (
            <div
              key={i}
              className="bg-[#F5F3EF] p-8 border-l-4 border-[#B8946A]"
              style={{ clipPath: 'polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 0 100%)' }}
            >
              <div className="text-4xl mb-2" style={{ fontWeight: 700 }}>{stat.value}</div>
              <div className="text-sm tracking-wider uppercase">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {section.ctaLabel && (
        <button
          onClick={() => navigate(section.ctaLink || '/')}
          className="mt-10 bg-[#111111] text-[#F5F3EF] px-10 py-4 text-sm tracking-wider uppercase transition-all hover:bg-[#B8946A] inline-flex items-center gap-3"
          style={{ clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 15px 100%, 0 calc(100% - 15px))' }}
        >
          {section.ctaLabel}
          <ArrowRight size={18} />
        </button>
      )}
    </div>
  )

  return (
    <section className={`py-24 lg:py-32 ${themeClasses(section.theme)}`}>
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {imageLeft ? <>{imageEl}{contentEl}</> : <>{contentEl}{imageEl}</>}
        </div>
      </div>
    </section>
  )
}

export function TextImage({ section }: { section: any }) {
  return <TextImageBase section={section} />
}

export function TextImageStats2({ section }: { section: any }) {
  return <TextImageBase section={section} stats={section.stats} />
}

export function TextImageStats3({ section }: { section: any }) {
  return <TextImageBase section={section} stats={section.stats} />
}

// ─── STATS ROW ────────────────────────────────────────────────────
export function StatsRow({ section }: { section: any }) {
  return (
    <section className={`py-16 ${themeClasses(section.theme)}`}>
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        <div className={`grid grid-cols-2 lg:grid-cols-${section.stats?.length || 4} gap-6`}>
          {section.stats?.map((stat: any, i: number) => (
            <div
              key={i}
              className="p-8 border-l-4 border-[#B8946A] bg-[#F5F3EF] text-[#111111]"
              style={{ clipPath: 'polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 0 100%)' }}
            >
              <div className="text-4xl mb-2" style={{ fontWeight: 700 }}>{stat.value}</div>
              <div className="text-sm tracking-wider uppercase opacity-70">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── OUR STORY ────────────────────────────────────────────────────
export function OurStory({ section }: { section: any }) {
  return (
    <section className={`py-24 lg:py-32 ${themeClasses(section.theme)}`}>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            {section.eyebrow && (
              <div className="mb-4 text-sm tracking-[0.3em] uppercase text-[#B8946A]">{section.eyebrow}</div>
            )}
            {section.heading && (
              <h2 className="mb-8" style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 700, lineHeight: 1.1 }}>
                {section.heading}
              </h2>
            )}
            {section.text && <PortableText value={section.text} />}
          </div>

          {section.stats && section.stats.length > 0 && (
            <div className="grid grid-cols-2 gap-6">
              {section.stats.map((stat: any, i: number) => (
                <div
                  key={i}
                  className="bg-[#F5F3EF] p-10 border-l-4 border-[#B8946A] text-[#111111]"
                  style={{ clipPath: 'polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 0 100%)' }}
                >
                  <div className="text-5xl mb-3" style={{ fontWeight: 700 }}>{stat.value}</div>
                  <div className="text-sm tracking-wider uppercase">{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

// ─── TESTIMONIALS ─────────────────────────────────────────────────
export function TestimonialsBlock({ section }: { section: any }) {
  const ids = section.testimonials?.map((t: any) => t._ref) || []
  const { data: testimonials, loading } = useSanity<any[]>(
    TESTIMONIALS_BY_IDS_QUERY,
    { ids }
  )

  if (loading || !testimonials || testimonials.length === 0) return null

  return (
    <section className={`py-24 lg:py-32 ${themeClasses(section.theme)}`}>
      <div className="max-w-4xl mx-auto px-6 lg:px-12">
        {(section.eyebrow || section.heading) && (
          <div className="text-center mb-16">
            {section.eyebrow && (
              <div className={`mb-4 text-sm tracking-[0.3em] uppercase ${eyebrowColor(section.theme)}`}>{section.eyebrow}</div>
            )}
            {section.heading && (
              <h2 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 700, lineHeight: 1 }}>{section.heading}</h2>
            )}
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {testimonials.map((t: any) => (
            <div
              key={t._id}
              className="bg-[#F5F3EF] text-[#111111] p-10 border-l-4 border-[#B8946A]"
              style={{ clipPath: 'polygon(0 0, calc(100% - 36px) 0, 100% 36px, 100% 100%, 0 100%)' }}
            >
              <div className="text-5xl mb-6 text-[#B8946A] opacity-20">"</div>
              <p className="text-lg mb-8 leading-relaxed">{t.quote}</p>
              <div className="pl-4">
                <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>{t.clientName}</div>
                {t.projectReference && (
                  <div className="text-sm opacity-70 mt-1">{t.projectReference}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── CTA BLOCK ────────────────────────────────────────────────────
export function CTABlock({ section }: { section: any }) {
  const navigate = useNavigate()
  return (
    <section className={`py-32 lg:py-40 ${themeClasses(section.theme)}`}>
      <div className="max-w-[1200px] mx-auto px-6 lg:px-12 text-center">
        {section.eyebrow && (
          <div className={`mb-4 text-sm tracking-[0.3em] uppercase ${eyebrowColor(section.theme)}`}>{section.eyebrow}</div>
        )}
        {section.heading && (
          <h2 className="mb-8" style={{ fontSize: 'clamp(3rem, 8vw, 5rem)', fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em' }}>
            {section.heading}
          </h2>
        )}
        {section.body && (
          <p className="text-xl mb-12 max-w-2xl mx-auto opacity-70">{section.body}</p>
        )}
        {section.buttonLabel && (
          <button
            onClick={() => navigate(section.buttonLink || '/contact')}
            className="bg-[#111111] text-[#F5F3EF] px-12 py-5 text-sm tracking-wider uppercase transition-all hover:bg-[#B8946A]"
            style={{ clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 15px 100%, 0 calc(100% - 15px))' }}
          >
            {section.buttonLabel}
          </button>
        )}
      </div>
    </section>
  )
}

// ─── CONTACT FORM ─────────────────────────────────────────────────
export function ContactFormBlock({ section, siteSettings }: { section: any; siteSettings: any }) {
  const { data: categories } = useSanity<any[]>(CATEGORIES_QUERY)
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', projectType: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setStatus('success')
        setForm({ firstName: '', lastName: '', email: '', phone: '', projectType: '', message: '' })
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  const inputClass = "w-full bg-[#F5F3EF] border border-[#C8C5BE] px-4 py-4 focus:outline-none focus:border-[#B8946A]"
  const inputStyle = { clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)' }

  return (
    <section className={`py-24 lg:py-32 ${themeClasses(section.theme)}`}>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-16">
          {/* Form */}
          <div className="lg:col-span-3">
            {section.formHeading && (
              <h2 className="mb-8" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700 }}>{section.formHeading}</h2>
            )}
            {status === 'success' ? (
              <div className="bg-[#F5F3EF] p-8 border-l-4 border-[#B8946A]"
                   style={{ clipPath: 'polygon(0 0, calc(100% - 30px) 0, 100% 30px, 100% 100%, 0 100%)' }}>
                <h3 className="text-xl font-bold mb-2">Message sent!</h3>
                <p className="opacity-70">Thank you for reaching out. We'll be in touch shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block mb-2 text-sm tracking-wider uppercase">First Name</label>
                    <input type="text" required className={inputClass} style={inputStyle}
                      value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm tracking-wider uppercase">Last Name</label>
                    <input type="text" required className={inputClass} style={inputStyle}
                      value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="block mb-2 text-sm tracking-wider uppercase">Email</label>
                  <input type="email" required className={inputClass} style={inputStyle}
                    value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label className="block mb-2 text-sm tracking-wider uppercase">Phone</label>
                  <input type="tel" className={inputClass} style={inputStyle}
                    value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div>
                  <label className="block mb-2 text-sm tracking-wider uppercase">Project Type</label>
                  <select className={inputClass} style={inputStyle}
                    value={form.projectType} onChange={e => setForm(f => ({ ...f, projectType: e.target.value }))}>
                    <option value="">Select a type</option>
                    {categories?.map((cat: any) => (
                      <option key={cat._id} value={cat.title}>{cat.title}</option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-2 text-sm tracking-wider uppercase">Message</label>
                  <textarea rows={6} required className={`${inputClass} resize-none`} style={inputStyle}
                    value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
                </div>
                {status === 'error' && (
                  <p className="text-red-600 text-sm">Something went wrong. Please try again or email us directly.</p>
                )}
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="bg-[#111111] text-[#F5F3EF] px-12 py-4 text-sm tracking-wider uppercase transition-all hover:bg-[#B8946A] disabled:opacity-50"
                  style={{ clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))' }}
                >
                  {status === 'sending' ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>

          {/* Contact Info */}
          <div className="lg:col-span-2">
            {section.infoHeading && (
              <h2 className="mb-8" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700 }}>{section.infoHeading}</h2>
            )}
            <div className="space-y-6">
              {siteSettings?.address && (
                <InfoCard icon="📍" label="Address" value={siteSettings.address} />
              )}
              {siteSettings?.phone && (
                <InfoCard icon="📞" label="Phone" value={siteSettings.phone} />
              )}
              {siteSettings?.email && (
                <InfoCard icon="✉️" label="Email" value={siteSettings.email} />
              )}
              {siteSettings?.workingHours && (
                <InfoCard icon="🕐" label="Hours" value={siteSettings.workingHours} />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function InfoCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div
      className="bg-[#F5F3EF] p-6 border-l-4 border-[#B8946A]"
      style={{ clipPath: 'polygon(0 0, calc(100% - 30px) 0, 100% 30px, 100% 100%, 0 100%)' }}
    >
      <div className="flex items-start gap-4">
        <div className="p-3 bg-white text-lg"
             style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)' }}>
          {icon}
        </div>
        <div>
          <h3 className="mb-1" style={{ fontSize: '1.125rem', fontWeight: 600 }}>{label}</h3>
          <p className="opacity-70 whitespace-pre-line">{value}</p>
        </div>
      </div>
    </div>
  )
}

// ─── MAP BLOCK ────────────────────────────────────────────────────
export function MapBlock({ section, siteSettings }: { section: any; siteSettings: any }) {
  const heightMap: Record<string, string> = {
    small: '300px',
    medium: '500px',
    large: '700px',
  }
  const height = heightMap[section.height] || '500px'

  if (!siteSettings?.googleMapsEmbedUrl) {
    return (
      <section style={{ height }} className="bg-[#C8C5BE] flex items-center justify-center">
        <p className="opacity-50 text-sm">Add a Google Maps Embed URL in Site Settings</p>
      </section>
    )
  }

  return (
    <section style={{ height }}>
      <iframe
        src={siteSettings.googleMapsEmbedUrl}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Location map"
      />
    </section>
  )
}
