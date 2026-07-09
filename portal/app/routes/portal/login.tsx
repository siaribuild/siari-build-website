import { useState } from 'react'
import { portal } from '../../lib/portal-api'
import { Shell } from './layout'

export function meta() {
  return [{ title: 'Sign in — Siari Build' }, { name: 'robots', content: 'noindex, nofollow' }]
}

// Passwordless magic link. Nothing here reveals whether an account exists: the
// success state is identical for a known and an unknown address.
export default function PortalLogin() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setState('sending')
    try {
      await portal.requestLink(email)
      setState('sent')
    } catch (err) {
      setState('error')
      setMessage(err instanceof Error ? err.message : 'Could not send the link.')
    }
  }

  return (
    <Shell>
      <div className="max-w-md mx-auto">
        <div className="eyebrow text-xs mb-3">Client portal</div>
        <h1 className="text-4xl mb-6" style={{ fontWeight: 700, letterSpacing: '-0.02em' }}>Sign in</h1>

        {state === 'sent' ? (
          <div>
            <p className="mb-3">If that address has portal access, a sign-in link is on its way.</p>
            <p className="text-sm opacity-60">The link expires in 15 minutes and can be used once.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <p className="opacity-70 text-sm">
              The portal is invite-only. Enter the email address Siari Build invited, and we will send you a
              sign-in link.
            </p>
            <label className="block">
              <span className="block text-xs uppercase tracking-[0.2em] mb-2 opacity-70">Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-black/20 bg-transparent px-4 py-3"
              />
            </label>
            {state === 'error' && (
              <p role="alert" aria-live="assertive" className="text-red-700 text-sm">{message}</p>
            )}
            <button
              type="submit"
              disabled={state === 'sending'}
              className="btn-bronze px-9 py-4 text-sm tracking-wider uppercase disabled:opacity-50"
            >
              {state === 'sending' ? 'Sending…' : 'Email me a link'}
            </button>
          </form>
        )}
      </div>
    </Shell>
  )
}
