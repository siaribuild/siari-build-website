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
      name: 'projectReference',
      title: 'Project Reference',
      type: 'string',
      description: 'e.g. Brighton Residence — shown as a label under the name',
    }),
    defineField({
      name: 'project',
      title: 'Link to Project',
      type: 'reference',
      to: [{type: 'project'}],
      description: 'Optional — links the testimonial label to the actual project page',
    }),
  ],
  preview: {
    select: {title: 'clientName', subtitle: 'projectReference'},
  },
})
