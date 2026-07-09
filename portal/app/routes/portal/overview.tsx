import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { usePortal } from './layout'
import {
  portal,
  formatDate,
  STAGE_STATUS_LABELS,
  type Overview,
  type Stage,
  type Contact,
} from '../../lib/portal-api'

// The dashboard must answer, within ten seconds:
//   Where is my project up to? / What happened recently? / What happens next?
//   Is anything waiting on me? / Where are my documents?
// Everything below is ordered to answer those in that sequence.
export default function PortalOverview() {
  const { projectId } = usePortal()
  const [data, setData] = useState<Overview | null>(null)
  const [stages, setStages] = useState<Stage[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setData(null)
    Promise.all([portal.overview(projectId), portal.stages(projectId), portal.contacts(projectId)])
      .then(([o, s, c]) => {
        if (cancelled) return
        setData(o)
        setStages(s.stages)
        setContacts(c.contacts)
      })
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Could not load the project.'))
    return () => { cancelled = true }
  }, [projectId])

  if (error) return <p className="text-red-700">{error}</p>
  if (!data) return <p className="opacity-60">Loading…</p>

  const p = data.project

  return (
    <div className="space-y-12">
      {p.is_demo === 1 && (
        <p className="text-xs uppercase tracking-[0.2em] border border-black/20 px-4 py-3 inline-block">
          Demo / sample content
        </p>
      )}

      {/* 1. Is anything waiting on me? Answered first, unambiguously. */}
      <ActionPanel actions={data.actions} />

      {/* 2. Where is my project up to? */}
      <section className="grid gap-8 md:grid-cols-3">
        <Stat label="Current stage" value={data.currentStage?.name ?? 'Being prepared'} />
        <Stat
          label="Progress"
          value={p.progress_percent != null ? `${p.progress_percent}%` : (p.progress_label ?? '—')}
          note={p.progress_percent != null ? 'Set by your project manager, not auto-calculated' : undefined}
        />
        <Stat label="Estimated completion" value={p.estimated_completion_label ?? '—'} />
      </section>

      {p.progress_percent != null && (
        <div className="h-1 bg-black/10" role="progressbar" aria-valuenow={p.progress_percent} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-[var(--accent)]" style={{ width: `${p.progress_percent}%` }} />
        </div>
      )}

      {/* 3. What happens next? Never imply a date is guaranteed. */}
      <section className="grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="eyebrow text-xs mb-3">Next milestone</h2>
          <p className="text-xl" style={{ fontWeight: 600 }}>{p.next_milestone_name ?? 'To be confirmed'}</p>
          {p.next_milestone_date && (
            <p className="opacity-70 text-sm mt-1">
              {formatDate(p.next_milestone_date)}
              {p.next_milestone_confirmed !== 1 && (
                <span className="ml-2 text-xs uppercase tracking-wider opacity-70">(tentative)</span>
              )}
            </p>
          )}
        </div>
        <div>
          <h2 className="eyebrow text-xs mb-3">Your project manager</h2>
          {data.projectManager ? (
            <>
              <p className="text-xl" style={{ fontWeight: 600 }}>{data.projectManager.name}</p>
              <p className="opacity-70 text-sm mt-1">
                {data.projectManager.email && <a className="hover-accent" href={`mailto:${data.projectManager.email}`}>{data.projectManager.email}</a>}
                {data.projectManager.phone && <> · <a className="hover-accent" href={`tel:${data.projectManager.phone}`}>{data.projectManager.phone}</a></>}
              </p>
            </>
          ) : (
            <p className="opacity-60">Being assigned.</p>
          )}
        </div>
      </section>

      {/* 4. What happened recently? */}
      <section>
        <h2 className="eyebrow text-xs mb-4">Latest update</h2>
        {data.latestUpdate ? (
          <Link to="/portal/updates" className="block border border-black/10 p-6 hover:border-black/30 transition-colors">
            <p className="text-lg" style={{ fontWeight: 600 }}>{data.latestUpdate.title}</p>
            <p className="opacity-70 text-sm mt-2 line-clamp-3">{data.latestUpdate.excerpt}</p>
            <p className="opacity-50 text-xs mt-3">{formatDate(data.latestUpdate.published_at)}</p>
          </Link>
        ) : (
          <p className="opacity-60">No project updates have been published yet.</p>
        )}
      </section>

      {/* Build stage spine. Completed stages stay visible. */}
      <section>
        <h2 className="eyebrow text-xs mb-6">Build stages</h2>
        {stages.length === 0 ? (
          <p className="opacity-60">Your project stages are being prepared.</p>
        ) : (
          <ol className="space-y-0">
            {stages.map((s) => <StageRow key={s.id} stage={s} />)}
          </ol>
        )}
      </section>

      {contacts.length > 0 && (
        <section>
          <h2 className="eyebrow text-xs mb-4">Project contacts</h2>
          <ul className="grid gap-4 md:grid-cols-2">
            {contacts.map((c) => (
              <li key={c.id} className="border border-black/10 p-5">
                <p style={{ fontWeight: 600 }}>{c.name}</p>
                <p className="text-xs uppercase tracking-wider opacity-60 mt-1">{c.role}</p>
                <p className="text-sm mt-2 opacity-80">
                  {c.email && <a className="hover-accent" href={`mailto:${c.email}`}>{c.email}</a>}
                  {c.phone && <> · <a className="hover-accent" href={`tel:${c.phone}`}>{c.phone}</a></>}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function ActionPanel({ actions }: { actions: Overview['actions'] }) {
  if (!actions.length) {
    return (
      <section className="border border-black/10 px-6 py-5">
        <p style={{ fontWeight: 600 }}>Nothing needs your action today.</p>
      </section>
    )
  }
  return (
    <section className="border-2 border-[var(--accent)] px-6 py-5">
      <h2 className="eyebrow text-xs mb-3">Awaiting you</h2>
      <ul className="space-y-2">
        {actions.map((a) => (
          <li key={a.id} className="flex justify-between gap-4">
            <span style={{ fontWeight: 600 }}>{a.title}</span>
            <span className="opacity-70 text-sm whitespace-nowrap">Due {formatDate(a.due_date)}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div>
      <h2 className="eyebrow text-xs mb-2">{label}</h2>
      <p className="text-2xl" style={{ fontWeight: 700 }}>{value}</p>
      {note && <p className="opacity-50 text-xs mt-1">{note}</p>}
    </div>
  )
}

function StageRow({ stage }: { stage: Stage }) {
  const done = stage.status === 'complete'
  const current = stage.status === 'in_progress'
  const delayed = stage.status === 'delayed'

  return (
    <li className={`flex gap-5 border-l-2 pl-6 pb-8 ${current || done ? 'border-[var(--accent)]' : 'border-black/15'}`}>
      <div className="flex-1">
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="opacity-40 text-sm tabular-nums">{String(stage.stage_number).padStart(2, '0')}</span>
          <h3 className={`text-lg ${done ? 'opacity-60' : ''}`} style={{ fontWeight: current ? 700 : 500 }}>
            {stage.name}
          </h3>
          <span
            className={`text-[0.65rem] uppercase tracking-[0.2em] px-2 py-0.5 ${
              delayed ? 'bg-amber-100 text-amber-900' : current ? 'bg-[var(--accent)] text-white' : 'opacity-50'
            }`}
          >
            {STAGE_STATUS_LABELS[stage.status]}
          </span>
        </div>
        {stage.client_description && <p className="opacity-70 text-sm mt-2">{stage.client_description}</p>}
        {/* Only the client-facing explanation is ever exposed — never internal blockers. */}
        {delayed && stage.client_note && <p className="text-sm mt-2 text-amber-900">{stage.client_note}</p>}
        {(stage.target_completion_date || stage.actual_completion_date) && (
          <p className="opacity-50 text-xs mt-2">
            {stage.actual_completion_date
              ? `Completed ${formatDate(stage.actual_completion_date)}`
              : `Target ${formatDate(stage.target_completion_date)}`}
          </p>
        )}
      </div>
    </li>
  )
}
