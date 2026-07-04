import type { MetaArgs } from 'react-router'
import { buildMeta } from '../lib/meta'
import { NotFoundPage } from '../pages/NotFoundPage'

export function meta({ matches }: MetaArgs) {
  return buildMeta({
    pageSeo: { nofollowAttributes: true },
    fallbackTitle: 'Page Not Found',
    path: '/404',
    matches,
  })
}

export default function NotFound() {
  return <NotFoundPage />
}
