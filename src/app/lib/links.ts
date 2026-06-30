// Resolves a Sanity `link` object into a usable href.
// Internal links carry the referenced document's type + slug (dereferenced in
// GROQ); the URL is built here so route patterns live in one place and slug
// changes are picked up automatically.

export interface SanityLinkTarget {
  _type?: string
  slug?: string | null
}

export interface SanityLink {
  kind?: 'internal' | 'external'
  href?: string | null
  newTab?: boolean
  internal?: SanityLinkTarget | null
}

export interface ResolvedLink {
  href: string
  external: boolean
  newTab: boolean
}

// Mirrors the routes in App.tsx:
//   page  "home"  -> "/"
//   page  <slug>  -> "/<slug>"   (about, contact, projects, …)
//   project <slug> -> "/projects/<slug>"
export function resolveHref(link?: SanityLink | null): ResolvedLink | null {
  if (!link) return null

  if (link.kind === 'external') {
    if (!link.href) return null
    return {href: link.href, external: true, newTab: !!link.newTab}
  }

  // internal (default)
  const target = link.internal
  if (!target || !target.slug) return null

  let href: string
  if (target._type === 'project') {
    href = `/projects/${target.slug}`
  } else {
    href = target.slug === 'home' ? '/' : `/${target.slug}`
  }
  return {href, external: false, newTab: false}
}
