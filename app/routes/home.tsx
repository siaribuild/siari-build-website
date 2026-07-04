import { useLoaderData } from 'react-router'
import type { MetaArgs } from 'react-router'
import { client } from '../lib/sanity'
import { PAGE_QUERY } from '../lib/queries'
import { loadBlockData } from '../lib/block-data'
import { buildMeta, heroImageOf } from '../lib/meta'
import { DynamicPage } from '../pages/DynamicPage'
import { NotFoundPage } from '../pages/NotFoundPage'

// Runs at BUILD TIME (ssr:false). Bakes the "home" page — including the hero
// <h1> that was the measured LCP element — plus the featured-projects
// collection its blocks need, into static HTML.
export async function loader() {
  // No page content during a maintenance build (root renders the maintenance
  // page instead of this route).
  if (__MAINTENANCE__) return { page: null, blockData: {} }
  const page = await client.fetch(PAGE_QUERY, { slug: 'home' })
  const blockData = await loadBlockData(page)
  return { page, blockData }
}

export function meta({ data, matches }: MetaArgs<typeof loader>) {
  return buildMeta({
    pageSeo: data?.page?.seo,
    fallbackTitle: data?.page?.title,
    path: '',
    organization: true, // GeneralContractor JSON-LD on the home page
    preloadImage: heroImageOf(data?.page),
    matches,
  })
}

export default function Home() {
  const { page, blockData } = useLoaderData<typeof loader>()
  if (!page) return <NotFoundPage />
  return <DynamicPage page={page} blockData={blockData} />
}
