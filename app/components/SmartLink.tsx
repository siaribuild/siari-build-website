import { Link } from 'react-router'
import type { CSSProperties, ReactNode } from 'react'
import { resolveHref, type SanityLink } from '../lib/links'

interface Props {
  link?: SanityLink | null
  className?: string
  style?: CSSProperties
  children: ReactNode
}

// Renders nothing when the link is unset/incomplete, so a button with no
// destination simply doesn't appear (instead of a dead control).
export function SmartLink({ link, className, style, children }: Props) {
  const resolved = resolveHref(link)
  if (!resolved) return null

  const rel = resolved.newTab ? 'noopener noreferrer' : undefined
  const target = resolved.newTab ? '_blank' : undefined

  if (resolved.external) {
    return (
      <a href={resolved.href} className={className} style={style} target={target} rel={rel}>
        {children}
      </a>
    )
  }
  return (
    <Link to={resolved.href} className={className} style={style} target={target} rel={rel}>
      {children}
    </Link>
  )
}
