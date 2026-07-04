import { useLoaderData } from 'react-router'
import type { LoaderFunctionArgs, MetaArgs } from 'react-router'
import { client } from '../lib/sanity'
import { PROJECT_QUERY, OTHER_PROJECTS_QUERY } from '../lib/queries'
import { buildMeta } from '../lib/meta'
import { ProjectDetailPage } from '../pages/ProjectDetailPage'
import { NotFoundPage } from '../pages/NotFoundPage'

export async function loader({ params }: LoaderFunctionArgs) {
  if (__MAINTENANCE__) return { project: null, otherProjects: [] }
  const [project, otherProjects] = await Promise.all([
    client.fetch(PROJECT_QUERY, { slug: params.projectId }),
    client.fetch<any[]>(OTHER_PROJECTS_QUERY, { slug: params.projectId }),
  ])
  return { project, otherProjects: otherProjects ?? [] }
}

export function meta({ data, matches }: MetaArgs<typeof loader>) {
  const p = data?.project
  return buildMeta({
    pageSeo: p?.seo,
    fallbackTitle: p?.title,
    fallbackDescription: p?.details?.location ? `${p.title} — ${p.details.location}` : p?.title,
    fallbackImage: p?.heroImage,
    path: p ? `/projects/${p.slug}` : '',
    preloadImage: p?.heroImage,
    matches,
  })
}

export default function Project() {
  const { project, otherProjects } = useLoaderData<typeof loader>()
  if (!project) return <NotFoundPage />
  return <ProjectDetailPage project={project} otherProjects={otherProjects} />
}
