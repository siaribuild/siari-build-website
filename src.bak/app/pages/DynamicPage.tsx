import { useSanity } from '../hooks/useSanity'
import { PAGE_QUERY } from '../lib/queries'
import { PageBuilder } from '../components/blocks/PageBuilder'
import { Seo } from '../components/Seo'
import { NotFoundPage } from './NotFoundPage'

interface Props {
  slug: string
}

export function DynamicPage({ slug }: Props) {
  const { data: page, loading, error } = useSanity<any>(PAGE_QUERY, { slug })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center opacity-40">
          <div className="w-8 h-8 border-2 border-[#B8946A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm tracking-wider uppercase">Loading</p>
        </div>
      </div>
    )
  }

  // If a known route's page document is missing/unpublished, show the
  // branded 404 rather than a bare inline message.
  if (error || !page) {
    return <NotFoundPage />
  }

  const path = slug === 'home' ? '' : `/${slug}`

  return (
    <>
      <Seo seo={page.seo} fallbackTitle={page.title} path={path} />
      <PageBuilder sections={page.sections} />
    </>
  )
}
