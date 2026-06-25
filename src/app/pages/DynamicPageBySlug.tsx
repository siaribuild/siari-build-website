import { useParams } from 'react-router-dom'
import { DynamicPage } from './DynamicPage'

// Thin wrapper: reads the :slug from the URL and hands it to DynamicPage.
// This lets ANY page created in Sanity resolve automatically by its slug —
// no per-page route needed. DynamicPage shows the branded 404 if no matching
// published page exists.
export function DynamicPageBySlug() {
  const { slug } = useParams<{ slug: string }>()
  return <DynamicPage slug={slug || 'home'} />
}
