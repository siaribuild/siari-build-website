import { Fragment } from 'react'

// Safely render a string that may contain newlines, converting each newline
// to a <br />. Replaces the previous dangerouslySetInnerHTML approach — no
// raw HTML injection, even though headings come from trusted CMS editors.
export function renderMultiline(text: string) {
  const lines = text.split('\n')
  return lines.map((line, i) => (
    <Fragment key={i}>
      {line}
      {i < lines.length - 1 && <br />}
    </Fragment>
  ))
}
