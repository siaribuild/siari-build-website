import {defineField} from 'sanity'

// Single source of truth for the "Heading" field so the editing experience is
// identical on every block: a 2-row text input where the editor presses Enter
// to force a line break. The site renders those breaks as <br> via
// renderMultiline(). Pass `required` and/or an extra `description` per block;
// the line-break hint is always appended so the guidance is consistent too.
export const headingField = (opts: {required?: boolean; description?: string} = {}) =>
  defineField({
    name: 'heading',
    title: 'Heading',
    type: 'text',
    rows: 2,
    description: [opts.description, 'Press Enter to force a line break.']
      .filter(Boolean)
      .join(' '),
    ...(opts.required ? {validation: (Rule: any) => Rule.required()} : {}),
  })
