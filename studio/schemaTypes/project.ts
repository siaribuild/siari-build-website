import {defineField, defineType} from 'sanity'
import {orderRankField} from '@sanity/orderable-document-list'

export const project = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    // orderRankField doesn't accept a group by default, so we spread it and
    // attach the content group — this prevents an "All fields" tab appearing.
    {...orderRankField({type: 'project'}), group: 'content'},

    // ── Core ──
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
      group: 'content',
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title'},
      description: 'Auto-generated from the title — used in the project URL',
      validation: (Rule) => Rule.required(),
      group: 'content',
    }),

    // ── Description ──
    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      description: 'Use heading styles for section titles, normal text for paragraphs, and bullet lists for key features',
      group: 'content',
      of: [
        {
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'Heading', value: 'h2'},
            {title: 'Subheading', value: 'h3'},
          ],
          lists: [
            {title: 'Bullet', value: 'bullet'},
          ],
          marks: {
            decorators: [
              {title: 'Strong', value: 'strong'},
              {title: 'Emphasis', value: 'em'},
            ],
          },
        },
      ],
    }),

    // ── Project Details ──
    defineField({
      name: 'details',
      title: 'Project Details',
      type: 'object',
      options: {collapsible: true, collapsed: false},
      group: 'content',
      fields: [
        defineField({name: 'year', title: 'Year', type: 'string', description: 'e.g. 2024'}),
        defineField({name: 'location', title: 'Location', type: 'string', description: 'e.g. Brighton, VIC'}),
        defineField({
          name: 'category',
          title: 'Category',
          type: 'reference',
          to: [{type: 'projectCategory'}],
        }),
        defineField({name: 'client', title: 'Client', type: 'string', description: 'e.g. Private Residence'}),
        defineField({name: 'duration', title: 'Duration', type: 'string', description: 'e.g. 14 months'}),
        defineField({name: 'size', title: 'Size', type: 'string', description: 'e.g. 380 sqm'}),
      ],
    }),

    // ── Hero Image ──
    defineField({
      name: 'heroImage',
      title: 'Hero Image',
      type: 'image',
      options: {hotspot: true},
      description: 'Main image — shown in project cards and at the top of the project page',
      validation: (Rule) => Rule.required(),
      group: 'content',
    }),

    // ── Gallery ──
    defineField({
      name: 'gallery',
      title: 'Gallery Images',
      type: 'array',
      description: 'Additional images shown in the lightbox gallery on the project page. Drag to reorder.',
      group: 'content',
      of: [
        {
          type: 'image',
          options: {hotspot: true},
          fields: [
            defineField({
              name: 'caption',
              title: 'Caption',
              type: 'string',
              description: 'Optional — shown below the image in the lightbox',
            }),
          ],
        },
      ],
    }),

    // ── SEO ──
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seoMetaFields',
      group: 'seo',
    }),
  ],

  orderings: [
    {
      title: 'Year (Newest First)',
      name: 'yearDesc',
      by: [{field: 'details.year', direction: 'desc'}],
    },
  ],

  preview: {
    select: {
      title: 'title',
      media: 'heroImage',
      subtitle: 'details.location',
    },
  },
})
