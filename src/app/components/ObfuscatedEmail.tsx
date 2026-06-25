import { useState } from 'react'

interface Props {
  email: string
  className?: string
}

// Spam-resistant email rendering.
//
// Weak approaches put the full address in a `mailto:` href and as plain text,
// which any scraper (even ones that don't run JS) can grab by regexing for
// "mailto:". This component avoids both:
//
//  - No `mailto:` href is present in the DOM. The address is assembled and the
//    mail client opened only when the user actually clicks.
//  - The visible text is split into fragments (user / @ / domain) rendered as
//    separate nodes, so there's no single contiguous email literal to match.
//
// Honest limitation: if an address is visibly readable on screen, a scraper
// that fully executes JavaScript and reads textContent can still reconstruct
// it. No client-side technique fully prevents that. This defeats the common,
// lazy scrapers (the vast majority) without harming real users.
export function ObfuscatedEmail({ email, className }: Props) {
  const [user, domain] = email.split('@')
  const [hovered, setHovered] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    // Assemble only at click time — never stored as a contiguous href.
    window.location.href = `mailto:${user}@${domain}`
  }

  return (
    <a
      href="#"
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={className}
      aria-label="Email us"
      rel="nofollow"
    >
      <span>{user}</span>
      <span aria-hidden="true">{'\u0040'}</span>
      <span>{domain}</span>
    </a>
  )
}
