import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSanity } from '../../hooks/useSanity'
import { PROJECTS_QUERY, CATEGORIES_QUERY } from '../../lib/queries'
import { themeBg, type Theme } from './themeUtils'
import { img } from '../../lib/image'

interface Props { theme?: Theme; joinTop?: boolean; joinBottom?: boolean }

// How many projects to show initially and per "Load More" click.
const BATCH = 6
// If this many or fewer remain after a load, just show them all rather than
// leaving an awkward tiny final batch behind another click.
const LOAD_ALL_THRESHOLD = 9

export function ProjectsGrid({ theme = 'light', joinTop, joinBottom }: Props) {
  const navigate = useNavigate()
  const { data: projects } = useSanity<any[]>(PROJECTS_QUERY)
  // Only categories that have at least one project are returned by this query
  const { data: categories } = useSanity<any[]>(CATEGORIES_QUERY)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(BATCH)

  const filtered = (activeCategory
    ? projects?.filter(p => p.details?.categorySlug === activeCategory)
    : projects) || []

  // Reset back to the first batch whenever the filter changes, so switching
  // categories always starts from the top.
  useEffect(() => {
    setVisibleCount(BATCH)
  }, [activeCategory])

  const visible = filtered.slice(0, visibleCount)
  const remaining = filtered.length - visibleCount

  const loadMore = () => {
    setVisibleCount((current) => {
      const left = filtered.length - current
      // Final stretch: reveal everything that's left in one go.
      if (left <= LOAD_ALL_THRESHOLD) return filtered.length
      return current + BATCH
    })
  }

  return (
    <>
      {/* Filter — only shows categories that actually have projects */}
      <section className={`${joinTop ? 'pt-8' : 'pt-12'} pb-12 border-b border-[#C8C5BE]/30 bg-white`}>
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-8 py-3 text-sm tracking-wider uppercase transition-all ${!activeCategory ? 'bg-[#111111] text-[#F5F3EF]' : 'bg-[#F5F3EF] text-[#111111] hover:bg-[#C8C5BE]'}`}
              style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}
            >
              All
            </button>
            {categories?.map((cat: any) => (
              <button
                key={cat._id}
                onClick={() => setActiveCategory(cat.slug)}
                className={`px-8 py-3 text-sm tracking-wider uppercase transition-all ${activeCategory === cat.slug ? 'bg-[#111111] text-[#F5F3EF]' : 'bg-[#F5F3EF] text-[#111111] hover:bg-[#C8C5BE]'}`}
                style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}
              >
                {cat.title}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className={`pt-24 lg:pt-32 ${joinBottom ? 'pb-8' : 'pb-24 lg:pb-32'} ${themeBg(theme)}`}>
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {visible.map((project: any) => (
              <div
                key={project._id}
                className="group cursor-pointer"
                onClick={() => navigate(`/projects/${project.slug}`)}
              >
                <div className="on-media relative h-[400px] overflow-hidden" style={{ clipPath: 'polygon(0 0, calc(100% - 45px) 0, 100% 45px, 100% 100%, 0 100%)' }}>
                  {/* Native <img> with lazy loading so off-screen project
                      images aren't fetched until they're scrolled near. The
                      absolutely-positioned img replaces the previous CSS
                      background so the browser can manage loading. */}
                  <img
                    src={img(project.heroImage, { w: 800 })}
                    alt={project.title}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent group-hover:from-black/60 transition-all duration-500" />
                  <div className="absolute top-0 inset-x-0 h-1/3 bg-gradient-to-b from-black/70 to-transparent group-hover:from-black/50 transition-all duration-500 pointer-events-none" />
                  <div className="absolute top-0 left-0 p-4 text-[#F5F3EF]">
                    <div className="text-sm opacity-90">{project.details?.location} • {project.details?.year}</div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-[#F5F3EF]">
                    <div className="text-xs tracking-[0.2em] uppercase mb-2 text-accent">{project.details?.category}</div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.1 }}>{project.title}</h3>
                    <div className="h-1 rule-accent w-12 mt-2 group-hover:w-full transition-all duration-500" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {remaining > 0 && (
            <div className="mt-16 text-center">
              <button
                onClick={loadMore}
                className="btn-primary px-12 py-4 text-sm tracking-wider uppercase transition-all"
                style={{ clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))' }}
              >
                Load more ({remaining} remaining)
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
