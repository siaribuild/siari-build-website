import {defineField, defineType} from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  groups: [
    {name: 'general', title: 'General', default: true},
    {name: 'maintenance', title: 'Maintenance Mode'},
    {name: 'maintenancePage', title: 'Maintenance Page'},
    {name: 'errorPage', title: 'Error Page'},
    {name: 'maps', title: 'Google Maps'},
  ],
  fields: [
    // ── General ──
    defineField({name: 'siteName', title: 'Business Name', type: 'string', group: 'general'}),
    defineField({name: 'tagline', title: 'Tagline', type: 'string', group: 'general'}),
    defineField({name: 'phone', title: 'Phone', type: 'string', group: 'general'}),
    defineField({name: 'email', title: 'Email', type: 'string', group: 'general'}),
    defineField({name: 'address', title: 'Address', type: 'text', rows: 3, group: 'general'}),
    defineField({
      name: 'workingHours',
      title: 'Working Hours',
      type: 'text',
      description: 'e.g. Monday – Friday: 8:00 AM – 5:00 PM',
      group: 'general',
    }),
    // ── Footer bottom bar ──
    defineField({
      name: 'copyrightText',
      title: 'Copyright Text',
      type: 'string',
      group: 'general',
      description: 'Footer: shown after the year and business name, e.g. "All rights reserved." Year and business name are added automatically.',
    }),
    defineField({
      name: 'legalLine',
      title: 'Legal Line (ABN / Licence)',
      type: 'string',
      group: 'general',
      description: 'Footer small print at the very bottom, e.g. "ABN 12 345 678 901 | Builder License VIC 123456"',
    }),

    // ── Maintenance Mode (just the toggle) ──
    defineField({
      name: 'maintenanceEnabled',
      title: 'Enable Maintenance Mode',
      type: 'boolean',
      description: 'When ON, all visitors see the maintenance screen instead of the site. To preview the live site while this is on, append ?preview=true to any URL.',
      initialValue: false,
      group: 'maintenance',
    }),

    // ── Maintenance Page (the content) ──
    defineField({
      name: 'maintenanceHeading',
      title: 'Heading',
      type: 'string',
      initialValue: "WE'LL BE RIGHT BACK",
      group: 'maintenancePage',
    }),
    defineField({
      name: 'maintenanceMessage',
      title: 'Message',
      type: 'text',
      rows: 3,
      initialValue: "Our site is currently undergoing scheduled maintenance. We'll be back online shortly. For urgent enquiries, please get in touch by phone or email.",
      group: 'maintenancePage',
    }),
    defineField({
      name: 'maintenanceShowContact',
      title: 'Show Contact Details',
      type: 'boolean',
      description: 'Display phone and email (from the General tab) on the maintenance screen',
      initialValue: true,
      group: 'maintenancePage',
    }),
    defineField({
      name: 'maintenanceImage',
      title: 'Background Image',
      type: 'image',
      options: {hotspot: true},
      description: 'Optional — a dark background image for the maintenance screen',
      group: 'maintenancePage',
    }),

    // ── Error Page (404) ──
    defineField({
      name: 'notFoundHeading',
      title: 'Heading',
      type: 'string',
      initialValue: 'PAGE NOT FOUND',
      group: 'errorPage',
    }),
    defineField({
      name: 'notFoundMessage',
      title: 'Message',
      type: 'text',
      rows: 2,
      initialValue: "The page you're looking for doesn't exist or has been moved.",
      group: 'errorPage',
    }),
    defineField({
      name: 'notFoundButtonLabel',
      title: 'Button Label',
      type: 'string',
      description: 'Button always links back to the homepage',
      initialValue: 'Back to Home',
      group: 'errorPage',
    }),
    defineField({
      name: 'notFoundImage',
      title: 'Background Image',
      type: 'image',
      options: {hotspot: true},
      description: 'Optional — a dark background image for the error page',
      group: 'errorPage',
    }),
    // ── Google Maps ──
    defineField({
      name: 'mapLocation',
      title: 'Map Location (Pin)',
      type: 'geopoint',
      group: 'maps',
      description: 'The point the map centres on and drops a pin at. Search or set the latitude/longitude.',
    }),
    defineField({
      name: 'mapZoom',
      title: 'Zoom Level',
      type: 'number',
      group: 'maps',
      initialValue: 15,
      description: 'How close in the map sits. ~12 = suburb, ~15 = street, ~17 = building.',
      validation: (Rule) => Rule.min(1).max(20),
    }),
    defineField({
      name: 'mapAddressLabel',
      title: 'Marker Label / Directions Address',
      type: 'string',
      group: 'maps',
      description: 'Optional. Shown when the pin is clicked, and used for the "Get directions" link.',
    }),
  ],
  preview: {
    prepare() {
      return {title: 'Site Settings'}
    },
  },
})
