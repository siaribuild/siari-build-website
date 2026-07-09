// Portal API — everything under /api/portal/*
//
// A single router rather than file-based routing: every authorization decision
// stays visible in one place. The invariant is that no handler below touches
// project data without first calling requireProjectAccess.
//
// Reached only via `assets.run_worker_first: ["/api/*"]` in wrangler.jsonc —
// without that, Workers would serve static assets ahead of this code and no auth
// check would ever run.

import {
  type PortalEnv,
  type SessionUser,
  HttpError,
  EMAIL_RE,
  badRequest,
  clearedSessionCookie,
  errMsg,
  isAdmin,
  json,
  normaliseEmail,
  notFound,
  nowIso,
  sessionCookie,
  uuid,
} from './server/core'
import {
  consumeToken,
  createSession,
  getSessionUser,
  issueToken,
  recordAudit,
  requireAdmin,
  requireProjectAccess,
  requireUser,
  revokeSession,
} from './server/auth'
import { sendInvite, sendLoginLink, sendUpdatePublished } from './server/mail'

interface Ctx {
  request: Request
  env: PortalEnv
  segments: string[]
  method: string
}

// =========================================================== auth handlers ===

/**
 * POST /api/portal/auth/request-link  { email }
 * Always returns 200 — never reveals whether an account exists.
 */
async function requestLink({ request, env }: Ctx): Promise<Response> {
  const body = (await request.json().catch(() => ({}))) as { email?: unknown }
  const email = normaliseEmail(body.email)
  if (!email || !EMAIL_RE.test(email)) throw badRequest('Please enter a valid email address.')

  const user = await env.DB.prepare(
    `SELECT id, email, status FROM users WHERE email = ? AND status != 'disabled'`,
  )
    .bind(email)
    .first<{ id: string; email: string; status: string }>()

  if (user) {
    const token = await issueToken(env, user.id, 'login')
    await sendLoginLink(env, { to: user.email, userId: user.id, token })
    await recordAudit(env, { actorUserId: user.id, entityType: 'user', entityId: user.id, action: 'login_link_requested', request })
  }

  // Same response either way — no account enumeration.
  return json({ ok: true })
}

/** POST /api/portal/auth/verify  { token } → sets the session cookie. */
async function verify({ request, env }: Ctx): Promise<Response> {
  const body = (await request.json().catch(() => ({}))) as { token?: unknown }
  const token = typeof body.token === 'string' ? body.token : ''
  if (!token) throw badRequest('Missing token.')

  const userId = await consumeToken(env, token)
  if (!userId) throw new HttpError(400, 'That link has expired or has already been used.')

  const { token: sessionToken, maxAgeSeconds } = await createSession(env, userId, request)
  await recordAudit(env, { actorUserId: userId, entityType: 'user', entityId: userId, action: 'login', request })

  return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie(sessionToken, maxAgeSeconds) })
}

async function logout({ request, env }: Ctx): Promise<Response> {
  const user = await getSessionUser(env, request)
  await revokeSession(env, request)
  if (user) await recordAudit(env, { actorUserId: user.id, entityType: 'user', entityId: user.id, action: 'logout', request })
  return json({ ok: true }, 200, { 'Set-Cookie': clearedSessionCookie() })
}

/** GET /api/portal/me → the caller plus the projects they may see. */
async function me({ request, env }: Ctx): Promise<Response> {
  const user = await requireUser(env, request)

  const { results } = isAdmin(user.role) && user.role !== 'project_manager'
    ? await env.DB.prepare(
        `SELECT id, name, suburb, status FROM projects WHERE status != 'archived' ORDER BY created_at DESC`,
      ).all<ProjectRow>()
    : await env.DB.prepare(
        `SELECT p.id, p.name, p.suburb, p.status
           FROM projects p
           JOIN project_members m ON m.project_id = p.id
          WHERE m.user_id = ? AND m.status = 'active' AND p.status != 'archived'
          ORDER BY p.created_at DESC`,
      )
        .bind(user.id)
        .all<ProjectRow>()

  return json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role, isAdmin: isAdmin(user.role) },
    projects: results ?? [],
  })
}

interface ProjectRow {
  id: string
  name: string
  suburb: string | null
  status: string
}

// ======================================================== project handlers ===

