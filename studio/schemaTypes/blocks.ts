import {defineField, defineType, defineArrayMember} from 'sanity'
import {headingField} from './headingField'

// ─────────────────────────────────────────────
// Shared theme field (reused across all blocks)
// ─────────────────────────────────────────────
const themeField = defineField({
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
})

// ─────────────────────────────────────────────
// HERO — HOME PAGE
// Full screen height, left aligned, 2 CTA buttons
// ─────────────────────────────────────────────
export const heroHome = defineType({
  name: 'heroHome',
  title: 'Hero — Home Page',
  type: 'object',
  fields: [
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow Text',
      type: 'string',
      description: 'Small label above the heading e.g. "SIARI BUILD"',
    }),
    headingField({required: true, description: 'Main large heading, e.g. "BUILT WITH PRECISION."'}),
    defineField({
      name: 'subheading',
      title: 'Subheading',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'backgroundImage',
      title: 'Background Image',
      type: 'image',
      options: {hotspot: true},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'primaryButtonLabel',
      title: 'Primary Button Label',
      type: 'string',
      description: 'e.g. "Start Your Project"',
    }),
    defineField({
      name: 'primaryButtonLink',
      title: 'Primary Button Link',
      type: 'string',
      description: 'e.g. /contact or #contact',
    }),
    defineField({
      name: 'secondaryButtonLabel',
      title: 'Secondary Button Label',
      type: 'string',
      description: 'e.g. "View Projects"',
    }),
    defineField({
      name: 'secondaryButtonLink',
      title: 'Secondary Button Link',
      type: 'string',
      description: 'e.g. /projects',
    }),
  ],
  preview: {
    select: {title: 'heading'},
    prepare({title}) {
      return {title: 'Hero — Home', subtitle: title}
    },
  },
})

// ─────────────────────────────────────────────
// HERO — INNER PAGES
// Always dark, two height options, centered, no buttons
// ─────────────────────────────────────────────
export const heroInner = defineType({
  name: 'heroInner',
  title: 'Hero — Inner Page',
  type: 'object',
  fields: [
    defineField({
      name: 'height',
      title: 'Height',
      type: 'string',
      options: {
        list: [
          {title: 'Half screen (40vh)', value: 'half'},
          {title: 'Compact (30vh)', value: 'compact'},
        ],
        layout: 'radio',
      },
      initialValue: 'half',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow Text',
      type: 'string',
      description: 'Small label above the heading e.g. "About Us"',
    }),
    headingField({required: true}),
    defineField({
      name: 'subheading',
      title: 'Subheading',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'backgroundImage',
      title: 'Background Image',
      type: 'image',
      options: {hotspot: true},
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {title: 'heading'},
    prepare({title}) {
      return {title: 'Hero — Inner Page', subtitle: title}
    },
  },
})

// ─────────────────────────────────────────────
// FEATURED PROJECTS
// Pulls up to 3 featured projects automatically
// ─────────────────────────────────────────────
export const featuredProjects = defineType({
  name: 'featuredProjects',
  title: 'Featured Projects',
  type: 'object',
  fields: [
    themeField,
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow Text',
      type: 'string',
      description: 'e.g. "Portfolio"',
    }),
    headingField({description: 'e.g. "FEATURED PROJECTS"'}),
    defineField({
      name: 'ctaLabel',
      title: 'CTA Button Label',
      type: 'string',
      description: 'e.g. "View All Projects"',
    }),
    defineField({
      name: 'ctaLink',
      title: 'CTA Button Link',
      type: 'string',
      description: 'e.g. /projects',
    }),
  ],
  preview: {
    select: {title: 'heading'},
    prepare({title}) {
      return {title: 'Featured Projects', subtitle: title}
    },
  },
})

// ─────────────────────────────────────────────
// PROJECTS GRID
// Full project listing with category filter
// ─────────────────────────────────────────────
export const projectsGrid = defineType({
  name: 'projectsGrid',
  title: 'Projects Grid (with filter)',
  type: 'object',
  fields: [
    themeField,
  ],
  preview: {
    prepare() {
      return {title: 'Projects Grid', subtitle: 'All projects with category filter'}
    },
  },
})

