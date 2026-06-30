import {defineField, defineType} from 'sanity'

export const testimonial = defineType({
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  fields: [
    defineField({
      name: 'quote',
      title: 'Quote',
      type: 'text',
      rows: 4,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'clientName',
      title: 'Client Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'linkText',
      title: 'Link Text',
      type: 'string',
      description: 'Label shown under the name — e.g. Brighton Residence',
    }),
    defineField({
      name: 'link',
      title: 'Link',
      type: 'link',
      description: 'Where the label points — typically the project page',
    }),
  ],
  preview: {
    select: {title: 'clientName', subtitle: 'linkText'},
  },
})
