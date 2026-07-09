// Portal transactional email.
//
// Rules enforced here (from the brief):
//  * Never attach private files to email — always link back to the portal.
//  * Every send is recorded in `notifications`, including failures.
//  * Emails carry only a title/excerpt, never document contents.

import { Resend } from 'resend'
import { type PortalEnv, escapeHtml, nowIso, uuid } from './core'

interface SendArgs {
  env: PortalEnv
  to: string
  subject: string
  html: string
  userId: string
  projectId?: string | null
  type:
    | 'client_invited'
    | 'update_published'
    | 'document_published'
    | 'action_created'
    | 'action_due_soon'
    | 'message_received'
    | 'selection_due'
    | 'variation_issued'
    | 'warranty_updated'
  entityType?: string
  entityId?: string
}

async function send(args: SendArgs): Promise<void> {
  const { env } = args
  let error: string | null = null
  try {
    const resend = new Resend(env.RESEND_API_KEY)
    await resend.emails.send({
      from: env.MAIL_FROM,
      to: args.to,
      subject: args.subject.slice(0, 200),
      html: args.html,
    })
  } catch (err) {
    error = err instanceof Error ? err.message : String(err)
    console.error('[portal-mail] send failed:', error)
  }

  await env.DB.prepare(
    `INSERT INTO notifications (id, user_id, project_id, type, entity_type, entity_id, channel, sent_at, error, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'email', ?, ?, ?)`,
  )
    .bind(
      uuid(),
      args.userId,
      args.projectId ?? null,
      args.type,
      args.entityType ?? null,
      args.entityId ?? null,
      error ? null : nowIso(),
      error,
      nowIso(),
    )
    .run()
}

const shell = (heading: string, bodyHtml: string, ctaHref: string, ctaLabel: string) => `
  <div style="font-family:Inter,Helvetica,Arial,sans-serif;color:#141414;max-width:560px">
    <h2 style="font-weight:700;letter-spacing:-0.02em">${escapeHtml(heading)}</h2>
    ${bodyHtml}
    <p style="margin:28px 0">
      <a href="${ctaHref}" style="background:#8B6940;color:#F5F3EF;padding:12px 24px;
         text-decoration:none;letter-spacing:0.05em;text-transform:uppercase;font-size:13px">
        ${escapeHtml(ctaLabel)}
      </a>
    </p>
    <p style="font-size:12px;color:#6f6a61">Siari Build — client portal</p>
  </div>`

export function sendInvite(env: PortalEnv, opts: { to: string; userId: string; name?: string | null; token: string; projectName?: string }) {
  const link = `${env.SITE_URL}/verify?token=${encodeURIComponent(opts.token)}`
  return send({
    env,
    to: opts.to,
    userId: opts.userId,
    type: 'client_invited',
    subject: 'Your Siari Build project portal',
    html: shell(
      `Welcome${opts.name ? `, ${opts.name}` : ''}`,
      `<p>You have been given access to your project portal${
        opts.projectName ? ` for <strong>${escapeHtml(opts.projectName)}</strong>` : ''
      }. Use the link below to sign in — it is valid for 7 days.</p>`,
      link,
      'Open the portal',
    ),
  })
}

export function sendLoginLink(env: PortalEnv, opts: { to: string; userId: string; token: string }) {
  const link = `${env.SITE_URL}/verify?token=${encodeURIComponent(opts.token)}`
  return send({
    env,
    to: opts.to,
    userId: opts.userId,
    type: 'client_invited',
    subject: 'Your sign-in link',
    html: shell(
      'Sign in to your portal',
      `<p>Use the link below to sign in. It expires in 15 minutes and can only be used once.</p>
       <p style="font-size:13px;color:#6f6a61">If you did not request this, you can ignore this email.</p>`,
      link,
      'Sign in',
    ),
  })
}

export function sendUpdatePublished(
  env: PortalEnv,
  opts: { to: string; userId: string; projectId: string; projectName: string; updateId: string; title: string; excerpt: string },
) {
  const link = `${env.SITE_URL}/updates`
  return send({
    env,
    to: opts.to,
    userId: opts.userId,
    projectId: opts.projectId,
    type: 'update_published',
    entityType: 'project_update',
    entityId: opts.updateId,
    subject: `${opts.projectName}: ${opts.title}`,
    html: shell(
      opts.title,
      `<p style="color:#6f6a61;font-size:13px;text-transform:uppercase;letter-spacing:0.2em">${escapeHtml(
        opts.projectName,
      )}</p>
       <p>${escapeHtml(opts.excerpt)}${opts.excerpt.length >= 240 ? '…' : ''}</p>`,
      link,
      'View the update',
    ),
  })
}
