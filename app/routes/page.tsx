import { useLoaderData } from 'react-router'
import type { LoaderFunctionArgs, MetaArgs } from 'react-router'
import { client } from '../lib/sanity'
import { PAGE_QUERY } from '../lib/queries'
import { loadBlockData } from '../lib/block-data'
import { buildMeta, heroImageOf, faqItemsOf } from '../lib/meta'
import { DynamicPage } from '../pages/DynamicPage'
import { NotFoundPage } from '../pages/NotFoundPage'

// Any Sanity page by slug. Prerendered for every existing slug (see
// react-router.config.ts). Unknown slugs fall through to the SPA fallback and
// render the branded 404 below.
export async function loader({ params }: LoaderFunctionArgs) {
  if (__MAINTENANCE__) return { page: null, blockData: {} }
  const page = await client.fetch(PAGE_QUERY, { slug: params.slug })
  const blockData = await loadBlockData(page)
  return { page, blockData }
}

// Under ssr:false the build-time `loader` only produced data for PRERENDERED
// paths. At runtime, any other path (a real 404, or a page published but not yet
// rebuilt) has no server data — without this, React Router throws a generic error
// and you get "Unexpected error" instead of the branded 404. clientLoader returns
// the baked data for real pages, and null (→ NotFoundPage) for everything else.
export async function clientLoader({ serverLoader }: { serverLoader: () => Promise<any> }) {
  try {
    return await serverLoader()
  } catch {
    return { page: null, blockData: {} }
  }
}

export function meta({ data, matches, params }: MetaArgs<typeof loader>) {
  return buildMeta({
    pageSeo: data?.page?.seo,
    fallbackTitle: data?.page?.title,
    path: `/${params.slug}`,
    preloadImage: heroImageOf(data?.page),
    faqItems: faqItemsOf(data?.page),
    matches,
  })
}

export default function Page() {
  const { page, blockData } = useLoaderData<typeof loader>()
  if (!page) return <NotFoundPage />
  return <DynamicPage page={page} blockData={blockData} />
}
