import {defineField, defineType} from 'sanity'

export const systemPages = defineType({
  name: 'systemPages',
  title: 'System Pages',
  type: 'document',
  groups: [
    {name: 'notFound', title: '404 Page', default: true},
    {name: 'maintenance', title: 'Maintenance Mode'},
  ],
  fields: [
    // ── 404 ──
    defineField({
      name: 'notFoundHeading',
      title: 'Heading',
      type: 'string',
      description: 'e.g. PAGE NOT FOUND',
      initialValue: 'PAGE NOT FOUND',
      group: 'notFound',
    }),
    defineField({
      name: 'notFoundMessage',
      title: 'Message',
      type: 'text',
      rows: 2,
      description: 'Shown beneath the heading',
      initialValue: "The page you're looking for doesn't exist or has been moved.",
      group: 'notFound',
    }),
    defineField({
      name: 'notFoundButtonLabel',
      title: 'Button Label',
      type: 'string',
      description: 'Button always links back to the homepage',
      initialValue: 'Back to Home',
      group: 'notFound',
    }),
    defineField({
      name: 'notFoundImage',
      title: 'Background Image',
      type: 'image',
      options: {hotspot: true},
      description: 'Optional — a dark background image for the 404 page',
      group: 'notFound',
    }),

    // ── Maintenance ──
    defineField({
      name: 'maintenanceEnabled',
      title: 'Enable Maintenance Mode',
      type: 'boolean',
      description: 'When ON, all visitors see a maintenance screen instead of the site. See the note below about previewing the live site while this is on.',
      initialValue: false,
      group: 'maintenance',
    }),
    defineField({
      name: 'maintenanceHeading',
      title: 'Heading',
      type: 'string',
      initialValue: "WE'LL BE RIGHT BACK",
      group: 'maintenance',
    }),
    defineField({
      name: 'maintenanceMessage',
      title: 'Message',
      type: 'text',
      rows: 3,
      initialValue: "Our site is currently undergoing scheduled maintenance. We'll be back online shortly. For urgent enquiries, please get in touch by phone or email.",
      group: 'maintenance',
    }),
    defineField({
      name: 'maintenanceShowContact',
      title: 'Show Contact Details',
      type: 'boolean',
      description: 'Display phone and email (from Site Settings) on the maintenance screen',
      initialValue: true,
      group: 'maintenance',
    }),
    defineField({
      name: 'maintenanceImage',
      title: 'Background Image',
      type: 'image',
      options: {hotspot: true},
      description: 'Optional — a dark background image for the maintenance screen',
      group: 'maintenance',
    }),
  ],
  preview: {
    prepare() {
      return {title: 'System Pages'}
    },
  },
})
