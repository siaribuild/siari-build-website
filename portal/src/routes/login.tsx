import { useState } from 'react'
import { portal } from '../lib/portal-api'

// Dark full-bleed panel with a bronze-edged card — the same treatment the site
// uses for its inner heroes (corner bracket, clipped corner, 4px left border).
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
    <div className="section--dark min-h-screen flex items-center justify-center px-6 py-24 relative">
      <span className="portal-corner top-[34px] left-[34px]" aria-hidden="true" />

      <div
        className="relative w-full max-w-[380px] px-9 pt-[42px] pb-[38px]"
        style={{ background: 'var(--card-bg)', borderLeft: '4px solid var(--brand-primary)', clipPath: 'var(--cut-30)' }}
      >
        <div className="flex items-center gap-3 mb-[30px]">
          <span className="portal-avatar" aria-hidden="true">SB</span>
          <span className="portal-wm text-base">Siari Build</span>
        </div>

        <div className="eyebrow text-[0.6875rem] mb-2" style={{ fontWeight: 600 }}>Client portal</div>

        {state === 'sent' ? (
          <>
            <h1 className="heading-display text-2xl mb-4">Check your inbox</h1>
            <p className="text-sm opacity-70 mb-2">
              If that address has portal access, a sign-in link is on its way.
            </p>
            <p className="text-xs opacity-50">The link expires in 15 minutes and can be used once.</p>
          </>
        ) : (
          <>
            <h1 className="heading-display text-2xl mb-4">Sign in</h1>
            <p className="text-sm opacity-70 mb-7">
              The portal is invite-only. Enter the email address Siari Build invited and we will send you a
              sign-in link.
            </p>
            <form onSubmit={submit} className="space-y-4">
              <label className="block">
                <span className="block text-[0.625rem] uppercase tracking-[0.2em] mb-2 opacity-60">Email</span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="field"
                  style={{ background: 'transparent', borderColor: 'rgba(245,243,239,.18)', color: 'inherit' }}
                />
              </label>
              {state === 'error' && (
                <p role="alert" aria-live="assertive" className="text-sm" style={{ color: '#f0a58a' }}>{message}</p>
              )}
              <button type="submit" disabled={state === 'sending'} className="btn btn-bronze w-full disabled:opacity-50">
                {state === 'sending' ? 'Sending…' : 'Email me a link'}
              </button>
            </form>
          </>
        )}

        <p className="mt-8 pt-5 text-[0.6875rem] opacity-40 border-t border-white/10">
          Trouble signing in? Contact your project manager.
        </p>
      </div>
    </div>
  )
}
