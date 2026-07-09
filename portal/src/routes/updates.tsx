import { useEffect, useMemo, useState } from 'react'
import { usePortal } from './layout'
import { portal, formatDate, type UpdateItem, type Stage } from '../lib/portal-api'

// Clients never receive drafts or internal notes — the server filters them out;
// this component has no "if (isAdmin)" logic to get wrong.
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
  if (!updates) return <p className="opacity-60">Loading…</p>
  if (!updates.length) return <p className="opacity-60">No project updates have been published yet.</p>

  return (
    <div>
      {/* Filtering only appears once it earns its place. */}
      {updates.length > 5 && stages.length > 0 && (
        <label className="block mb-8 text-sm">
          <span className="eyebrow text-xs block mb-2">Filter by stage</span>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="border border-black/20 bg-transparent px-3 py-2"
          >
            <option value="">All stages</option>
            {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
      )}

      <ol className="space-y-10">
        {visible.map((u) => (
          <li key={u.id} className="border-b border-black/10 pb-10 last:border-0">
            <div className="flex flex-wrap items-baseline gap-3 mb-3">
              {u.pinned === 1 && <span className="text-[0.65rem] uppercase tracking-[0.2em] text-accent">Pinned</span>}
              {u.stage_name && <span className="text-[0.65rem] uppercase tracking-[0.2em] opacity-50">{u.stage_name}</span>}
              <span className="opacity-50 text-xs">{formatDate(u.published_at)}</span>
              {u.status !== 'published' && (
                <span className="text-[0.65rem] uppercase tracking-[0.2em] bg-black/10 px-2 py-0.5">{u.status}</span>
              )}
            </div>
            <h2 className="text-2xl mb-3" style={{ fontWeight: 700, letterSpacing: '-0.01em' }}>{u.title}</h2>
            <p className="opacity-80 whitespace-pre-line leading-relaxed">{u.body}</p>
            {u.attachments.length > 0 && (
              <p className="opacity-50 text-xs mt-4">
                {u.attachments.length} attachment{u.attachments.length > 1 ? 's' : ''}
              </p>
            )}
            {u.author_name && <p className="opacity-40 text-xs mt-3">Posted by {u.author_name}</p>}
          </li>
        ))}
      </ol>
    </div>
  )
}
