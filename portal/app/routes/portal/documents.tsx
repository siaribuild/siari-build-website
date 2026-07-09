import { useEffect, useState } from 'react'
import { usePortal } from './layout'
import { portal, formatBytes, formatDate, DOC_TYPE_LABELS, type DocumentItem } from '../../lib/portal-api'

// Downloads never link to storage. Every href points at an authorising Function
// that checks membership and records an audit event before streaming the file.
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
  if (!docs) return <p className="opacity-60">Loading…</p>
  if (!docs.length) return <p className="opacity-60">No documents have been shared yet.</p>

  // Simple categories, not deep folders.
  const groups = docs.reduce<Record<string, DocumentItem[]>>((acc, d) => {
    ;(acc[d.document_type] ||= []).push(d)
    return acc
  }, {})

  return (
    <div className="space-y-12">
      {Object.entries(groups).map(([type, items]) => (
        <section key={type}>
          <h2 className="eyebrow text-xs mb-4">{DOC_TYPE_LABELS[type] ?? type}</h2>
          <ul className="divide-y divide-black/10 border-y border-black/10">
            {items.map((d) => (
              <li key={d.id} className="py-4 flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <p style={{ fontWeight: 600 }} className={d.status === 'superseded' ? 'opacity-60' : ''}>
                    {d.display_name}
                    {d.revision_label && <span className="opacity-50 font-normal"> · {d.revision_label}</span>}
                  </p>
                  <p className="opacity-50 text-xs mt-1">
                    {formatDate(d.uploaded_at)} · {formatBytes(d.size_bytes)}
                    {/* Superseded revisions must be clearly labelled. */}
                    {d.status === 'superseded' && (
                      <span className="ml-2 uppercase tracking-wider">Superseded</span>
                    )}
                  </p>
                  {d.description && <p className="opacity-60 text-sm mt-1">{d.description}</p>}
                </div>
                <a
                  href={portal.downloadHref(d.version_id)}
                  className="text-sm uppercase tracking-wider hover-accent whitespace-nowrap"
                >
                  Download
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