/** GET /api/portal/projects/:id/overview */
async function overview(ctx: Ctx, user: SessionUser, projectId: string): Promise<Response> {
  const { env } = ctx

  const project = await env.DB.prepare(
    `SELECT p.id, p.name, p.address, p.suburb, p.state, p.project_type, p.description, p.client_summary,
            p.progress_percent, p.progress_label, p.next_milestone_name, p.next_milestone_date,
            p.next_milestone_confirmed, p.estimated_completion_label, p.status, p.is_demo,
            p.current_stage_id,
            pm.name  AS pm_name,
            pm.email AS pm_email
       FROM projects p
       LEFT JOIN users pm ON pm.id = p.project_manager_user_id
      WHERE p.id = ?`,
  )
    .bind(projectId)
    .first<Record<string, unknown>>()
  if (!project) throw notFound()

  const currentStage = project.current_stage_id
    ? await env.DB.prepare(`SELECT id, name, stage_number, status FROM project_stages WHERE id = ?`)
        .bind(project.current_stage_id)
        .first()
    : null

  const latest = await env.DB.prepare(
    `SELECT id, title, published_at, substr(body, 1, 240) AS excerpt
       FROM project_updates
      WHERE project_id = ? AND status = 'published' AND client_visible = 1
      ORDER BY published_at DESC LIMIT 1`,
  )
    .bind(projectId)
    .first()

  // Phase 2 writes action_items; in Phase 1 this is always empty, which is why
  // the dashboard can honestly say "Nothing needs your action today".
  const { results: actions } = await env.DB.prepare(
    `SELECT id, type, title, due_date, related_entity_type, related_entity_id
       FROM action_items
      WHERE project_id = ? AND status IN ('open','in_progress')
        AND (assigned_user_id IS NULL OR assigned_user_id = ?)
      ORDER BY due_date IS NULL, due_date ASC LIMIT 5`,
  )
    .bind(projectId, user.id)
    .all()

  const pmContact = await env.DB.prepare(
    `SELECT name, role, email, phone FROM project_contacts
      WHERE project_id = ? AND client_visible = 1 AND role LIKE '%Project Manager%' LIMIT 1`,
  )
    .bind(projectId)
    .first()

  return json({
    project,
    currentStage,
    latestUpdate: latest ?? null,
    actions: actions ?? [],
    projectManager: pmContact ?? (project.pm_name ? { name: project.pm_name, email: project.pm_email, role: 'Project Manager' } : null),
  })
}

/** GET /api/portal/projects/:id/updates */
async function updates(ctx: Ctx, user: SessionUser, projectId: string): Promise<Response> {
  const url = new URL(ctx.request.url)
  const stageId = url.searchParams.get('stage')
  const staff = isAdmin(user.role)

  // Clients never see drafts, archived items, or internal (client_visible = 0) rows.
  const where = staff
    ? `project_id = ?`
    : `project_id = ? AND status = 'published' AND client_visible = 1`

  const sql = `SELECT u.id, u.title, u.body, u.category, u.stage_id, u.status, u.pinned,
                      u.published_at, u.created_at, u.updated_at,
                      s.name AS stage_name, a.name AS author_name
                 FROM project_updates u
                 LEFT JOIN project_stages s ON s.id = u.stage_id
                 LEFT JOIN users a ON a.id = u.author_user_id
                WHERE ${where} ${stageId ? 'AND u.stage_id = ?' : ''}
                ORDER BY u.pinned DESC, COALESCE(u.published_at, u.created_at) DESC
                LIMIT 100`
  const stmt = stageId
    ? ctx.env.DB.prepare(sql).bind(projectId, stageId)
    : ctx.env.DB.prepare(sql).bind(projectId)
  const { results } = await stmt.all<Record<string, unknown>>()

  // Attach photos/captions per update.
  const ids = (results ?? []).map((r) => r.id as string)
  let attachments: Record<string, unknown>[] = []
  if (ids.length) {
    const placeholders = ids.map(() => '?').join(',')
    const res = await ctx.env.DB.prepare(
      `SELECT id, update_id, kind, caption, mime_type, document_id
         FROM update_attachments WHERE update_id IN (${placeholders}) ORDER BY sort_order`,
    )
      .bind(...ids)
      .all<Record<string, unknown>>()
    attachments = res.results ?? []
  }

  return json({
    updates: (results ?? []).map((u) => ({
      ...u,
      attachments: attachments.filter((a) => a.update_id === u.id),
    })),
  })
}