// ─────────────────────────────────────────────
// CARD GRID — 2 COLUMNS
// ─────────────────────────────────────────────
export const cardGrid2 = defineType({
  name: 'cardGrid2',
  title: 'Card Grid — 2 Columns',
  type: 'object',
  fields: [
    themeField,
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow Text',
      type: 'string',
    }),
    headingField(),
    defineField({
      name: 'cards',
      title: 'Cards',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'icon',
              title: 'Icon',
              type: 'image',
              description: 'Upload an SVG or PNG icon',
            }),
            defineField({name: 'title', title: 'Title', type: 'string'}),
            defineField({name: 'text', title: 'Text', type: 'text', rows: 3}),
          ],
          preview: {select: {title: 'title'}},
        }),
      ],
    }),
  ],
  preview: {
    select: {title: 'heading'},
    prepare({title}) {
      return {title: 'Card Grid — 2 Col', subtitle: title}
    },
  },
})

// ─────────────────────────────────────────────
// CARD GRID — 3 COLUMNS
// ─────────────────────────────────────────────
export const cardGrid3 = defineType({
  name: 'cardGrid3',
  title: 'Card Grid — 3 Columns',
  type: 'object',
  fields: [
    themeField,
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow Text',
      type: 'string',
    }),
    headingField(),
    defineField({
      name: 'cards',
      title: 'Cards',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'icon',
              title: 'Icon',
              type: 'image',
              description: 'Upload an SVG or PNG icon',
            }),
            defineField({name: 'title', title: 'Title', type: 'string'}),
            defineField({name: 'text', title: 'Text', type: 'text', rows: 3}),
          ],
          preview: {select: {title: 'title'}},
        }),
      ],
    }),
  ],
  preview: {
    select: {title: 'heading'},
    prepare({title}) {
      return {title: 'Card Grid — 3 Col', subtitle: title}
    },
  },
})

// ─────────────────────────────────────────────
// CARD GRID — 4 COLUMNS
// ─────────────────────────────────────────────
export const cardGrid4 = defineType({
  name: 'cardGrid4',
  title: 'Card Grid — 4 Columns',
  type: 'object',
  fields: [
    themeField,
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow Text',
      type: 'string',
    }),
    headingField(),
    defineField({
      name: 'cards',
      title: 'Cards',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'icon',
              title: 'Icon',
              type: 'image',
              description: 'Upload an SVG or PNG icon',
            }),
            defineField({name: 'title', title: 'Title', type: 'string'}),
            defineField({name: 'text', title: 'Text', type: 'text', rows: 3}),
          ],
          preview: {select: {title: 'title'}},
        }),
      ],
    }),
  ],
  preview: {
    select: {title: 'heading'},
    prepare({title}) {
      return {title: 'Card Grid — 4 Col', subtitle: title}
    },
  },
})

// ─────────────────────────────────────────────
// TEXT + IMAGE
// Image left or right, no stats, optional CTA
// ─────────────────────────────────────────────
export const textImage = defineType({
  name: 'textImage',
  title: 'Text + Image',
  type: 'object',
  fields: [
    themeField,
    defineField({
      name: 'imagePosition',
      title: 'Image Position',
      type: 'string',
      options: {
        list: [
          {title: 'Left', value: 'left'},
          {title: 'Right', value: 'right'},
        ],
        layout: 'radio',
      },
      initialValue: 'left',
    }),
    defineField({name: 'image', title: 'Image', type: 'image', options: {hotspot: true}, validation: (Rule) => Rule.required()}),
    defineField({name: 'eyebrow', title: 'Eyebrow Text', type: 'string'}),
    headingField(),
    defineField({name: 'text', title: 'Text', type: 'blockContent'}),
    defineField({name: 'ctaLabel', title: 'Button Label', type: 'string'}),
    defineField({name: 'ctaLink', title: 'Button Link', type: 'string'}),
  ],
  preview: {
    select: {title: 'heading'},
    prepare({title}) {
      return {title: 'Text + Image', subtitle: title}
    },
  },
})

