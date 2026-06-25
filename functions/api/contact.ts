// Cloudflare Pages Function — handles POST /api/contact
//
// Differs from the Vercel version: Pages Functions use the Web-standard
// Request/Response API and file-based routing (this file = the /api/contact
// route). Environment variables arrive via `context.env`, NOT process.env.
//
// Requires the `nodejs_compat` compatibility flag (set in the Cloudflare
// dashboard, see README) because @sanity/client and resend use Node APIs.

import { createClient } from '@sanity/client'
import { Resend } from 'resend'

interface Env {
  SANITY_PROJECT_ID: string
  SANITY_DATASET: string
  SANITY_API_VERSION: string
  SANITY_WRITE_TOKEN: string
  RESEND_API_KEY: string
  CONTACT_EMAIL: string
  TURNSTILE_SECRET_KEY: string
  MAIL_FROM?: string
}

const LIMITS = {
  firstName: 100,
  lastName: 100,
  email: 200,
  phone: 50,
  projectType: 100,
  message: 5000,
}

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
  return value.trim().slice(0, max)
}

async function verifyTurnstile(token: string, ip: string | null, secret: string): Promise<boolean> {
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token, remoteip: ip }),
    })
    const data = (await res.json()) as { success?: boolean }
    return data.success === true
  } catch {
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

  // Config guard — fail fast with a generic client message.
  if (
    !env.SANITY_WRITE_TOKEN ||
    !env.RESEND_API_KEY ||
    !env.TURNSTILE_SECRET_KEY ||
    !env.CONTACT_EMAIL
  ) {
    console.error('Contact API misconfigured: missing one or more required env vars')
    return json({ error: 'Server configuration error. Please try again later.' }, 500)
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

  const ip = request.headers.get('CF-Connecting-IP')
  const isHuman = await verifyTurnstile(turnstileToken, ip, env.TURNSTILE_SECRET_KEY)
  if (!isHuman) {
    return json({ error: 'Verification failed. Please try again.' }, 400)
  }

  const sanity = createClient({
    projectId: env.SANITY_PROJECT_ID,
    dataset: env.SANITY_DATASET,
    apiVersion: env.SANITY_API_VERSION,
    token: env.SANITY_WRITE_TOKEN,
    useCdn: false,
  })

  const resend = new Resend(env.RESEND_API_KEY)
  const mailFrom = env.MAIL_FROM || 'SIARI BUILD Website <onboarding@resend.dev>'

  try {
    await sanity.create({
      _type: 'contactSubmission',
      firstName,
      lastName,
      email,
      phone,
      projectType,
      message,
      submittedAt: new Date().toISOString(),
    })

    await resend.emails.send({
      from: mailFrom,
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
    console.error('Contact form error:', err)
    return json({ error: 'Failed to send message. Please try again.' }, 500)
  }
}