/** GET /api/portal/projects/:id/documents */
async function documents(ctx: Ctx, user: SessionUser, projectId: string): Promise<Response> {
  const staff = isAdmin(user.role)
  // Clients see 'current' documents, plus superseded revisions only where the
  // version itself is explicitly still client-visible.
  const sql = staff
    ? `SELECT d.*, v.id AS version_id, v.filename, v.mime_type, v.size_bytes, v.revision_label, v.uploaded_at
         FROM documents d LEFT JOIN document_versions v ON v.id = d.current_version_id
        WHERE d.project_id = ? ORDER BY d.updated_at DESC`
    : `SELECT d.id, d.display_name, d.document_type, d.status, d.description, d.effective_date,
              d.related_stage_id, d.updated_at,
              v.id AS version_id, v.filename, v.mime_type, v.size_bytes, v.revision_label, v.uploaded_at
         FROM documents d JOIN document_versions v ON v.id = d.current_version_id
        WHERE d.project_id = ?
          AND d.client_visible = 1
          AND d.status IN ('current','superseded')
          AND v.client_visible = 1
        ORDER BY CASE d.status WHEN 'current' THEN 0 ELSE 1 END, d.updated_at DESC`

  const { results } = await ctx.env.DB.prepare(sql).bind(projectId).all()
  return json({ documents: results ?? [] })
}

/** GET /api/portal/projects/:id/contacts */
async function contacts(ctx: Ctx, user: SessionUser, projectId: string): Promise<Response> {
  const staff = isAdmin(user.role)
  const sql = staff
    ? `SELECT id, name, role, email, phone, client_visible FROM project_contacts WHERE project_id = ? ORDER BY sort_order`
    : `SELECT id, name, role, email, phone FROM project_contacts WHERE project_id = ? AND client_visible = 1 ORDER BY sort_order`
  const { results } = await ctx.env.DB.prepare(sql).bind(projectId).all()
  return json({ contacts: results ?? [] })
}

// ====================================================== document download ===

/**
 * GET /api/portal/documents/:versionId/download
 * The ONLY way to read a file. R2 keys never leave the server; there is no
 * public URL. Every download is authorised and audited.
 */
