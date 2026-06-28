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
          {title: 'Tall (70vh)', value: 'tall'},
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
const columnsField = defineField({
  name: 'columns',
  title: 'Columns',
  type: 'number',
  options: {list: [{title: '2', value: 2}, {title: '3', value: 3}, {title: '4', value: 4}], layout: 'radio'},
  initialValue: 3,
})

// ─────────────────────────────────────────────
// CARD GRID (IMAGE) — icon cards, 2/3/4 columns.
// Cards with body text render full; cards with only a title render compact.
// ─────────────────────────────────────────────
export const cardGrid = defineType({
  name: 'cardGrid',
  title: 'Card Grid (Image)',
  type: 'object',
  fields: [
    themeField,
    defineField({name: 'eyebrow', title: 'Eyebrow Text', type: 'string'}),
    headingField(),
    columnsField,
    defineField({
      name: 'cards',
      title: 'Cards',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'icon', title: 'Icon', type: 'image', description: 'Upload a single-colour SVG icon'}),
            defineField({name: 'title', title: 'Title', type: 'string'}),
            defineField({
              name: 'text',
              title: 'Text',
              type: 'text',
              rows: 3,
              description: 'Optional. Leave empty for a compact card (icon + title only).',
            }),
          ],
          preview: {select: {title: 'title'}},
        }),
      ],
    }),
  ],
  preview: {
    select: {title: 'heading'},
    prepare({title}) {
      return {title: 'Card Grid (Image)', subtitle: title}
    },
  },
})

// ─────────────────────────────────────────────
// CARD GRID (TEXT) — numbered/lettered cards (no icon), 2/3/4 columns.
// ─────────────────────────────────────────────
export const cardGridText = defineType({
  name: 'cardGridText',
  title: 'Card Grid (Text)',
  type: 'object',
  fields: [
    themeField,
    defineField({name: 'eyebrow', title: 'Eyebrow Text', type: 'string'}),
    headingField(),
    columnsField,
    defineField({
      name: 'cards',
      title: 'Cards',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              title: 'Label',
              type: 'string',
              description: 'Up to 3 characters, e.g. "01" or "A".',
              validation: (Rule) => Rule.max(3),
            }),
            defineField({name: 'title', title: 'Title', type: 'string'}),
            defineField({name: 'text', title: 'Text', type: 'text', rows: 3}),
          ],
          preview: {select: {title: 'title', subtitle: 'label'}},
        }),
      ],
    }),
  ],
  preview: {
    select: {title: 'heading'},
    prepare({title}) {
      return {title: 'Card Grid (Text)', subtitle: title}
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
    defineField({
      name: 'imageSize',
      title: 'Image Height',
      type: 'string',
      description: 'Starting height of the image. It stays responsive — this just sets how tall it sits on desktop.',
      options: {
        list: [
          {title: 'Tall', value: 'tall'},
          {title: 'Medium', value: 'medium'},
          {title: 'Short', value: 'short'},
        ],
        layout: 'radio',
      },
      initialValue: 'tall',
    }),
    defineField({name: 'eyebrow', title: 'Eyebrow Text', type: 'string'}),
    headingField(),
    defineField({name: 'text', title: 'Text', type: 'blockContent'}),
    defineField({
      name: 'stats',
      title: 'Stats',
      type: 'array',
      description: 'Optional. Up to 3 stat cards, shown in a single row inside the text column.',
      validation: (Rule) => Rule.max(3),
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
      return {title: 'Text + Image', subtitle: title}
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
