import { useState, useEffect } from 'react'
import { client } from '../lib/sanity'

// ─── Module-level cache + in-flight de-duplication ───────────────────────────
//
// The site fetches several queries on nearly every page (site settings,
// navigation, etc.). Without caching, each component that calls useSanity
// re-hits the API on every mount/navigation. This cache:
//   1. Serves a previously-resolved result instantly (no refetch, no spinner)
//   2. De-duplicates concurrent identical requests into a single network call
//      (e.g. Header and Footer both reading navigation at first paint)
//
// Cache lifetime is the page session (cleared on full reload). Because the
// frontend is read-only and content changes are infrequent, a session-length
// cache is the right trade-off; a hard refresh always gets fresh data.

const cache = new Map<string, unknown>()
const inflight = new Map<string, Promise<unknown>>()

function cacheKey(query: string, params: Record<string, unknown>): string {
  return `${query}::${JSON.stringify(params)}`
}

function fetchDeduped<T>(query: string, params: Record<string, unknown>): Promise<T> {
  const key = cacheKey(query, params)

  if (cache.has(key)) {
    return Promise.resolve(cache.get(key) as T)
  }
  const existing = inflight.get(key)
  if (existing) {
    return existing as Promise<T>
  }

  const promise = client
    .fetch<T>(query, params)
    .then((result) => {
      cache.set(key, result)
      inflight.delete(key)
      return result
    })
    .catch((err) => {
      inflight.delete(key)
      throw err
    })

  inflight.set(key, promise)
  return promise
}

export function useSanity<T>(query: string, params: Record<string, unknown> = {}) {
  const key = cacheKey(query, params)

  // Initialise from cache synchronously so cached data renders on first paint
  // with no loading flash.
  const [data, setData] = useState<T | null>(() => (cache.has(key) ? (cache.get(key) as T) : null))
  const [loading, setLoading] = useState<boolean>(() => !cache.has(key))
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    if (cache.has(key)) {
      setData(cache.get(key) as T)
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    fetchDeduped<T>(query, params)
      .then((result) => {
        if (!cancelled) {
          setData(result)
          setLoading(false)
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err)
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
    // key already encodes query + params; intentionally the sole dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return { data, loading, error }
}
