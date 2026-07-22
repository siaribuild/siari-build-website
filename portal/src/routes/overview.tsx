import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { usePortal } from './layout'
import { portal, formatDate, STAGE_STATUS_LABELS, type Overview, type Stage, type Contact } from '../lib/portal-api'

// Ordered to answer the client's five questions top-to-bottom:
//   where is it up to · is anything waiting on me · what's next
//   what happened recently · where are my documents
export default function PortalOverview() {
  const { projectId } = usePortal()
  const [data, setData] = useState<Overview | null>(null)
  const [stages, setStages] = useState<Stage[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [error, setError] = useState<string | null>(null)
  const [fill, setFill] = useState(0)

  useEffect(() => {
    let cancelled = false
    setData(null)
    setFill(0)
    Promise.all([portal.overview(projectId), portal.stages(projectId), portal.contacts(projectId)])
      .then(([o, s, c]) => {
        if (cancelled) return
        setData(o)
        setStages(s.stages)
        setContacts(c.contacts)
        // Animate the bar in after paint, matching the site's reveal timing.
        requestAnimationFrame(() => !cancelled && setFill(o.project.progress_percent ?? 0))
      })
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Could not load the project.'))
    return () => { cancelled = true }
  }, [projectId])

  if (error) return <p className="text-red-700">{error}</p>
  if (!data) return <p className="opacity-60 text-sm uppercase tracking-[0.2em]">Loading…</p>

  const p = data.project

  return (
    <div className="space-y-[18px]">
      {/* ── Dark hero: identity, progress, next milestone ─────────────────── */}
      <section className="portal-hero section--dark">
        <span className="portal-corner right-[-30px] top-[-24px] rotate-180" aria-hidden="true" />

        <div className="flex flex-wrap justify-between items-start gap-4 relative">
          <div>
            <div className="eyebrow text-[0.6875rem]" style={{ fontWeight: 600 }}>Your project</div>
            <h1 className="mt-2.5 mb-1.5">{p.name}</h1>
            <p className="text-[0.8125rem] tracking-[0.02em] opacity-60">
              {[p.address, p.suburb, p.project_type].filter(Boolean).join(' · ')}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {p.is_demo === 1 && <span className="portal-banner">Demo content</span>}
            <span className="portal-banner">Read only · Phase 1</span>
          </div>
        </div>

        <div className="mt-[30px] relative">
          <div className="flex items-end justify-between mb-2.5 gap-4">
            <div>
              <div className="text-[0.625rem] uppercase tracking-[0.16em] opacity-45 mb-1">Overall progress</div>
              <div className="portal-pct">
                {p.progress_percent ?? '—'}<span>%</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[0.625rem] uppercase tracking-[0.16em] opacity-45">Current stage</div>
              <div className="font-[600] text-[0.9375rem]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {data.currentStage?.name ?? 'Being prepared'}
              </div>
            </div>
          </div>

          <div
            className="portal-progress-track"
            role="progressbar"
            aria-valuenow={p.progress_percent ?? 0}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Overall project progress"
          >
            <div className="portal-progress-fill" style={{ width: `${fill}%` }} />
          </div>

          <div className="flex flex-wrap gap-x-10 gap-y-3 mt-4">
            <Meta label="Next milestone" value={p.next_milestone_name ?? 'To be confirmed'} />
            <Meta
              label="Target"
              value={p.next_milestone_date ? formatDate(p.next_milestone_date) : '—'}
              note={p.next_milestone_date && p.next_milestone_confirmed !== 1 ? 'Tentative' : undefined}
            />
            <Meta label="Estimated completion" value={p.estimated_completion_label ?? '—'} />
          </div>
        </div>
      </section>

      {/* ── Is anything waiting on me? ────────────────────────────────────── */}
      <ActionCard actions={data.actions} />

      <div className="grid gap-[18px] lg:grid-cols-2">
        {/* ── Build stages ───────────────────────────────────────────────── */}
        <section className="card portal-card lg:col-span-2">
          <div className="portal-card-h">
            <h2>Build stages</h2>
            <span className="eyebrow text-[0.6875rem]">{stages.filter((s) => s.status === 'complete').length}/{stages.length} complete</span>
          </div>
          {stages.length === 0 ? (
            <p className="opacity-60 text-sm">Your project stages are being prepared.</p>
          ) : (
            <ol>
              {stages.map((s) => <StageRow key={s.id} stage={s} />)}
            </ol>
          )}
        </section>

        {/* ── What happened recently? ────────────────────────────────────── */}
        <section className="card portal-card">
          <div className="portal-card-h">
            <h2>Latest update</h2>
            <Link to="/updates" className="eyebrow text-[0.6875rem] hover-accent">View all</Link>
          </div>
          {data.latestUpdate ? (
            <Link to="/updates" className="block group">
              <div className="portal-upd !pt-0 !border-0">
                <div className="date">{formatDate(data.latestUpdate.published_at)}</div>
                <div>
                  <h3 className="group-hover:text-[var(--brand-accent-on-light)] transition-colors">
                    {data.latestUpdate.title}
                  </h3>
                  <p>{data.latestUpdate.excerpt}</p>
                </div>
              </div>
            </Link>
          ) : (
            <p className="opacity-60 text-sm">No project updates have been published yet.</p>
          )}
        </section>

        {/* ── Who do I talk to? ──────────────────────────────────────────── */}
        <section className="card portal-card">
          <div className="portal-card-h"><h2>Project contacts</h2></div>
          {contacts.length === 0 ? (
            <p className="opacity-60 text-sm">Your contacts are being assigned.</p>
          ) : (
            <ul>
              {contacts.map((c) => (
                <li key={c.id} className="portal-doc">
                  <span className="portal-doc-ic" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <div className="nm">{c.name}</div>
                    <div className="mt uppercase">{c.role}</div>
                  </div>
                  <div className="ml-auto text-right text-[0.75rem]">
                    {c.email && <a className="block hover-accent" href={`mailto:${c.email}`}>{c.email}</a>}
                    {c.phone && <a className="block opacity-60 hover-accent" href={`tel:${c.phone}`}>{c.phone}</a>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

function Meta({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div>
      <div className="text-[0.625rem] uppercase tracking-[0.16em] opacity-45">{label}</div>
      <div className="text-[0.9375rem] mt-0.5" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}>
        {value}
        {/* Never imply a date is guaranteed. */}
        {note && <span className="ml-2 text-[0.625rem] uppercase tracking-[0.14em] opacity-50">({note})</span>}
      </div>
    </div>
  )
}

function ActionCard({ actions }: { actions: Overview['actions'] }) {
  if (!actions.length) {
    return (
      <section className="card portal-card">
        <div className="flex items-center gap-3">
          <span className="portal-doc-ic" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
          <div>
            <div className="portal-card-h !mb-0"><h2>Nothing needs your action today</h2></div>
            <p className="text-[0.8125rem] opacity-60 mt-1">We will email you if that changes.</p>
          </div>
        </div>
      </section>
    )
  }
  return (
    <section className="card portal-card" style={{ borderLeftColor: '#b45309' }}>
      <div className="portal-card-h">
        <h2>Awaiting you</h2>
        <span className="eyebrow text-[0.6875rem]">{actions.length} item{actions.length > 1 ? 's' : ''}</span>
      </div>
      <ul>
        {actions.map((a) => (
          <li key={a.id} className="portal-doc">
            <div className="min-w-0">
              <div className="nm">{a.title}</div>
              <div className="mt uppercase">{a.type.replace(/_/g, ' ')}</div>
            </div>
            <div className="ml-auto text-[0.75rem] opacity-70 whitespace-nowrap">Due {formatDate(a.due_date)}</div>
          </li>
        ))}
      </ul>
    </section>
  )
}

const NODE_CLASS: Record<Stage['status'], string> = {
  complete: 'portal-node--done',
  in_progress: 'portal-node--curr',
  delayed: 'portal-node--delayed',
  not_started: 'portal-node--todo',
  skipped: 'portal-node--todo',
}
const STATUS_CLASS: Record<Stage['status'], string> = {
  complete: 'portal-status--done',
  in_progress: 'portal-status--curr',
  delayed: 'portal-status--delayed',
  not_started: 'portal-status--todo',
  skipped: 'portal-status--todo',
}

function StageRow({ stage }: { stage: Stage }) {
  const done = stage.status === 'complete'
  return (
    <li className="portal-stage">
      <span className={`portal-node ${NODE_CLASS[stage.status]}`} aria-hidden="true">
        {done ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        ) : (
          String(stage.stage_number).padStart(2, '0')
        )}
      </span>

      <div className="min-w-0">
        <div className="nm">{stage.name}</div>
        {stage.client_description && <div className="sub">{stage.client_description}</div>}
        {/* Only the client-facing explanation — never internal blockers. */}
        {stage.status === 'delayed' && stage.client_note && (
          <div className="sub" style={{ color: '#b45309' }}>{stage.client_note}</div>
        )}
      </div>

      <div className={`portal-status ${STATUS_CLASS[stage.status]}`}>
        {STAGE_STATUS_LABELS[stage.status]}
      </div>
    </li>
  )
}
