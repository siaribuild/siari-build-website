import { useEffect, useState } from 'react'
import { usePortal } from './layout'
import { portal, formatBytes, formatDate, DOC_TYPE_LABELS, type DocumentItem } from '../lib/portal-api'

// Downloads never link to storage. Every href points at an authorising handler
// that checks membership and writes an audit event before streaming the file.
export default function PortalDocuments() {
  const { projectId } = usePortal()
  const [docs, setDocs] = useState<DocumentItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setDocs(null)
    portal
      .documents(projectId)
      .then((d) => !cancelled && setDocs(d.documents))
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Could not load documents.'))
    return () => { cancelled = true }
  }, [projectId])

  if (error) return <p className="text-red-700">{error}</p>
  if (!docs) return <p className="opacity-60 text-sm uppercase tracking-[0.2em]">Loading…</p>
  if (!docs.length) {
    return (
      <section className="card portal-card">
        <div className="portal-card-h"><h2>Documents</h2></div>
        <p className="opacity-60 text-sm">No documents have been shared yet.</p>
      </section>
    )
  }

  // Simple categories, not deep folders.
  const groups = docs.reduce<Record<string, DocumentItem[]>>((acc, d) => {
    ;(acc[d.document_type] ||= []).push(d)
    return acc
  }, {})

  return (
    <div className="space-y-[18px]">
      {Object.entries(groups).map(([type, items]) => (
        <section key={type} className="card portal-card">
          <div className="portal-card-h">
            <h2>{DOC_TYPE_LABELS[type] ?? type}</h2>
            <span className="eyebrow text-[0.6875rem]">{items.length}</span>
          </div>
          <ul>
            {items.map((d) => (
              <li key={d.id} className="portal-doc">
                <span className="portal-doc-ic" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <div className={`nm ${d.status === 'superseded' ? 'opacity-60' : ''}`}>
                    {d.display_name}
                    {d.revision_label && <span className="opacity-50 font-normal"> · {d.revision_label}</span>}
                  </div>
                  <div className="mt">
                    {formatDate(d.uploaded_at)} · {formatBytes(d.size_bytes)}
                    {/* Superseded revisions must be clearly labelled. */}
                    {d.status === 'superseded' && <span className="ml-2 uppercase tracking-[0.14em]">Superseded</span>}
                  </div>
                  {d.description && <div className="mt normal-case">{d.description}</div>}
                </div>
                <a
                  href={portal.downloadHref(d.version_id)}
                  className="portal-dl"
                  aria-label={`Download ${d.display_name}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 3v12m0 0 4-4m-4 4-4-4" /><path d="M4 19h16" />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
