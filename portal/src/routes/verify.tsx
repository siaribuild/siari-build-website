import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { portal } from '../lib/portal-api'
import { Shell } from './layout'

// Exchanges the single-use token in the URL for an HttpOnly session cookie, then
// drops the token from the address bar so it cannot be copied out of history.
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
    <Shell>
      <div className="max-w-md mx-auto">
        {error ? (
          <>
            <h1 className="text-3xl mb-4" style={{ fontWeight: 700 }}>Link not valid</h1>
            <p className="opacity-70 mb-8">{error}</p>
            <a href="/login" className="btn-bronze inline-block px-9 py-4 text-sm tracking-wider uppercase">
              Request a new link
            </a>
          </>
        ) : (
          <p className="opacity-60">Signing you in…</p>
        )}
      </div>
    </Shell>
  )
}