// ─────────────────────────────────────────────
// TEXT + IMAGE + 2 STATS
// ─────────────────────────────────────────────
export const textImageStats2 = defineType({
  name: 'textImageStats2',
  title: 'Text + Image + 2 Stats',
  type: 'object',
  fields: [
    themeField,
    defineField({
      name: 'imagePosition',
      title: 'Image Position',
      type: 'string',
      options: {
        list: [
          {title: 'Left', value: 'left'},
          {title: 'Right', value: 'right'},
        ],
        layout: 'radio',
      },
      initialValue: 'left',
    }),
    defineField({name: 'image', title: 'Image', type: 'image', options: {hotspot: true}, validation: (Rule) => Rule.required()}),
    defineField({name: 'eyebrow', title: 'Eyebrow Text', type: 'string'}),
    headingField(),
    defineField({name: 'text', title: 'Text', type: 'blockContent'}),
    defineField({
      name: 'stats',
      title: 'Stats (2)',
      type: 'array',
      validation: (Rule) => Rule.max(2).min(2),
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'value', title: 'Value', type: 'string', description: 'e.g. 15+'}),
            defineField({name: 'label', title: 'Label', type: 'string', description: 'e.g. Years'}),
          ],
          preview: {select: {title: 'value', subtitle: 'label'}},
        }),
      ],
    }),
    defineField({name: 'ctaLabel', title: 'Button Label', type: 'string'}),
    defineField({name: 'ctaLink', title: 'Button Link', type: 'string'}),
  ],
  preview: {
    select: {title: 'heading'},
    prepare({title}) {
      return {title: 'Text + Image + 2 Stats', subtitle: title}
    },
  },
})

// ─────────────────────────────────────────────
// TEXT + IMAGE + 3 STATS
// ─────────────────────────────────────────────
export const textImageStats3 = defineType({
  name: 'textImageStats3',
  title: 'Text + Image + 3 Stats',
  type: 'object',
  fields: [
    themeField,
    defineField({
      name: 'imagePosition',
      title: 'Image Position',
      type: 'string',
      options: {
        list: [
          {title: 'Left', value: 'left'},
          {title: 'Right', value: 'right'},
        ],
        layout: 'radio',
      },
      initialValue: 'left',
    }),
    defineField({name: 'image', title: 'Image', type: 'image', options: {hotspot: true}, validation: (Rule) => Rule.required()}),
    defineField({name: 'eyebrow', title: 'Eyebrow Text', type: 'string'}),
    headingField(),
    defineField({name: 'text', title: 'Text', type: 'blockContent'}),
    defineField({
      name: 'stats',
      title: 'Stats (3)',
      type: 'array',
      validation: (Rule) => Rule.max(3).min(3),
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'value', title: 'Value', type: 'string', description: 'e.g. 200+'}),
            defineField({name: 'label', title: 'Label', type: 'string', description: 'e.g. Projects'}),
          ],
          preview: {select: {title: 'value', subtitle: 'label'}},
        }),
      ],
    }),
    defineField({name: 'ctaLabel', title: 'Button Label', type: 'string'}),
    defineField({name: 'ctaLink', title: 'Button Link', type: 'string'}),
  ],
  preview: {
    select: {title: 'heading'},
    prepare({title}) {
      return {title: 'Text + Image + 3 Stats', subtitle: title}
    },
  },
})

// ─────────────────────────────────────────────
// STATS ROW
// Standalone full-width row of stat cards
// ─────────────────────────────────────────────
export const statsRow = defineType({
  name: 'statsRow',
  title: 'Stats Row',
  type: 'object',
  fields: [
    themeField,
    defineField({
      name: 'stats',
      title: 'Stats',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'value', title: 'Value', type: 'string', description: 'e.g. 15+'}),
            defineField({name: 'label', title: 'Label', type: 'string', description: 'e.g. Years Experience'}),
          ],
          preview: {select: {title: 'value', subtitle: 'label'}},
        }),
      ],
    }),
  ],
  preview: {
    prepare() {
      return {title: 'Stats Row'}
    },
  },
})

