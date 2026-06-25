import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSanity } from '../../hooks/useSanity'
import { PROJECTS_QUERY, CATEGORIES_QUERY } from '../../lib/queries'
import { themeBg, type Theme } from './themeUtils'

interface Props { theme?: Theme }

export function ProjectsGrid({ theme = 'light' }: Props) {
  const navigate = useNavigate()
  const { data: projects } = useSanity<any[]>(PROJECTS_QUERY)
  // Only categories that have at least one project are returned by this query
  const { data: categories } = useSanity<any[]>(CATEGORIES_QUERY)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const filtered = activeCategory
    ? projects?.filter(p => p.details?.categorySlug === activeCategory)
    : projects

  return (
    <>
      {/* Filter — only shows categories that actually have projects */}
      <section className={`py-12 border-b border-[#C8C5BE]/30 ${themeBg(theme)}`}>
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
      <section className={`py-24 lg:py-32 ${themeBg(theme)}`}>
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered?.map((project: any) => (
              <div
                key={project._id}
                className="group cursor-pointer"
                onClick={() => navigate(`/projects/${project.slug}`)}
              >
                <div className="relative h-[400px] overflow-hidden" style={{ clipPath: 'polygon(0 0, calc(100% - 45px) 0, 100% 45px, 100% 100%, 0 100%)' }}>
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-[1.03]"
                    style={{ backgroundImage: `url(${project.heroImage})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent group-hover:from-black/60 transition-all duration-500" />
                  <div className="absolute top-0 left-0 p-4 text-[#F5F3EF]">
                    <div className="text-sm opacity-90">{project.details?.location} • {project.details?.year}</div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-[#F5F3EF]">
                    <div className="text-xs tracking-[0.2em] uppercase mb-2 text-[#B8946A]">{project.details?.category}</div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.1 }}>{project.title}</h3>
                    <div className="h-1 bg-[#B8946A] w-12 mt-2 group-hover:w-full transition-all duration-500" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
