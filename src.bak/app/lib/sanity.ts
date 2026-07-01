import { createClient } from '@sanity/client'

// API version is pinned. If the env var is missing we fall back to a known
// date rather than letting the client default silently, which keeps query
// behaviour deterministic across environments.
const apiVersion = import.meta.env.VITE_SANITY_API_VERSION || '2025-06-18'

export const client = createClient({
  projectId: import.meta.env.VITE_SANITY_PROJECT_ID,
  dataset: import.meta.env.VITE_SANITY_DATASET,
  apiVersion,
  // useCdn: true serves cached, edge-delivered responses — appropriate for a
  // public read-only site and significantly faster/cheaper than the live API.
  useCdn: true,
  perspective: 'published',
})
