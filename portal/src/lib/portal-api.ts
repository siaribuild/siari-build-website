// Client-side access to the portal API.
//
// Every call is same-origin and sends the HttpOnly session cookie automatically.
// No token is ever stored in JS, so XSS cannot lift a session.
//
// There is no client-side "isAllowed" logic anywhere in the portal: the server
// decides. The UI only reacts to 401 (signed out) and 404 (not yours / absent).

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/portal${path}`, {
    credentials: 'same-origin',
    ...init,
    headers: {
      ...(init?.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })
  const data = (await res.json().catch(() => ({}))) as { error?: string }
  if (!res.ok) throw new ApiError(res.status, data.error || 'Something went wrong.')
  return data as T
}

// ------------------------------------------------------------------ types ---

export interface PortalUser {
  id: string
  email: string
  name: string | null
  role: string
  isAdmin: boolean
}
export interface ProjectSummary {
  id: string
  name: string
  suburb: string | null
  status: string
}
export interface Me {
  user: PortalUser
  projects: ProjectSummary[]
}

export interface Overview {
  project: {
    id: string
    name: string
    address: string | null
    suburb: string | null
    project_type: string | null
    client_summary: string | null
    description: string | null
    progress_percent: number | null
    progress_label: string | null
    next_milestone_name: string | null
    next_milestone_date: string | null
    next_milestone_confirmed: number
    estimated_completion_label: string | null
    status: string
    is_demo: number
  }
  currentStage: { id: string; name: string; stage_number: number; status: string } | null
  latestUpdate: { id: string; title: string; published_at: string; excerpt: string } | null
  actions: Array<{ id: string; type: string; title: string; due_date: string | null }>
  projectManager: { name: string; role: string; email: string | null; phone?: string | null } | null
}

export interface Stage {
  id: string
  stage_number: number
  name: string
  client_description: string | null
  status: 'not_started' | 'in_progress' | 'complete' | 'delayed' | 'skipped'
  target_start_date: string | null
  target_completion_date: string | null
  actual_start_date: string | null
  actual_completion_date: string | null
  client_note: string | null
  milestone_date: string | null
}

export interface UpdateItem {
  id: string
  title: string
  body: string
  category: string | null
  stage_id: string | null
  stage_name: string | null
  status: string
  pinned: number
  published_at: string | null
  author_name: string | null
  attachments: Array<{ id: string; kind: string; caption: string | null; mime_type: string | null }>
}

export interface DocumentItem {
  id: string
  display_name: string
  document_type: string
  status: 'draft' | 'current' | 'superseded' | 'archived'
  description: string | null
  version_id: string
  filename: string
  mime_type: string
  size_bytes: number
  revision_label: string | null
  uploaded_at: string
}

export interface Contact {
  id: string
  name: string
  role: string
  email: string | null
  phone: string | null
}

// --------------------------------------------------------------- endpoints ---

export const portal = {
  me: () => call<Me>('/me'),
  requestLink: (email: string) =>
    call<{ ok: true }>('/auth/request-link', { method: 'POST', body: JSON.stringify({ email }) }),
  verify: (token: string) =>
    call<{ ok: true }>('/auth/verify', { method: 'POST', body: JSON.stringify({ token }) }),
  logout: () => call<{ ok: true }>('/auth/logout', { method: 'POST' }),

  overview: (projectId: string) => call<Overview>(`/projects/${projectId}/overview`),
  stages: (projectId: string) => call<{ stages: Stage[] }>(`/projects/${projectId}/stages`),
  updates: (projectId: string, stageId?: string) =>
    call<{ updates: UpdateItem[] }>(`/projects/${projectId}/updates${stageId ? `?stage=${stageId}` : ''}`),
  documents: (projectId: string) => call<{ documents: DocumentItem[] }>(`/projects/${projectId}/documents`),
  contacts: (projectId: string) => call<{ contacts: Contact[] }>(`/projects/${projectId}/contacts`),

  /** Download URL — the file itself is streamed by an authorising Function. */
  downloadHref: (versionId: string) => `/api/portal/documents/${versionId}/download`,
}

// ----------------------------------------------------------------- format ---

export const DOC_TYPE_LABELS: Record<string, string> = {
  contract: 'Contract',
  plans: 'Plans',
  permit: 'Permit',
  engineering: 'Engineering',
  soil_report: 'Soil report',
  colour_finishes_schedule: 'Colour & finishes',
  selection_schedule: 'Selections',
  invoice: 'Invoice',
  variation: 'Variation',
  warranty: 'Warranty',
  handover: 'Handover',
  other: 'Other',
}

export const STAGE_STATUS_LABELS: Record<Stage['status'], string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  complete: 'Complete',
  delayed: 'Delayed',
  skipped: 'Skipped',
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatBytes(n: number): string {
  if (!n) return '—'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}
