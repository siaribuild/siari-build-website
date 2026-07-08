// Cloudflare Pages Function — handles POST /api/contact
//
// Pages Functions use the Web-standard Request/Response API and file-based
// routing (this file = the /api/contact route). Env vars arrive via
// `context.env`, NOT process.env. Requires the `nodejs_compat` flag (set in the
// Cloudflare dashboard / wrangler) because `resend` uses Node APIs.
//
// STORAGE MODEL:
//   • Email (Resend) is the GUARANTEED channel — if it fails, the request fails
//     so the sender can retry and no lead is silently lost.
//   • Cloudflare D1 is an OPTIONAL private record. Customer data is NOT stored in
//     the (public) Sanity dataset. If the D1 binding `DB` is absent, or a write
//     fails, we skip storage and still send the email — storage never blocks the
//     notification. Apply migrations/0001_contact_submissions.sql to enable it.
//
// RATE LIMITING: optional per-IP throttle via a KV binding (CONTACT_RATELIMIT);
// no-ops if the binding is absent. Complements Turnstile (bots) by capping how
// many submissions one IP can make even with valid tokens.

import { Resend } from 'resend'

interface Env {
  RESEND_API_KEY: string
  CONTACT_EMAIL: string
  TURNSTILE_SECRET_KEY: string
  MAIL_FROM: string
  // Optional — bind a KV namespace to enable per-IP rate limiting.
  CONTACT_RATELIMIT?: KVNamespace
  // Optional — bind a D1 database to persist submissions privately.
  DB?: D1Database
}

const LIMITS = {
  firstName: 100,
  lastName: 100,
  email: 200,
  phone: 50,
  projectType: 100,
  message: 5000,
}

