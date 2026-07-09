// Cloudflare Worker entry point for the client portal.
//
// WHY A WORKER, NOT PAGES
//  * Cron Triggers (`scheduled` below). Pages has no equivalent, and this portal
//    genuinely needs scheduled work: expired credentials must not accumulate,
//    and the contact-submission retention policy has to actually delete things.
//  * Real observability — `wrangler tail` streams full request/response.
//  * A clean hostname (portal.siaribuild.com.au) for a Cloudflare Access policy
//    over the admin paths, with no *.pages.dev bypass to reason about.
//
// The marketing site stays on Pages, where a content-first static site belongs.

import { handleApi } from './api'
import type { PortalEnv } from './server/core'

interface WorkerEnv extends PortalEnv {
  ASSETS: Fetcher
}

/** Sessions must not outlive their expiry, and credentials must not pile up. */
const RETENTION = {
  /** Contact-form submissions. Satisfies the privacy policy's deletion promise. */
  contactSubmissionMonths: 24,
  /** Audit events. Long enough to investigate, short enough to be proportionate. */
  auditEventMonths: 84,
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname.startsWith('/api/portal/')) {
      const res = await handleApi(request, env)
      // Portal responses are per-user: never let a shared cache hold them.
      const headers = new Headers(res.headers)
      headers.set('Cache-Control', 'no-store')
      headers.set('X-Content-Type-Options', 'nosniff')
      headers.set('Referrer-Policy', 'same-origin')
      return new Response(res.body, { status: res.status, headers })
    }

    if (url.pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({ error: 'Not found.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Unreachable in production: `run_worker_first` is scoped to /api/*, so the
    // asset server answers everything else without invoking this Worker. Kept as
    // a correct fallback for `wrangler dev` and for any future routing change.
    return env.ASSETS.fetch(request)
  },

  /**
   * Nightly housekeeping (03:00 Melbourne ≈ 17:00 UTC).
   * Each step is independent: one failure must not skip the others.
   */
  async scheduled(_event: ScheduledController, env: WorkerEnv, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runJobs(env))
  },
} satisfies ExportedHandler<WorkerEnv>

async function runJobs(env: WorkerEnv): Promise<void> {
  const now = new Date().toISOString()

  const jobs: Array<[string, () => Promise<D1Result>]> = [
    // Single-use tokens: delete once expired or spent. Nothing needs them after.
    ['expired login tokens', () =>
      env.DB.prepare(`DELETE FROM login_tokens WHERE expires_at < ? OR used_at IS NOT NULL`).bind(now).run()],

    // Expired or revoked sessions. Revoked rows are kept 7 days so an audit can
    // still explain why a session stopped working, then removed.
    ['expired sessions', () =>
      env.DB.prepare(
        `DELETE FROM sessions
          WHERE expires_at < ?
             OR (revoked_at IS NOT NULL AND revoked_at < datetime('now','-7 days'))`,
      ).bind(now).run()],

    // Retention: the privacy policy promises deletion "when no longer needed".
    // This is what makes that true rather than aspirational.
    ['old contact submissions', () =>
      env.DB.prepare(
        `DELETE FROM contact_submissions WHERE submitted_at < datetime('now', ?)`,
      ).bind(`-${RETENTION.contactSubmissionMonths} months`).run()],

    ['old audit events', () =>
      env.DB.prepare(
        `DELETE FROM audit_events WHERE created_at < datetime('now', ?)`,
      ).bind(`-${RETENTION.auditEventMonths} months`).run()],

    // Notification history is a log, not a queue; trim it.
    ['old notifications', () =>
      env.DB.prepare(`DELETE FROM notifications WHERE created_at < datetime('now','-12 months')`).run()],
  ]

  for (const [name, run] of jobs) {
    try {
      const res = await run()
      console.log(`[cron] ${name}: removed ${res.meta.changes ?? 0} row(s)`)
    } catch (err) {
      // Never let one failing job abort the rest.
      console.error(`[cron] ${name} FAILED:`, err instanceof Error ? err.message : String(err))
    }
  }
}
