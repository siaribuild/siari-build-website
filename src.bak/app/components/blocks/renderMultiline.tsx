import { Fragment } from 'react'

// Safely render a string that may contain newlines, converting each newline
// to a <br />. Replaces the previous dangerouslySetInnerHTML approach — no
// raw HTML injection, even though headings come from trusted CMS editors.
export function renderMultiline(text: string) {
  // Accept any of: a real newline (text-type fields / Enter key), a <br> tag,
  // or a literal backslash-n typed into a single-line string field.
  const lines = String(text ?? '')
    .split(/<br\s*\/?>|\r?\n|\\n/i)
    .map((line) => line.trim())
  return lines.map((line, i) => (
    <Fragment key={i}>
      {line}
      {i < lines.length - 1 && <br />}
    </Fragment>
  ))
}
