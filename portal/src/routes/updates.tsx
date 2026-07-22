import { useEffect, useMemo, useState } from 'react'
import { usePortal } from './layout'
import { portal, formatDate, type UpdateItem, type Stage } from '../lib/portal-api'

// Two-column rows (date | content) exactly as the marketing site sets its
// timeline-style lists. Drafts and internal notes are filtered server-side.
export default function PortalUpdates() {
  const { projectId } = usePortal()
  const [updates, setUpdates] = useState<UpdateItem[] | null>(null)
  const [stages, setStages] = useState<Stage[]>([])
  const [stageFilter, setStageFilter] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setUpdates(null)
    Promise.all([portal.updates(projectId), portal.stages(projectId)])
      .then(([u, s]) => {
        if (cancelled) return
        setUpdates(u.updates)
        setStages(s.stages)
      })
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Could not load updates.'))
    return () => { cancelled = true }
  }, [projectId])

  const visible = useMemo(
    () => (stageFilter ? (updates ?? []).filter((u) => u.stage_id === stageFilter) : updates ?? []),
    [updates, stageFilter],
  )

  if (error) return <p className="text-red-700">{error}</p>
  if (!updates) return <p className="opacity-60 text-sm uppercase tracking-[0.2em]">Loading…</p>

  return (
    <section className="card portal-card">
      <div className="portal-card-h">
        <h2>Project updates</h2>
        {/* Filtering only appears once it earns its place. */}
        {updates.length > 5 && stages.length > 0 && (
          <label>
            <span className="sr-only">Filter by stage</span>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="field !w-auto !py-2 !px-3 text-xs uppercase tracking-wider"
            >
              <option value="">All stages</option>
              {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
        )}
      </div>

      {updates.length === 0 ? (
        <p className="opacity-60 text-sm">No project updates have been published yet.</p>
      ) : (
        <ol>
          {visible.map((u) => (
            <li key={u.id} className="portal-upd">
              <div>
                <div className="date">{formatDate(u.published_at)}</div>
                {u.stage_name && (
                  <div className="mt-1 text-[0.625rem] uppercase tracking-[0.14em] opacity-45">{u.stage_name}</div>
                )}
                {u.pinned === 1 && <div className="mt-1 eyebrow text-[0.625rem]">Pinned</div>}
                {/* Only staff ever receive non-published rows. */}
                {u.status !== 'published' && (
                  <div className="mt-1 text-[0.625rem] uppercase tracking-[0.14em] bg-black/10 inline-block px-2 py-0.5">
                    {u.status}
                  </div>
                )}
              </div>
              <div>
                <h3>{u.title}</h3>
                <p className="whitespace-pre-line">{u.body}</p>
                {u.attachments.length > 0 && (
                  <p className="mt-3 text-[0.6875rem] uppercase tracking-[0.14em] opacity-45">
                    {u.attachments.length} attachment{u.attachments.length > 1 ? 's' : ''}
                  </p>
                )}
                {u.author_name && (
                  <p className="mt-2 text-[0.6875rem] opacity-40">Posted by {u.author_name}</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
