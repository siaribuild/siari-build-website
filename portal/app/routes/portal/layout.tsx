import { useEffect, useState, createContext, useContext } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router'
import { portal, ApiError, type Me, type ProjectSummary } from '../../lib/portal-api'

// The portal is a client-rendered SPA shell: no route here is prerendered, so no
// private data ever appears in a static payload. `clientLoader` + `ssr: false`
// means this component only ever runs in the browser.
export function meta() {
  return [{ title: 'Client portal — Siari Build' }, { name: 'robots', content: 'noindex, nofollow' }]
}

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
        // Remember the last project across page loads. It is only an id — the
        // server still checks membership on every request.
        const remembered = sessionStorage.getItem(PROJECT_KEY)
        const valid = data.projects.find((p) => p.id === remembered)
        setProjectIdState(valid?.id ?? data.projects[0]?.id ?? '')
      })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 401) {
          navigate(`/portal/login?next=${encodeURIComponent(location.pathname)}`, { replace: true })
          return
        }
        setError(err instanceof Error ? err.message : 'Could not load the portal.')
      })
    return () => {
      cancelled = true
    }
  }, [navigate, location.pathname])

  const setProjectId = (id: string) => {
    sessionStorage.setItem(PROJECT_KEY, id)
    setProjectIdState(id)
  }

  if (error) return <Shell><p className="text-red-700">{error}</p></Shell>
  if (!me) return <Shell><p className="opacity-60">Loading…</p></Shell>

  // Explicit empty state — the brief requires this, not a blank screen.
  if (!me.projects.length) {
    return (
      <Shell>
        <div className="max-w-xl">
          <h1 className="text-3xl mb-4" style={{ fontWeight: 700 }}>No project access</h1>
          <p className="opacity-70 mb-8">You do not currently have access to a project. Contact Siari Build.</p>
          <LogoutButton />
        </div>
      </Shell>
    )
  }

  const project = me.projects.find((p) => p.id === projectId) ?? me.projects[0]

  return (
    <Ctx.Provider value={{ me, projectId: project.id, setProjectId }}>
      <Shell>
        <header className="flex flex-wrap items-end justify-between gap-4 mb-10 pb-6 border-b border-black/10">
          <div>
            <div className="eyebrow text-xs mb-2">Client portal</div>
            <h1 className="text-3xl md:text-4xl" style={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
              {project.name}
            </h1>
            {project.suburb && <p className="opacity-60 text-sm mt-1">{project.suburb}</p>}
          </div>
          <div className="flex items-center gap-4">
            {me.projects.length > 1 && (
              <label className="text-sm">
                <span className="sr-only">Switch project</span>
                <select
                  value={project.id}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="border border-black/20 bg-transparent px-3 py-2 text-sm"
                >
                  {me.projects.map((p: ProjectSummary) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </label>
            )}
            <LogoutButton />
          </div>
        </header>

        <nav className="flex gap-6 mb-10 text-sm uppercase tracking-wider" aria-label="Portal sections">
          <Tab to="/portal">Overview</Tab>
          <Tab to="/portal/updates">Updates</Tab>
          <Tab to="/portal/documents">Documents</Tab>
          {me.user.isAdmin && <Tab to="/portal/admin">Admin</Tab>}
        </nav>

        <Outlet />
      </Shell>
    </Ctx.Provider>
  )
}

function Tab({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end={to === '/portal'}
      className={({ isActive }) =>
        `pb-2 border-b-2 transition-colors ${isActive ? 'border-current text-accent' : 'border-transparent opacity-60 hover:opacity-100'}`
      }
    >
      {children}
    </NavLink>
  )
}

function LogoutButton() {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      onClick={async () => {
        await portal.logout().catch(() => {})
        sessionStorage.removeItem(PROJECT_KEY)
        navigate('/portal/login', { replace: true })
      }}
      className="text-sm uppercase tracking-wider opacity-70 hover:opacity-100 transition-opacity"
    >
      Sign out
    </button>
  )
}

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-background text-foreground pt-28 pb-24 px-6">
      <div className="max-w-5xl mx-auto">{children}</div>
    </main>
  )
}
