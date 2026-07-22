import { useEffect, useState, createContext, useContext } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router'
import { portal, ApiError, type Me, type ProjectSummary } from '../lib/portal-api'

// Chrome mirrors the marketing site: a dark (.section--dark) sticky bar with the
// wordmark and clipped-underline tabs, over a cream (.section--gray) content area
// whose cards are white with a 4px bronze left border. Both come straight from
// styles/brand.css — the portal forks nothing.

interface PortalCtx {
  me: Me
  projectId: string
  setProjectId: (id: string) => void
}
const Ctx = createContext<PortalCtx | null>(null)

export function usePortal(): PortalCtx {
  const v = useContext(Ctx)
  if (!v) throw new Error('usePortal must be used inside the portal layout')
  return v
}

const PROJECT_KEY = 'siari_portal_project'

function initials(name: string | null, email: string): string {
  const source = (name ?? email).trim()
  const parts = source.split(/[\s@.]+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'S'
}

export default function PortalLayout() {
  const [me, setMe] = useState<Me | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [projectId, setProjectIdState] = useState<string>('')
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    let cancelled = false
    portal
      .me()
      .then((data) => {
        if (cancelled) return
        setMe(data)
        // Only an id is remembered. The server re-checks membership every request.
        const remembered = sessionStorage.getItem(PROJECT_KEY)
        const valid = data.projects.find((p) => p.id === remembered)
        setProjectIdState(valid?.id ?? data.projects[0]?.id ?? '')
      })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 401) {
          navigate(`/login?next=${encodeURIComponent(location.pathname)}`, { replace: true })
          return
        }
        setError(err instanceof Error ? err.message : 'Could not load the portal.')
      })
    return () => { cancelled = true }
  }, [navigate, location.pathname])

  const setProjectId = (id: string) => {
    sessionStorage.setItem(PROJECT_KEY, id)
    setProjectIdState(id)
  }

  if (error) return <Centered><p className="text-red-400">{error}</p></Centered>
  if (!me) return <Centered><p className="opacity-60 text-sm tracking-[0.2em] uppercase">Loading…</p></Centered>

  if (!me.projects.length) {
    return (
      <Centered>
        <div className="max-w-xl text-center">
          <div className="eyebrow text-xs mb-3">Client portal</div>
          <h1 className="heading-display text-3xl mb-4">No project access</h1>
          <p className="opacity-70 mb-8">You do not currently have access to a project. Contact Siari Build.</p>
          <LogoutButton className="btn btn-outline" />
        </div>
      </Centered>
    )
  }

  const project = me.projects.find((p) => p.id === projectId) ?? me.projects[0]

  return (
    <Ctx.Provider value={{ me, projectId: project.id, setProjectId }}>
      <div className="section--gray min-h-screen">
        {/* Dark bar — the same surface the site uses for header-over-media. */}
        <header className="portal-topbar section--dark">
          <div className="max-w-[1160px] mx-auto px-6 h-16 flex items-center gap-5">
            <span className="portal-wm">Siari Build</span>
            <span className="hidden sm:block h-4 w-px bg-white/15" aria-hidden="true" />

            <nav className="flex gap-3 md:gap-5" aria-label="Portal sections">
              <NavLink to="/" end className="portal-tab">Overview</NavLink>
              <NavLink to="/updates" className="portal-tab">Updates</NavLink>
              <NavLink to="/documents" className="portal-tab">Documents</NavLink>
              {me.user.isAdmin && <NavLink to="/admin" className="portal-tab">Admin</NavLink>}
            </nav>

            <div className="ml-auto flex items-center gap-4">
              {me.projects.length > 1 && (
                <label className="hidden md:block">
                  <span className="sr-only">Switch project</span>
                  <select
                    value={project.id}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="bg-transparent border border-white/20 text-xs uppercase tracking-wider px-3 py-2"
                  >
                    {me.projects.map((p: ProjectSummary) => (
                      <option key={p.id} value={p.id} className="text-black">{p.name}</option>
                    ))}
                  </select>
                </label>
              )}
              <div className="hidden sm:block text-right leading-tight">
                <div className="text-xs" style={{ fontWeight: 600 }}>{me.user.name ?? me.user.email}</div>
                <div className="text-[0.625rem] uppercase tracking-[0.16em] opacity-50">
                  {me.user.isAdmin ? me.user.role.replace(/_/g, ' ') : 'Client'}
                </div>
              </div>
              <span className="portal-avatar" aria-hidden="true">{initials(me.user.name, me.user.email)}</span>
              <LogoutButton className="text-xs uppercase tracking-wider opacity-60 hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </header>

        <main className="max-w-[1160px] mx-auto px-6 py-8">
          <Outlet />
        </main>
      </div>
    </Ctx.Provider>
  )
}

function LogoutButton({ className }: { className?: string }) {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        await portal.logout().catch(() => {})
        sessionStorage.removeItem(PROJECT_KEY)
        navigate('/login', { replace: true })
      }}
    >
      Sign out
    </button>
  )
}

/** Full-bleed dark panel used by login, verify and the fatal states. */
export function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="section--dark min-h-screen flex items-center justify-center px-6 py-24">
      {children}
    </div>
  )
}
