import {defineType, defineField} from 'sanity'

// A single reusable link. Editors pick EITHER an existing page/project (via the
// reference picker) OR type an external URL — the irrelevant field hides itself.
// Internal links store a reference (not a path), so they survive slug changes
// and can't point at a page that doesn't exist. The destination URL is resolved
// at query/render time from the referenced document's type + slug.
//
// Used both as a standalone field (buttons / CTAs) and as a Portable Text
// annotation (inline hyperlinks). It is intentionally href-only — the visible
// label lives outside (a button's own label, or the selected rich-text).
export const link = defineType({
  name: 'link',
  title: 'Link',
  type: 'object',
  fields: [
    defineField({
      name: 'kind',
      title: 'Link to',
      type: 'string',
      options: {
        list: [
          {title: 'Page or project', value: 'internal'},
          {title: 'External URL', value: 'external'},
        ],
        layout: 'radio',
      },
      initialValue: 'internal',
    }),
    defineField({
      name: 'internal',
      title: 'Page or project',
      type: 'reference',
      to: [{type: 'page'}, {type: 'project'}],
      options: {disableNew: true},
      hidden: ({parent}) => parent?.kind === 'external',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const kind = (context.parent as any)?.kind
          if (kind !== 'external' && !value) return 'Select a page or project'
          return true
        }),
    }),
    defineField({
      name: 'href',
      title: 'External URL',
      type: 'url',
      description: 'Full URL, including https:// (also accepts mailto: and tel:).',
      hidden: ({parent}) => parent?.kind !== 'external',
      validation: (Rule) =>
        Rule.uri({scheme: ['http', 'https', 'mailto', 'tel']}).custom((value, context) => {
          const kind = (context.parent as any)?.kind
          if (kind === 'external' && !value) return 'Enter a URL'
          return true
        }),
    }),
    defineField({
      name: 'newTab',
      title: 'Open in a new tab',
      type: 'boolean',
      initialValue: false,
    }),
  ],
})
