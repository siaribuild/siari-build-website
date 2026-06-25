import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, MapPin, Calendar, Ruler, User, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { motion } from 'motion/react'
import { useState, useEffect } from 'react'
import { PortableText } from '@portabletext/react'
import { useSanity } from '../hooks/useSanity'
import { PROJECT_QUERY, OTHER_PROJECTS_QUERY } from '../lib/queries'
import { Seo } from '../components/Seo'
import { NotFoundPage } from './NotFoundPage'

export function ProjectDetailPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [lightboxImage, setLightboxImage] = useState<number | null>(null)

  const { data: project, loading } = useSanity<any>(PROJECT_QUERY, { slug: projectId })
  const { data: otherProjects } = useSanity<any[]>(OTHER_PROJECTS_QUERY, { slug: projectId })

  const itemsPerPage = 3
  const maxIndex = Math.max(0, Math.ceil((otherProjects?.length || 0) / itemsPerPage) - 1)
  const visibleProjects = otherProjects?.slice(carouselIndex * itemsPerPage, (carouselIndex + 1) * itemsPerPage) || []

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxImage === null) return
      if (e.key === 'ArrowRight') setLightboxImage(i => i !== null ? (i + 1) % (project?.gallery?.length || 1) : null)
      if (e.key === 'ArrowLeft') setLightboxImage(i => i !== null ? (i - 1 + (project?.gallery?.length || 1)) % (project?.gallery?.length || 1) : null)
      if (e.key === 'Escape') setLightboxImage(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxImage, project])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#B8946A] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!project) {
    return <NotFoundPage />
  }

  return (
    <>
      <Seo
        seo={project.seo}
        fallbackTitle={project.title}
        fallbackDescription={project.details?.location ? `${project.title} — ${project.details.location}` : project.title}
        fallbackImage={project.heroImage}
        path={`/projects/${project.slug}`}
      />
      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-end overflow-hidden bg-[#111111]">
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${project.heroImage})` }}
          initial={{ scale: 1.05 }} animate={{ scale: 1 }} transition={{ duration: 2.5, ease: 'easeOut' }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/60" />
        </motion.div>
        <div className="absolute top-0 left-0 w-96 h-96 border-l-2 border-t-2 border-[#B8946A]/30" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 60px, 60px 60px, 60px 100%, 0 100%)' }} />
        <div className="relative z-10 w-full px-6 lg:px-12 py-24">
          <div className="max-w-[1400px] mx-auto">
            <div className="mb-4 text-sm tracking-[0.3em] uppercase text-[#B8946A]">{project.details?.category}</div>
            <h1 className="mb-6 text-[#F5F3EF]" style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', fontWeight: 700, lineHeight: 0.95 }}>{project.title}</h1>
            <div className="flex flex-wrap gap-6 text-[#F5F3EF]/80">
              {project.details?.location && <div className="flex items-center gap-2"><MapPin size={18} /><span>{project.details.location}</span></div>}
              {project.details?.year && <div className="flex items-center gap-2"><Calendar size={18} /><span>{project.details.year}</span></div>}
            </div>
          </div>
        </div>
      </section>

      {/* Details */}
      <section className="pt-8 pb-24 lg:pb-32 bg-white">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="mb-12">
            <Link to="/projects" className="inline-flex items-center gap-2 text-[#111111] hover:text-[#B8946A] transition-colors">
              <ArrowLeft size={20} />
              <span className="text-sm tracking-wider uppercase">Back to Projects</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            {/* Description */}
            <div className="lg:col-span-2">
              {project.description && (
                <div className="prose prose-lg max-w-none opacity-80">
                  <PortableText
                    value={project.description}
                    components={{
                      block: {
                        h2: ({children}) => <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem', marginTop: '2rem', opacity: 1, color: '#111111' }}>{children}</h2>,
                        h3: ({children}) => <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem', marginTop: '1.5rem', opacity: 1, color: '#111111' }}>{children}</h3>,
                        normal: ({children}) => <p style={{ marginBottom: '1rem', lineHeight: 1.8 }}>{children}</p>,
                      },
                      list: {
                        bullet: ({children}) => (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                            {children}
                          </div>
                        ),
                      },
                      listItem: {
                        bullet: ({children}) => (
                          <div className="flex items-start gap-3 bg-[#F5F3EF] p-4 border-l-4 border-[#B8946A]" style={{ clipPath: 'polygon(0 0, calc(100% - 30px) 0, 100% 30px, 100% 100%, 0 100%)' }}>
                            <div className="w-2 h-2 bg-[#B8946A] mt-2 flex-shrink-0" />
                            <span className="opacity-80">{children}</span>
                          </div>
                        ),
                      },
                    }}
                  />
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-[#F5F3EF] p-8 border-l-4 border-[#B8946A]" style={{ clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%)' }}>
                <h3 className="mb-6 text-sm tracking-[0.2em] uppercase text-[#B8946A]">Project Details</h3>
                <div className="space-y-4">
                  {project.details?.client && <Detail icon={<User size={16} />} label="Client" value={project.details.client} />}
                  {project.details?.duration && <Detail icon={<Calendar size={16} />} label="Duration" value={project.details.duration} />}
                  {project.details?.size && <Detail icon={<Ruler size={16} />} label="Size" value={project.details.size} />}
                </div>
              </div>

              <div className="bg-[#111111] text-[#F5F3EF] p-8 border-l-4 border-[#B8946A]" style={{ clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%)' }}>
                <h3 className="mb-4" style={{ fontSize: '1.25rem', fontWeight: 700 }}>Interested in a similar project?</h3>
                <p className="mb-6 opacity-80">Let's discuss how we can bring your vision to life.</p>
                <Link to="/contact" className="inline-block bg-[#B8946A] text-[#F5F3EF] px-8 py-3 text-sm tracking-wider uppercase transition-all hover:bg-[#F5F3EF] hover:text-[#111111]" style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}>
                  Get In Touch
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery */}
      {project.gallery?.length > 0 && (
        <section className="py-24 lg:py-32 bg-[#F5F3EF]">
          <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
            <h2 className="mb-12 text-center" style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 700 }}>Project Gallery</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {project.gallery.map((img: any, i: number) => (
                <div
                  key={i}
                  className="relative h-[400px] bg-cover bg-center cursor-pointer group"
                  onClick={() => setLightboxImage(i)}
                  style={{ backgroundImage: `url(${img.url})`, clipPath: 'polygon(0 0, calc(100% - 45px) 0, 100% 45px, 100% 100%, 0 100%)' }}
                >
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* More Projects */}
      {visibleProjects.length > 0 && (
        <section className="py-24 lg:py-32 bg-[#F5F3EF]">
          <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
            <div className="flex justify-between items-center mb-12">
              <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700 }}>MORE PROJECTS</h2>
              <div className="flex gap-4">
                <button onClick={() => setCarouselIndex(i => i <= 0 ? maxIndex : i - 1)} className="p-3 bg-[#111111] text-[#F5F3EF] hover:bg-[#B8946A] transition-colors" style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)' }}><ChevronLeft size={24} /></button>
                <button onClick={() => setCarouselIndex(i => i >= maxIndex ? 0 : i + 1)} className="p-3 bg-[#111111] text-[#F5F3EF] hover:bg-[#B8946A] transition-colors" style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)' }}><ChevronRight size={24} /></button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleProjects.map((p: any) => (
                <div key={p._id} className="group cursor-pointer" onClick={() => navigate(`/projects/${p.slug}`)}>
                  <div className="relative h-[350px] overflow-hidden" style={{ clipPath: 'polygon(0 0, calc(100% - 45px) 0, 100% 45px, 100% 100%, 0 100%)' }}>
                    <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-[1.03]" style={{ backgroundImage: `url(${p.heroImage})` }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                    <div className="absolute top-0 left-0 p-4 text-[#F5F3EF] text-sm opacity-90">{p.details?.location} • {p.details?.year}</div>
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-[#F5F3EF]">
                      <div className="text-xs tracking-[0.2em] uppercase mb-2 text-[#B8946A]">{p.details?.category}</div>
                      <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{p.title}</h3>
                      <div className="h-1 bg-[#B8946A] w-12 mt-2 group-hover:w-full transition-all duration-500" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-12">
              <Link to="/projects" className="inline-block bg-[#111111] text-[#F5F3EF] px-12 py-4 text-sm tracking-wider uppercase transition-all hover:bg-[#B8946A]" style={{ clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))' }}>Back to Portfolio</Link>
            </div>
          </div>
        </section>
      )}

      {/* Lightbox */}
      {lightboxImage !== null && project.gallery && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onClick={() => setLightboxImage(null)}>
          <button className="absolute top-6 right-6 text-white hover:text-[#B8946A] z-10" onClick={() => setLightboxImage(null)}><X size={32} /></button>
          <button className="absolute left-6 top-1/2 -translate-y-1/2 text-white hover:text-[#B8946A] z-10 p-3 bg-black/50" style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)' }} onClick={(e) => { e.stopPropagation(); setLightboxImage(i => i !== null ? (i - 1 + project.gallery.length) % project.gallery.length : null) }}><ChevronLeft size={32} /></button>
          <button className="absolute right-6 top-1/2 -translate-y-1/2 text-white hover:text-[#B8946A] z-10 p-3 bg-black/50" style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)' }} onClick={(e) => { e.stopPropagation(); setLightboxImage(i => i !== null ? (i + 1) % project.gallery.length : null) }}><ChevronRight size={32} /></button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-2">{lightboxImage + 1} / {project.gallery.length}</div>
          <img src={project.gallery[lightboxImage].url} alt="" className="max-w-full max-h-full object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  )
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2 opacity-60">{icon}<span className="text-sm tracking-wider uppercase">{label}</span></div>
      <p className="font-medium">{value}</p>
    </div>
  )
}
