import { useEffect, useState } from 'react'
import { usePortal } from './layout'
import { formatDate } from '../lib/portal-api'

// Builder-facing controls. Everything here is enforced server-side: the presence
// of this UI grants nothing. A client who guesses /portal/admin sees an empty
// tab and every API call returns 404.
export default function PortalAdmin() {
  const { me, projectId } = usePortal()
  if (!me.user.isAdmin) return <p className="opacity-60 text-sm">Not found.</p>

  return (
    <div className="space-y-[18px]">
      <PublishUpdate projectId={projectId} />
      <div className="grid gap-[18px] lg:grid-cols-2">
        <UploadDocument projectId={projectId} />
        <InviteClient projectId={projectId} />
      </div>
      <AuditLog projectId={projectId} />
    </div>
  )
}

function useSubmit() {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const run = async (fn: () => Promise<unknown>, okText: string) => {
    setBusy(true)
    setMsg(null)
    try {
      await fn()
      setMsg({ ok: true, text: okText })
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Failed.' })
    } finally {
      setBusy(false)
    }
  }
  return { busy, msg, run }
}

// Reuses the site's .field (cream bg, hairline border, --cut-6 clipped corner).
const field = 'field'

function Notice({ msg }: { msg: { ok: boolean; text: string } | null }) {
  if (!msg) return null
  return (
    <p role="alert" aria-live="polite" className={`text-sm ${msg.ok ? 'text-green-800' : 'text-red-700'}`}>
      {msg.text}
    </p>
  )
}

function PublishUpdate({ projectId }: { projectId: string }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [notify, setNotify] = useState(false)
  const { busy, msg, run } = useSubmit()

  const save = (publish: boolean) =>
    run(async () => {
      const res = await fetch('/api/portal/admin/updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ projectId, title, body, publish, notify: publish && notify }),
      })
      if (!res.ok) throw new Error(((await res.json().catch(() => ({}))) as { error?: string }).error ?? 'Failed.')
      setTitle('')
      setBody('')
    }, publish ? 'Update published.' : 'Draft saved.')

  return (
    <section className="card portal-card">
      <div className="portal-card-h"><h2>Publish an update</h2></div>
      <div className="space-y-4 max-w-2xl">
        <input className={field} placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className={field} rows={5} placeholder="What happened?" value={body} onChange={(e) => setBody(e.target.value)} />
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
          {/* Notifications are opt-in per publish, so small edits don't spam clients. */}
          Email the client when this is published
        </label>
        <Notice msg={msg} />
        <div className="flex gap-3">
          <button disabled={busy || !title || !body} onClick={() => save(false)} className="btn btn-outline disabled:opacity-40">
            Save draft
          </button>
          <button disabled={busy || !title || !body} onClick={() => save(true)} className="btn btn-bronze disabled:opacity-40">
            Publish
          </button>
        </div>
      </div>
    </section>
  )
}

const DOC_TYPES = [
  'contract', 'plans', 'permit', 'engineering', 'soil_report',
  'colour_finishes_schedule', 'selection_schedule', 'invoice',
  'variation', 'warranty', 'handover', 'other',
]

function UploadDocument({ projectId }: { projectId: string }) {
  const [file, setFile] = useState<File | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [documentType, setDocumentType] = useState('plans')
  const [revisionLabel, setRevisionLabel] = useState('')
  const [clientVisible, setClientVisible] = useState(true)
  const { busy, msg, run } = useSubmit()

  const upload = () =>
    run(async () => {
      if (!file) throw new Error('Choose a file.')
      const fd = new FormData()
      fd.set('file', file)
      fd.set('projectId', projectId)
      fd.set('displayName', displayName || file.name)
      fd.set('documentType', documentType)
      fd.set('revisionLabel', revisionLabel)
      fd.set('clientVisible', String(clientVisible))
      const res = await fetch('/api/portal/admin/documents', { method: 'POST', body: fd, credentials: 'same-origin' })
      if (!res.ok) throw new Error(((await res.json().catch(() => ({}))) as { error?: string }).error ?? 'Upload failed.')
      setFile(null)
      setDisplayName('')
      setRevisionLabel('')
    }, 'Document uploaded.')

  return (
    <section className="card portal-card">
      <div className="portal-card-h"><h2>Upload a document</h2></div>
      <div className="space-y-4">
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
        <input className={field} placeholder="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        <div className="grid gap-4 sm:grid-cols-2">
          <select className={field} value={documentType} onChange={(e) => setDocumentType(e.target.value)}>
            {DOC_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </select>
          <input className={field} placeholder="Revision label (e.g. Rev C)" value={revisionLabel} onChange={(e) => setRevisionLabel(e.target.value)} />
        </div>
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" checked={clientVisible} onChange={(e) => setClientVisible(e.target.checked)} />
          Visible to the client
        </label>
        <Notice msg={msg} />
        <button disabled={busy || !file} onClick={upload} className="btn btn-bronze disabled:opacity-40">
          Upload
        </button>
      </div>
    </section>
  )
}

function InviteClient({ projectId }: { projectId: string }) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const { busy, msg, run } = useSubmit()

  const invite = () =>
    run(async () => {
      const res = await fetch('/api/portal/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email, name, projectId }),
      })
      if (!res.ok) throw new Error(((await res.json().catch(() => ({}))) as { error?: string }).error ?? 'Failed.')
      setEmail('')
      setName('')
    }, 'Invitation sent.')

  return (
    <section className="card portal-card">
      <div className="portal-card-h"><h2>Invite a client</h2></div>
      <div className="space-y-4">
        <input className={field} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className={field} placeholder="Name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
        <Notice msg={msg} />
        <button disabled={busy || !email} onClick={invite} className="btn btn-bronze disabled:opacity-40">
          Send invitation
        </button>
      </div>
    </section>
  )
}

interface AuditRow {
  id: string
  action: string
  entity_type: string
  created_at: string
  actor_email: string | null
}

function AuditLog({ projectId }: { projectId: string }) {
  const [rows, setRows] = useState<AuditRow[]>([])

  useEffect(() => {
    let cancelled = false
    fetch(`/api/portal/admin/audit?projectId=${projectId}`, { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : { events: [] }))
      .then((d) => !cancelled && setRows((d as { events: AuditRow[] }).events))
      .catch(() => {})
    return () => { cancelled = true }
  }, [projectId])

  return (
    <section className="card portal-card">
      <div className="portal-card-h"><h2>Audit history</h2></div>
      {rows.length === 0 ? (
        <p className="opacity-60 text-sm">No events recorded yet.</p>
      ) : (
        <ul className="text-sm max-h-80 overflow-y-auto">
          {rows.map((e) => (
            <li key={e.id} className="portal-doc !py-2.5">
              <span className="nm">{e.action}<span className="opacity-50 font-normal"> · {e.entity_type}</span></span>
              <span className="ml-auto mt whitespace-nowrap">{e.actor_email ?? 'system'} · {formatDate(e.created_at)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
