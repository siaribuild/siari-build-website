import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { portal } from '../lib/portal-api'
import { Centered } from './layout'

// Exchanges the single-use token for an HttpOnly session cookie, then strips it
// from the address bar so it cannot be copied out of browser history.
export default function PortalVerify() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return // tokens are single-use; never fire twice
    ran.current = true

    const token = params.get('token')
    if (!token) {
      setError('That sign-in link is missing its token.')
      return
    }
    portal
      .verify(token)
      .then(() => {
        window.history.replaceState({}, '', '/')
        navigate('/', { replace: true })
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'That link could not be used.'))
  }, [params, navigate])

  return (
    <Centered>
      <div className="max-w-md text-center">
        {error ? (
          <>
            <div className="eyebrow text-xs mb-3">Client portal</div>
            <h1 className="heading-display text-3xl mb-4">Link not valid</h1>
            <p className="opacity-70 mb-8">{error}</p>
            <a href="/login" className="btn btn-bronze">Request a new link</a>
          </>
        ) : (
          <p className="opacity-60 text-sm uppercase tracking-[0.2em]">Signing you in…</p>
        )}
      </div>
    </Centered>
  )
}