// ─────────────────────────────────────────────
// OUR STORY
// Two columns: text left, stat cards right
// ─────────────────────────────────────────────
export const ourStory = defineType({
  name: 'ourStory',
  title: 'Our Story',
  type: 'object',
  fields: [
    themeField,
    defineField({name: 'eyebrow', title: 'Eyebrow Text', type: 'string'}),
    headingField(),
    defineField({name: 'text', title: 'Text', type: 'blockContent'}),
    defineField({
      name: 'stats',
      title: 'Stat Cards',
      type: 'array',
      description: 'Shown in the right column — typically 4 cards',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'value', title: 'Value', type: 'string', description: 'e.g. 15+'}),
            defineField({name: 'label', title: 'Label', type: 'string', description: 'e.g. Years Experience'}),
          ],
          preview: {select: {title: 'value', subtitle: 'label'}},
        }),
      ],
    }),
  ],
  preview: {
    select: {title: 'heading'},
    prepare({title}) {
      return {title: 'Our Story', subtitle: title}
    },
  },
})

// ─────────────────────────────────────────────
// TESTIMONIALS
// Title + header + manually selected testimonial cards
// ─────────────────────────────────────────────
export const testimonialsBlock = defineType({
  name: 'testimonialsBlock',
  title: 'Testimonials',
  type: 'object',
  fields: [
    themeField,
    defineField({name: 'eyebrow', title: 'Eyebrow Text', type: 'string'}),
    headingField(),
    defineField({
      name: 'testimonials',
      title: 'Testimonials',
      type: 'array',
      description: 'Select which testimonials to display on this page',
      of: [defineArrayMember({type: 'reference', to: [{type: 'testimonial'}]})],
    }),
  ],
  preview: {
    select: {title: 'heading'},
    prepare({title}) {
      return {title: 'Testimonials', subtitle: title}
    },
  },
})

// ─────────────────────────────────────────────
// CTA BLOCK
// "Ready to start your project?" section
// ─────────────────────────────────────────────
export const ctaBlock = defineType({
  name: 'ctaBlock',
  title: 'CTA Block',
  type: 'object',
  fields: [
    themeField,
    defineField({name: 'eyebrow', title: 'Eyebrow Text', type: 'string'}),
    headingField({description: 'e.g. "READY TO START YOUR PROJECT?"'}),
    defineField({name: 'body', title: 'Body Text', type: 'text', rows: 2}),
    defineField({name: 'buttonLabel', title: 'Button Label', type: 'string', description: 'e.g. "Get In Touch"'}),
    defineField({name: 'buttonLink', title: 'Button Link', type: 'string', description: 'e.g. /contact'}),
  ],
  preview: {
    select: {title: 'heading'},
    prepare({title}) {
      return {title: 'CTA Block', subtitle: title}
    },
  },
})

// ─────────────────────────────────────────────
// CONTACT FORM BLOCK
// Form left, contact info right (info pulled from Site Settings)
// ─────────────────────────────────────────────
export const contactFormBlock = defineType({
  name: 'contactFormBlock',
  title: 'Contact Form',
  type: 'object',
  fields: [
    themeField,
    defineField({name: 'formHeading', title: 'Form Heading', type: 'string', description: 'e.g. "Send Us A Message"'}),
    defineField({name: 'infoHeading', title: 'Contact Info Heading', type: 'string', description: 'e.g. "Contact Info"'}),
  ],
  preview: {
    prepare() {
      return {title: 'Contact Form', subtitle: 'Form + contact info from Site Settings'}
    },
  },
})

// ─────────────────────────────────────────────
// MAP BLOCK
// Google Map — location, key, and styling come from Site Settings → Google Maps
// ─────────────────────────────────────────────
export const mapBlock = defineType({
  name: 'mapBlock',
  title: 'Google Map',
  type: 'object',
  fields: [
    defineField({
      name: 'height',
      title: 'Map Height',
      type: 'string',
      options: {
        list: [
          {title: 'Small (300px)', value: 'small'},
          {title: 'Medium (500px)', value: 'medium'},
          {title: 'Large (700px)', value: 'large'},
        ],
        layout: 'radio',
      },
      initialValue: 'medium',
    }),
  ],
  preview: {
    prepare() {
      return {title: 'Google Map', subtitle: 'Location & key from Site Settings → Google Maps'}
    },
  },
})
