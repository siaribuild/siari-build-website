import {defineField, defineType} from 'sanity'
import {BareField} from '../components/BareField'
import {orderRankField} from '@sanity/orderable-document-list'

export const project = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'details', title: 'Details'},
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
      initialValue: [
        {_type: 'block', _key: 'tplOverviewH', style: 'h2', markDefs: [], children: [{_type: 'span', _key: 'tplOverviewHs', text: 'Overview', marks: []}]},
        {_type: 'block', _key: 'tplOverviewP', style: 'normal', markDefs: [], children: [{_type: 'span', _key: 'tplOverviewPs', text: '', marks: []}]},
        {_type: 'block', _key: 'tplChallengeH', style: 'h3', markDefs: [], children: [{_type: 'span', _key: 'tplChallengeHs', text: 'The Challenge', marks: []}]},
        {_type: 'block', _key: 'tplChallengeP', style: 'normal', markDefs: [], children: [{_type: 'span', _key: 'tplChallengePs', text: '', marks: []}]},
        {_type: 'block', _key: 'tplSolutionH', style: 'h3', markDefs: [], children: [{_type: 'span', _key: 'tplSolutionHs', text: 'Our Solution', marks: []}]},
        {_type: 'block', _key: 'tplSolutionP', style: 'normal', markDefs: [], children: [{_type: 'span', _key: 'tplSolutionPs', text: '', marks: []}]},
        {_type: 'block', _key: 'tplFeaturesH', style: 'h3', markDefs: [], children: [{_type: 'span', _key: 'tplFeaturesHs', text: 'Key Features', marks: []}]},
        {_type: 'block', _key: 'tplFeat1', style: 'normal', listItem: 'bullet', level: 1, markDefs: [], children: [{_type: 'span', _key: 'tplFeat1s', text: 'Item 1', marks: []}]},
        {_type: 'block', _key: 'tplFeat2', style: 'normal', listItem: 'bullet', level: 1, markDefs: [], children: [{_type: 'span', _key: 'tplFeat2s', text: 'Item 2', marks: []}]},
        {_type: 'block', _key: 'tplFeat3', style: 'normal', listItem: 'bullet', level: 1, markDefs: [], children: [{_type: 'span', _key: 'tplFeat3s', text: 'Item 3', marks: []}]},
      ],
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
      group: 'details',
      components: {field: BareField},
      fields: [
        defineField({name: 'year', title: 'Year', type: 'string', description: 'e.g. 2024'}),
        defineField({name: 'location', title: 'Location', type: 'string', description: 'e.g. Brighton, VIC'}),
        defineField({
          name: 'category',
          title: 'Category',
          type: 'reference',
          to: [{type: 'projectCategory'}],
          options: {disableNew: true},
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
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'string',
          description:
            'Describe the image for search engines and screen readers. Leave blank on purely decorative images.',
        }),
      ],
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
            defineField({
              name: 'alt',
              title: 'Alt text',
              type: 'string',
              description:
                'Describe the image for search engines and screen readers. Falls back to the caption, then to an auto-generated project description.',
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
