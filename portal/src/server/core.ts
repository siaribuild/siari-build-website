// Shared server-side primitives for the client portal.
//
// This file lives OUTSIDE functions/ on purpose: every module under functions/
// is treated as a route by Cloudflare Pages. Modules here are bundled into the
// Functions that import them, and are never routable themselves.

export interface PortalEnv {
  DB: D1Database
  /** Private file storage. Objects here are NEVER served directly. */
  PORTAL_FILES: R2Bucket
  RESEND_API_KEY: string
  MAIL_FROM: string
  /** Absolute origin of the site, used to build links in emails. */
  SITE_URL: string
  CONTACT_EMAIL?: string
}

export type Role = 'client' | 'viewer' | 'content_admin' | 'project_manager' | 'owner_admin'

export interface SessionUser {
  id: string
  email: string
  name: string | null
  role: Role
  status: 'invited' | 'active' | 'disabled'
}

export const ADMIN_ROLES: Role[] = ['viewer', 'content_admin', 'project_manager', 'owner_admin']

export function isAdmin(role: Role): boolean {
  return ADMIN_ROLES.includes(role)
}

// ------------------------------------------------------------------ http ---

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  })
}

/** Errors are deliberately generic: never reveal whether a record exists. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
  }
}

export const badRequest = (m = 'Invalid request.') => new HttpError(400, m)
export const unauthorized = (m = 'Please sign in.') => new HttpError(401, m)
/** Used for BOTH "not a member" and "does not exist" so the two are indistinguishable. */
export const notFound = (m = 'Not found.') => new HttpError(404, m)

export function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

export function escapeHtml(input: unknown): string {
  return String(input ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// ---------------------------------------------------------------- crypto ---

const enc = new TextEncoder()

/** URL-safe random token. 32 bytes = 256 bits of entropy. */
export function randomToken(bytes = 32): string {
  const buf = new Uint8Array(bytes)
  crypto.getRandomValues(buf)
  return [...buf].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Only hashes of session/login tokens are stored, so a DB dump can't be replayed. */
export async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(value))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function uuid(): string {
  return crypto.randomUUID()
}

export function nowIso(): string {
  return new Date().toISOString()
}

export function isoIn(ms: number): string {
  return new Date(Date.now() + ms).toISOString()
}

export function normaliseEmail(email: unknown): string {
  return typeof email === 'string' ? email.trim().toLowerCase().slice(0, 200) : ''
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// --------------------------------------------------------------- cookies ---

export const SESSION_COOKIE = 'sb_portal_session'
export const SESSION_TTL_MS = 1000 * 60 * 60 * 12 // 12 hours

export function sessionCookie(token: string, maxAgeSeconds: number): string {
  // HttpOnly: unreadable from JS, so XSS cannot exfiltrate the session.
  // SameSite=Lax: not sent on cross-site POSTs, which blocks basic CSRF.
  // Secure: HTTPS only.
  return [
    `${SESSION_COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`,
  ].join('; ')
}

export const clearedSessionCookie = () =>
  `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`

export function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get('Cookie')
  if (!header) return null
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=')
    if (k === name) return rest.join('=') || null
  }
  return null
}
