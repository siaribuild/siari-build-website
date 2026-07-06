import { useRouteLoaderData } from 'react-router'
import type { SITE_SETTINGS_QUERY_RESULT, NAVIGATION_QUERY_RESULT } from './sanity.types'

// Read the root route's build-time data (site settings + navigation) from any
// component. Replaces the per-component useSanity(SITE_SETTINGS/NAVIGATION)
// calls in Header/Footer/NotFound so that global data is baked, not re-fetched.
export function useRootData() {
  return (
    (useRouteLoaderData('root') as
      | { settings?: SITE_SETTINGS_QUERY_RESULT; navigation?: NAVIGATION_QUERY_RESULT }
      | undefined) ?? {}
  )
}
