import { PageBuilder } from '../components/blocks/PageBuilder'
import type { BlockData } from '../lib/block-data'

// Presentational. Page content + baked block collections both arrive from the
// route loader; SEO is emitted by the route's `meta` export.
export function DynamicPage({ page, blockData }: { page: any; blockData?: BlockData }) {
  return <PageBuilder sections={page.sections} blockData={blockData} />
}