async function download(ctx: Ctx, versionId: string): Promise<Response> {
  const { env, request } = ctx
  const user = await requireUser(env, request)

  const row = await env.DB.prepare(
    `SELECT v.id, v.file_storage_key, v.filename, v.mime_type, v.client_visible AS version_visible,
            d.id AS document_id, d.project_id, d.client_visible AS doc_visible, d.status
       FROM document_versions v
       JOIN documents d ON d.id = v.document_id
      WHERE v.id = ?`,
  )
    .bind(versionId)
    .first<Record<string, unknown>>()
  if (!row) throw notFound()

  // Membership is checked server-side. A project_id from the client is never trusted.
  await requireProjectAccess(env, user, row.project_id as string)

  if (!isAdmin(user.role)) {
    const visible = row.doc_visible === 1 && row.version_visible === 1 && ['current', 'superseded'].includes(row.status as string)
    if (!visible) throw notFound()
  }

  const object = await env.PORTAL_FILES.get(row.file_storage_key as string)
  if (!object) throw notFound()

  await recordAudit(env, {
    actorUserId: user.id,
    projectId: row.project_id as string,
    entityType: 'document_version',
    entityId: versionId,
    action: 'download',
    request,
  })

  const filename = String(row.filename).replace(/["\r\n]/g, '')
  return new Response(object.body, {
    headers: {
      'Content-Type': String(row.mime_type || 'application/octet-stream'),
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

// ========================================================= admin handlers ===

/** POST /api/portal/admin/invite  { email, name, projectId, accessLevel } */
async function adminInvite(ctx: Ctx): Promise<Response> {
  const { env, request } = ctx
  const actor = await requireAdmin(env, request, ['owner_admin', 'project_manager'])
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>

  const email = normaliseEmail(body.email)
  const projectId = typeof body.projectId === 'string' ? body.projectId : ''
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : null
  const accessLevel = body.accessLevel === 'secondary_client' ? 'secondary_client' : 'owner_client'
  if (!email || !EMAIL_RE.test(email) || !projectId) throw badRequest('Email and project are required.')

  await requireProjectAccess(env, actor, projectId)

  const project = await env.DB.prepare(`SELECT id, name FROM projects WHERE id = ?`).bind(projectId).first<{ id: string; name: string }>()
  if (!project) throw notFound()

  let user = await env.DB.prepare(`SELECT id, email, status FROM users WHERE email = ?`).bind(email).first<{ id: string; email: string; status: string }>()
  if (!user) {
    const id = uuid()
    await env.DB.prepare(
      `INSERT INTO users (id, email, name, role, status, created_at, updated_at) VALUES (?, ?, ?, 'client', 'invited', ?, ?)`,
    )
      .bind(id, email, name, nowIso(), nowIso())
      .run()
    user = { id, email, status: 'invited' }
  }
  if (user.status === 'disabled') throw badRequest('That account is disabled.')

  await env.DB.prepare(
    `INSERT INTO project_members (id, project_id, user_id, member_type, access_level, status, invited_at, created_at)
     VALUES (?, ?, ?, 'client', ?, 'invited', ?, ?)
     ON CONFLICT (project_id, user_id) DO UPDATE SET status = 'invited', revoked_at = NULL, invited_at = excluded.invited_at`,
  )
    .bind(uuid(), projectId, user.id, accessLevel, nowIso(), nowIso())
    .run()

  const token = await issueToken(env, user.id, 'invite')
  await sendInvite(env, { to: user.email, userId: user.id, name, token, projectName: project.name })
  await recordAudit(env, {
    actorUserId: actor.id, projectId, entityType: 'project_member', entityId: user.id,
    action: 'client_invited', after: { email, accessLevel }, request,
  })

  return json({ ok: true })
}

/** POST /api/portal/admin/revoke  { projectId, userId } */
async function adminRevoke(ctx: Ctx): Promise<Response> {
  const { env, request } = ctx
  const actor = await requireAdmin(env, request, ['owner_admin', 'project_manager'])
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const projectId = String(body.projectId ?? '')
  const userId = String(body.userId ?? '')
  if (!projectId || !userId) throw badRequest()

  await requireProjectAccess(env, actor, projectId)
  await env.DB.prepare(`UPDATE project_members SET status = 'revoked', revoked_at = ? WHERE project_id = ? AND user_id = ?`)
    .bind(nowIso(), projectId, userId)
    .run()
  // Kill live sessions immediately, not just future reads.
  await env.DB.prepare(`UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL`).bind(nowIso(), userId).run()

  await recordAudit(env, { actorUserId: actor.id, projectId, entityType: 'project_member', entityId: userId, action: 'access_revoked', request })
  return json({ ok: true })
}

/** POST /api/portal/admin/updates  { projectId, id?, title, body, stageId?, category?, publish?, notify? } */
async function adminSaveUpdate(ctx: Ctx): Promise<Response> {
  const { env, request } = ctx
  const actor = await requireAdmin(env, request, ['owner_admin', 'project_manager', 'content_admin'])
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>

  const projectId = String(b.projectId ?? '')
  const title = String(b.title ?? '').trim().slice(0, 200)
  const bodyText = String(b.body ?? '').trim().slice(0, 20000)
  if (!projectId || !title || !bodyText) throw badRequest('Project, title and body are required.')
  await requireProjectAccess(env, actor, projectId)

  const publish = b.publish === true
  const notify = b.notify === true
  const id = typeof b.id === 'string' && b.id ? b.id : uuid()

  const existing = await env.DB.prepare(`SELECT * FROM project_updates WHERE id = ? AND project_id = ?`).bind(id, projectId).first()

  if (existing) {
    await env.DB.prepare(
      `UPDATE project_updates SET title = ?, body = ?, stage_id = ?, category = ?,
              status = ?, published_at = COALESCE(published_at, ?), notify_client = ?, updated_at = ?
        WHERE id = ?`,
    )
      .bind(title, bodyText, b.stageId ?? null, b.category ?? null,
        publish ? 'published' : (existing.status as string), publish ? nowIso() : null, notify ? 1 : 0, nowIso(), id)
      .run()
    // "Once published, edits create an audit event."
    await recordAudit(env, {
      actorUserId: actor.id, projectId, entityType: 'project_update', entityId: id,
      action: publish && existing.status !== 'published' ? 'publish' : 'edit',
      before: existing, after: { title, status: publish ? 'published' : existing.status }, request,
    })
  } else {
    await env.DB.prepare(
      `INSERT INTO project_updates (id, project_id, title, body, stage_id, category, status, client_visible,
                                    published_at, notify_client, author_user_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)`,
    )
      .bind(id, projectId, title, bodyText, b.stageId ?? null, b.category ?? null,
        publish ? 'published' : 'draft', publish ? nowIso() : null, notify ? 1 : 0, actor.id, nowIso(), nowIso())
      .run()
    await recordAudit(env, {
      actorUserId: actor.id, projectId, entityType: 'project_update', entityId: id,
      action: publish ? 'publish' : 'create_draft', after: { title }, request,
    })
  }

  // Notify only on explicit opt-in, and only for published updates.
  if (publish && notify) {
    const project = await env.DB.prepare(`SELECT name FROM projects WHERE id = ?`).bind(projectId).first<{ name: string }>()
    const { results: clients } = await env.DB.prepare(
      `SELECT u.id, u.email FROM users u JOIN project_members m ON m.user_id = u.id
        WHERE m.project_id = ? AND m.member_type = 'client' AND m.status = 'active' AND u.status = 'active'`,
    )
      .bind(projectId)
      .all<{ id: string; email: string }>()

    for (const c of clients ?? []) {
      await sendUpdatePublished(env, {
        to: c.email, userId: c.id, projectId, projectName: project?.name ?? 'Your project',
        updateId: id, title, excerpt: bodyText.slice(0, 240),
      })
    }
  }

  return json({ ok: true, id })
}

/** POST /api/portal/admin/documents  (multipart) — uploads a NEW VERSION, never overwrites. */
async function adminUploadDocument(ctx: Ctx): Promise<Response> {
  const { env, request } = ctx
  const actor = await requireAdmin(env, request, ['owner_admin', 'project_manager', 'content_admin'])

  const form = await request.formData()
  const file = form.get('file')
  const projectId = String(form.get('projectId') ?? '')
  const displayName = String(form.get('displayName') ?? '').trim().slice(0, 200)
  const documentType = String(form.get('documentType') ?? 'other')
  const revisionLabel = String(form.get('revisionLabel') ?? '').slice(0, 40) || null
  const clientVisible = form.get('clientVisible') === 'true'
  const documentId = String(form.get('documentId') ?? '') || null

  if (!(file instanceof File) || !projectId || !displayName) throw badRequest('File, project and name are required.')
  if (file.size > 25 * 1024 * 1024) throw badRequest('File exceeds the 25 MB limit.')
  await requireProjectAccess(env, actor, projectId)

  // Opaque, unguessable key. Nothing derives it from user input.
  const versionId = uuid()
  const key = `projects/${projectId}/documents/${versionId}`
  await env.PORTAL_FILES.put(key, file.stream(), {
    httpMetadata: { contentType: file.type || 'application/octet-stream' },
  })

  const docId = documentId || uuid()
  if (!documentId) {
    await env.DB.prepare(
      `INSERT INTO documents (id, project_id, display_name, document_type, status, client_visible, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'current', ?, ?, ?)`,
    )
      .bind(docId, projectId, displayName, documentType, clientVisible ? 1 : 0, nowIso(), nowIso())
      .run()
  } else {
    // Previous version is superseded, not deleted or overwritten.
    await env.DB.prepare(`UPDATE document_versions SET superseded_at = ? WHERE document_id = ? AND superseded_at IS NULL`)
      .bind(nowIso(), docId)
      .run()
  }

  await env.DB.prepare(
    `INSERT INTO document_versions (id, document_id, file_storage_key, filename, mime_type, size_bytes,
                                    revision_label, client_visible, uploaded_by_user_id, uploaded_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
  )
    .bind(versionId, docId, key, file.name.slice(0, 200), file.type || 'application/octet-stream', file.size,
      revisionLabel, actor.id, nowIso())
    .run()

  await env.DB.prepare(`UPDATE documents SET current_version_id = ?, status = 'current', updated_at = ? WHERE id = ?`)
    .bind(versionId, nowIso(), docId)
    .run()

  await recordAudit(env, {
    actorUserId: actor.id, projectId, entityType: 'document', entityId: docId,
    action: documentId ? 'upload_revision' : 'upload', after: { displayName, revisionLabel, versionId }, request,
  })

  return json({ ok: true, documentId: docId, versionId })
}

/** GET /api/portal/admin/audit?projectId= */
async function adminAudit(ctx: Ctx): Promise<Response> {
  const { env, request } = ctx
  const actor = await requireAdmin(env, request, ['owner_admin', 'project_manager', 'viewer'])
  const projectId = new URL(request.url).searchParams.get('projectId')
  if (!projectId) throw badRequest()
  await requireProjectAccess(env, actor, projectId)

  const { results } = await env.DB.prepare(
    `SELECT a.id, a.action, a.entity_type, a.entity_id, a.created_at, u.email AS actor_email
       FROM audit_events a LEFT JOIN users u ON u.id = a.actor_user_id
      WHERE a.project_id = ? ORDER BY a.created_at DESC LIMIT 200`,
  )
    .bind(projectId)
    .all()
  return json({ events: results ?? [] })
}

// ================================================================== router ===

export async function handleApi(request: Request, env: PortalEnv): Promise<Response> {
  const url = new URL(request.url)
  // /api/portal/<...segments>
  const segments = url.pathname.replace(/^\/api\/portal\/?/, '').split('/').filter(Boolean)
  const ctx: Ctx = { request, env, segments, method: request.method }


  try {
    if (!env.DB) throw new HttpError(500, 'Portal is not configured on the server.')

    const [a, b, c] = segments

    // --- public auth endpoints -------------------------------------------
    if (a === 'auth') {
      if (b === 'request-link' && ctx.method === 'POST') return await requestLink(ctx)
      if (b === 'verify' && ctx.method === 'POST') return await verify(ctx)
      if (b === 'logout' && ctx.method === 'POST') return await logout(ctx)
      throw notFound()
    }

    // --- everything below requires a session ------------------------------
    if (a === 'me' && ctx.method === 'GET') return await me(ctx)

    if (a === 'documents' && b && c === 'download' && ctx.method === 'GET') {
      return await download(ctx, b)
    }

    if (a === 'projects' && b) {
      const user = await requireUser(env, request)
      // THE gate. Nothing below reads project data before this resolves.
      await requireProjectAccess(env, user, b)

      if (ctx.method !== 'GET') throw notFound()
      if (c === 'overview') return await overview(ctx, user, b)
      if (c === 'stages') return await stagesHandler(ctx, user, b)
      if (c === 'updates') return await updates(ctx, user, b)
      if (c === 'documents') return await documents(ctx, user, b)
      if (c === 'contacts') return await contacts(ctx, user, b)
      throw notFound()
    }

    if (a === 'admin') {
      if (b === 'invite' && ctx.method === 'POST') return await adminInvite(ctx)
      if (b === 'revoke' && ctx.method === 'POST') return await adminRevoke(ctx)
      if (b === 'updates' && ctx.method === 'POST') return await adminSaveUpdate(ctx)
      if (b === 'documents' && ctx.method === 'POST') return await adminUploadDocument(ctx)
      if (b === 'audit' && ctx.method === 'GET') return await adminAudit(ctx)
      throw notFound()
    }

    throw notFound()
  } catch (err) {
    if (err instanceof HttpError) {
      const headers: Record<string, string> =
        err.status === 401 ? { 'Set-Cookie': clearedSessionCookie() } : {}
      return json({ error: err.message }, err.status, headers)
    }
    console.error('[portal] unhandled error:', errMsg(err))
    return json({ error: 'Something went wrong.' }, 500)
  }
}

/** GET /api/portal/projects/:id/stages */
async function stagesHandler(ctx: Ctx, user: SessionUser, projectId: string): Promise<Response> {
  const staff = isAdmin(user.role)
  const sql = staff
    ? `SELECT * FROM project_stages WHERE project_id = ? ORDER BY sort_order`
    : `SELECT id, stage_number, name, client_description, status, target_start_date, target_completion_date,
              actual_start_date, actual_completion_date, client_note, milestone_date, sort_order
         FROM project_stages WHERE project_id = ? AND client_visible = 1 ORDER BY sort_order`
  const { results } = await ctx.env.DB.prepare(sql).bind(projectId).all()
  return json({ stages: results ?? [] })
}
