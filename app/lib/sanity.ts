import { createClient } from '@sanity/client'

// Sanity query client. After the SSG migration this is used ONLY by build-time
// route loaders + block-data (server/build side) — no browser component imports
// it, so @sanity/client stays out of the client bundle. (Inline Portable Text
// images use the lightweight builder in app/lib/image-url.ts instead.)
const apiVersion = import.meta.env.VITE_SANITY_API_VERSION || '2025-06-18'

export const client = createClient({
  projectId: import.meta.env.VITE_SANITY_PROJECT_ID,
  dataset: import.meta.env.VITE_SANITY_DATASET,
  apiVersion,
  useCdn: true,
  perspective: 'published',
})
