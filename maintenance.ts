import { createClient } from '@sanity/client'
import { config as loadEnv } from 'dotenv'

// ─────────────────────────────────────────────────────────────────────────────
// BUILD-TIME ONLY. Imported by react-router.config.ts and vite.config.ts, which
// load in plain Node before Vite populates import.meta.env — so this reads
// process.env (+ dotenv) rather than import.meta.env. It is NOT imported by any
// component, so it never enters the client bundle.
// ─────────────────────────────────────────────────────────────────────────────

// Load .env.local first (Vite precedence), then .env. dotenv does not override
// already-set vars, so .env.local wins — matching Vite's own resolution order.
loadEnv({ path: '.env.local' })
loadEnv()

export const buildClient = createClient({
  projectId: process.env.VITE_SANITY_PROJECT_ID,
  dataset: process.env.VITE_SANITY_DATASET,
  apiVersion: process.env.VITE_SANITY_API_VERSION || '2025-06-18',
  useCdn: true,
  perspective: 'published',
})

let cached: boolean | undefined

// Resolves, at BUILD TIME, whether this build should be a maintenance build:
//
//     maintenance  =  CMS flag is ON   AND   this is NOT the preview app
//
// The Cloudflare Access–protected preview app sets VITE_IGNORE_MAINTENANCE=true,
// so it always builds the full site even while production is in maintenance.
//
// FAIL CLOSED: only the exact string 'true' bypasses. Any other value — or the
// variable being absent — respects the maintenance flag. So a misconfiguration
// defaults to "show maintenance", never to "expose the site".
export async function isMaintenance(): Promise<boolean> {
  if (cached !== undefined) return cached

  if (process.env.VITE_IGNORE_MAINTENANCE === 'true') {
    cached = false
    return cached
  }

  try {
    const settings = await buildClient.fetch<{ maintenanceEnabled?: boolean }>(
      `*[_type == "siteSettings"][0]{ maintenanceEnabled }`,
    )
    cached = !!settings?.maintenanceEnabled
  } catch {
    // If the flag can't be read (e.g. Sanity unreachable), don't take the live
    // site down by accident. Note the full build fetches Sanity heavily anyway,
    // so a real outage fails the build rather than silently reaching here.
    cached = false
  }
  return cached
}
