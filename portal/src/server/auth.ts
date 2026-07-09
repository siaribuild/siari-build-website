// Authentication, authorization, and audit.
//
// AUTHENTICATION — passwordless magic link.
//   Chosen over email+password for Phase 1 because the portal is invite-only and
//   read-only: there are no passwords to leak, reset, or reuse. The brief permits
//   it, and it upgrades cleanly (Phase 3 legal sign-off should add a second factor).
//
// AUTHORIZATION — every read is scoped by an active project_members row. There is
//   no code path that trusts a project_id from the client without checking it.

import {
  type PortalEnv,
  type SessionUser,
  type Role,
  HttpError,
  isAdmin,
  nowIso,
  isoIn,
  randomToken,
  readCookie,
  sha256,
  SESSION_COOKIE,
  SESSION_TTL_MS,
  unauthorized,
  notFound,
  uuid,
} from './core'

const LOGIN_TOKEN_TTL_MS = 1000 * 60 * 15 // 15 minutes
const INVITE_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7 // 7 days

// ---------------------------------------------------------------- sessions ---

export async function createSession(
  env: PortalEnv,
  userId: string,
  request: Request,
): Promise<{ token: string; maxAgeSeconds: number }> {
  const token = randomToken()
  await env.DB.prepare(
    `INSERT INTO sessions (id, user_id, expires_at, created_at, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      await sha256(token),
      userId,
      isoIn(SESSION_TTL_MS),
      nowIso(),
      request.headers.get('CF-Connecting-IP'),
      (request.headers.get('User-Agent') || '').slice(0, 300),
    )
    .run()
  return { token, maxAgeSeconds: Math.floor(SESSION_TTL_MS / 1000) }
}

/** Resolve the caller from the session cookie. Returns null when unauthenticated. */
export async function getSessionUser(env: PortalEnv, request: Request): Promise<SessionUser | null> {
  const token = readCookie(request, SESSION_COOKIE)
  if (!token) return null

  const row = await env.DB.prepare(
    `SELECT u.id, u.email, u.name, u.role, u.status
       FROM sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.id = ?
        AND s.revoked_at IS NULL
        AND s.expires_at > ?
        AND u.status = 'active'`,
  )
    .bind(await sha256(token), nowIso())
    .first<SessionUser>()

  return row ?? null
}

export async function revokeSession(env: PortalEnv, request: Request): Promise<void> {
  const token = readCookie(request, SESSION_COOKIE)
  if (!token) return
  await env.DB.prepare(`UPDATE sessions SET revoked_at = ? WHERE id = ?`)
    .bind(nowIso(), await sha256(token))
    .run()
}

export async function requireUser(env: PortalEnv, request: Request): Promise<SessionUser> {
  const user = await getSessionUser(env, request)
  if (!user) throw unauthorized()
  return user
}

export async function requireAdmin(
  env: PortalEnv,
  request: Request,
  allowed: Role[] = ['owner_admin', 'project_manager', 'content_admin'],
): Promise<SessionUser> {
  const user = await requireUser(env, request)
  // A client hitting an admin route gets 404, not 403 — admin surface area is
  // not advertised to non-admins.
  if (!isAdmin(user.role) || !allowed.includes(user.role)) throw notFound()
  return user
}

// ------------------------------------------------------------ magic links ---

/** Issues a single-use token. Returns the raw token (only ever emailed, never stored). */
export async function issueToken(
  env: PortalEnv,
  userId: string,
  purpose: 'invite' | 'login',
): Promise<string> {
  const token = randomToken()
  const ttl = purpose === 'invite' ? INVITE_TOKEN_TTL_MS : LOGIN_TOKEN_TTL_MS
  await env.DB.prepare(
    `INSERT INTO login_tokens (id, user_id, purpose, expires_at, created_at) VALUES (?, ?, ?, ?, ?)`,
  )
    .bind(await sha256(token), userId, purpose, isoIn(ttl), nowIso())
    .run()
  return token
}

/** Consumes a token exactly once. Also activates an invited user on first use. */
export async function consumeToken(env: PortalEnv, token: string): Promise<string | null> {
  const id = await sha256(token)
  const row = await env.DB.prepare(
    `SELECT user_id FROM login_tokens WHERE id = ? AND used_at IS NULL AND expires_at > ?`,
  )
    .bind(id, nowIso())
    .first<{ user_id: string }>()
  if (!row) return null

  // Mark used before creating a session — a replay finds used_at set.
  const marked = await env.DB.prepare(`UPDATE login_tokens SET used_at = ? WHERE id = ? AND used_at IS NULL`)
    .bind(nowIso(), id)
    .run()
  if (!marked.meta.changes) return null

  await env.DB.prepare(
    `UPDATE users SET status = 'active', last_login_at = ?, updated_at = ? WHERE id = ?`,
  )
    .bind(nowIso(), nowIso(), row.user_id)
    .run()

  // Accepting an invite activates any pending memberships.
  await env.DB.prepare(
    `UPDATE project_members SET status = 'active', accepted_at = COALESCE(accepted_at, ?)
      WHERE user_id = ? AND status = 'invited'`,
  )
    .bind(nowIso(), row.user_id)
    .run()

  return row.user_id
}

// --------------------------------------------------------- authorization ---

export interface Membership {
  projectId: string
  memberType: 'client' | 'admin'
  accessLevel: string
}

/**
 * The single gate for project data. Admins are authorised by role; clients only
 * via an ACTIVE membership row. A non-member gets 404 (not 403), so URL probing
 * cannot be used to discover which project ids exist.
 */
export async function requireProjectAccess(
  env: PortalEnv,
  user: SessionUser,
  projectId: string,
): Promise<Membership> {
  if (isAdmin(user.role)) {
    if (user.role === 'owner_admin' || user.role === 'content_admin' || user.role === 'viewer') {
      const exists = await env.DB.prepare(`SELECT id FROM projects WHERE id = ?`).bind(projectId).first()
      if (!exists) throw notFound()
      return { projectId, memberType: 'admin', accessLevel: user.role }
    }
    // project_manager: only projects they are assigned to.
    const row = await env.DB.prepare(
      `SELECT access_level FROM project_members
        WHERE project_id = ? AND user_id = ? AND status = 'active' AND member_type = 'admin'`,
    )
      .bind(projectId, user.id)
      .first<{ access_level: string }>()
    if (!row) throw notFound()
    return { projectId, memberType: 'admin', accessLevel: row.access_level }
  }

  const row = await env.DB.prepare(
    `SELECT access_level FROM project_members
      WHERE project_id = ? AND user_id = ? AND status = 'active' AND member_type = 'client'`,
  )
    .bind(projectId, user.id)
    .first<{ access_level: string }>()
  if (!row) throw notFound()
  return { projectId, memberType: 'client', accessLevel: row.access_level }
}

// ----------------------------------------------------------------- audit ---

export async function recordAudit(
  env: PortalEnv,
  opts: {
    actorUserId?: string | null
    projectId?: string | null
    entityType: string
    entityId?: string | null
    action: string
    before?: unknown
    after?: unknown
    request?: Request
  },
): Promise<void> {
  try {
    await env.DB.prepare(
      `INSERT INTO audit_events
         (id, actor_user_id, project_id, entity_type, entity_id, action,
          before_snapshot, after_snapshot, ip_address, user_agent, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        uuid(),
        opts.actorUserId ?? null,
        opts.projectId ?? null,
        opts.entityType,
        opts.entityId ?? null,
        opts.action,
        opts.before === undefined ? null : JSON.stringify(opts.before),
        opts.after === undefined ? null : JSON.stringify(opts.after),
        opts.request?.headers.get('CF-Connecting-IP') ?? null,
        (opts.request?.headers.get('User-Agent') || '').slice(0, 300) || null,
        nowIso(),
      )
      .run()
  } catch (err) {
    // Auditing must never break the request it is describing.
    console.error('[audit] failed to record event:', err instanceof Error ? err.message : String(err))
  }
}

export { HttpError }