// Per-IP submission cap within a rolling window.
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_SECONDS = 60 * 60 // 1 hour

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function escapeHtml(input: unknown): string {
  return String(input ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function clean(value: unknown, max: number): string {
  if (typeof value !== 'string') return ''
  // Strip control characters (incl. CR/LF) so nothing user-supplied can break
  // out of a header-like context (e.g. the email subject). Then trim + cap.
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, max)
}

async function verifyTurnstile(token: string, ip: string | null, secret: string): Promise<boolean> {
  try {
    // `remoteip` is optional; omit it when absent rather than sending null.
    const payload: Record<string, string> = { secret, response: token }
    if (ip) payload.remoteip = ip

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = (await res.json()) as { success?: boolean; 'error-codes'?: string[] }

    if (data.success !== true) {
      // Cloudflare says WHY. Without this the failure is undiagnosable.
      //   invalid-input-secret     -> TURNSTILE_SECRET_KEY is wrong
      //   invalid-input-response   -> token doesn't match this secret's widget
      //                               (site key and secret key are from different widgets)
      //   timeout-or-duplicate     -> token expired (>300s) or already redeemed
      //   missing-input-secret     -> secret not sent
      console.error('[turnstile] verification failed:', JSON.stringify(data['error-codes'] ?? data))
    }
    return data.success === true
  } catch (err) {
    console.error('[turnstile] siteverify request threw:', err)
    return false
  }
}

// Returns true if the request is WITHIN the limit (allowed), false if over.
// Fails OPEN on any KV error or missing binding — availability over strictness,
// since Turnstile is still enforced regardless.
async function withinRateLimit(kv: KVNamespace | undefined, ip: string | null): Promise<boolean> {
  if (!kv || !ip) return true
  const key = `contact:${ip}`
  try {
    const current = parseInt((await kv.get(key)) || '0', 10) || 0
    if (current >= RATE_LIMIT_MAX) return false
    // Best-effort increment. TTL bounds the window; a new key starts a fresh one.
    await kv.put(key, String(current + 1), { expirationTtl: RATE_LIMIT_WINDOW_SECONDS })
    return true
  } catch {
    return true
  }
}

interface Submission {
  firstName: string
  lastName: string
  email: string
  phone: string
  projectType: string
  message: string
  ip: string | null
}

// Best-effort private persistence. NEVER throws — a storage failure or a missing
// binding must not stop the email from going out. Returns whether it stored.
async function storeSubmission(db: D1Database | undefined, s: Submission): Promise<boolean> {
  if (!db) return false
  try {
    await db
      .prepare(
        `INSERT INTO contact_submissions
           (id, first_name, last_name, email, phone, project_type, message, submitted_at, ip)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        crypto.randomUUID(),
        s.firstName,
        s.lastName || null,
        s.email,
        s.phone || null,
        s.projectType || null,
        s.message,
        new Date().toISOString(),
        s.ip,
      )
      .run()
    return true
  } catch (err) {
    console.error('D1 store failed (continuing to email):', err)
    return false
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context

  // Config guard — fail fast with a generic client message. Note: no Sanity vars
  // and no DB here — storage is optional; only the email path is required.
  if (!env.RESEND_API_KEY || !env.TURNSTILE_SECRET_KEY || !env.CONTACT_EMAIL || !env.MAIL_FROM) {
    console.error('Contact API misconfigured: missing one or more required env vars')
    return json({ error: 'Server configuration error. Please try again later.' }, 500)
  }

  const ip = request.headers.get('CF-Connecting-IP')

  // Hard cap on body size before we parse anything. Content-Length is a cheap
  // first gate; the per-field length caps below are the real backstop.
  const MAX_BODY_BYTES = 64 * 1024
  const declaredLength = parseInt(request.headers.get('Content-Length') || '0', 10)
  if (declaredLength > MAX_BODY_BYTES) {
    return json({ error: 'Request too large.' }, 413)
  }

  // Per-IP throttle (no-ops if the KV binding isn't set).
  if (!(await withinRateLimit(env.CONTACT_RATELIMIT, ip))) {
    return json({ error: 'Too many submissions. Please try again later.' }, 429)
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return json({ error: 'Invalid request.' }, 400)
  }

  const firstName = clean(body.firstName, LIMITS.firstName)
  const lastName = clean(body.lastName, LIMITS.lastName)
  const email = clean(body.email, LIMITS.email)
  const phone = clean(body.phone, LIMITS.phone)
  const projectType = clean(body.projectType, LIMITS.projectType)
  const message = clean(body.message, LIMITS.message)
  const turnstileToken = typeof body.turnstileToken === 'string' ? body.turnstileToken : ''

  if (!firstName || !email || !message) {
    return json({ error: 'Please fill in your name, email, and message.' }, 400)
  }
  if (!EMAIL_RE.test(email)) {
    return json({ error: 'Please enter a valid email address.' }, 400)
  }
  if (!turnstileToken) {
    return json({ error: 'Verification check is required.' }, 400)
  }

  const isHuman = await verifyTurnstile(turnstileToken, ip, env.TURNSTILE_SECRET_KEY)
  if (!isHuman) {
    return json({ error: 'Verification failed. Please try again.' }, 400)
  }

  // Optional private record first (best-effort; never blocks the email).
  await storeSubmission(env.DB, { firstName, lastName, email, phone, projectType, message, ip })

  // Guaranteed channel: email. If this fails, fail the request so the sender
  // can retry — the notification is the thing we must not lose.
  try {
    const resend = new Resend(env.RESEND_API_KEY)
    await resend.emails.send({
      from: env.MAIL_FROM,
      to: env.CONTACT_EMAIL,
      replyTo: email,
      subject: `New enquiry from ${firstName} ${lastName} — ${projectType || 'General'}`.slice(0, 200),
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${escapeHtml(firstName)} ${escapeHtml(lastName)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Phone:</strong> ${phone ? escapeHtml(phone) : 'Not provided'}</p>
        <p><strong>Project Type:</strong> ${projectType ? escapeHtml(projectType) : 'Not specified'}</p>
        <hr />
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, '<br/>')}</p>
      `,
    })
    return json({ success: true }, 200)
  } catch (err) {
    console.error('Contact form email error:', err)
    return json({ error: 'Failed to send message. Please try again.' }, 500)
  }
}