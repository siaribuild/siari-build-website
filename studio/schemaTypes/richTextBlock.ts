import {defineField, defineType} from 'sanity'

// Standalone long-form text block for the page builder — for pages like
// Privacy Policy, Terms of Service, or any prose-heavy content. Reuses the
// shared `blockContent` type for the body so the allowed formatting stays
// consistent with project descriptions.
export const richTextBlock = defineType({
  name: 'richTextBlock',
  title: 'Rich Text',
  type: 'object',
  fields: [
    defineField({
      name: 'theme',
      title: 'Background Theme',
      type: 'string',
      options: {
        list: [
          {title: 'Light (white)', value: 'light'},
          {title: 'Gray (off-white)', value: 'gray'},
          {title: 'Dark (black)', value: 'dark'},
        ],
        layout: 'radio',
      },
      initialValue: 'light',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow Text',
      type: 'string',
      description: 'Optional small label above the heading',
    }),
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      description: 'Optional section heading',
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'blockContent',
      description: 'Long-form content — headings, paragraphs, lists, links',
    }),
  ],
  preview: {
    select: {title: 'heading'},
    prepare({title}) {
      return {title: 'Rich Text', subtitle: title}
    },
  },
})
