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
      name: 'link',
      title: 'Link',
      type: 'reference',
      to: [{type: 'page'}, {type: 'project'}],
      options: {disableNew: true},
      description: 'Links to a page or project — its title is shown as the label under the name',
    }),
  ],
  preview: {
    select: {title: 'clientName', subtitle: 'quote'},
  },
})
