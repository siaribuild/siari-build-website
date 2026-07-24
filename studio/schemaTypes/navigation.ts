import {defineField, defineType, defineArrayMember} from 'sanity'

const menuItem = defineArrayMember({
  type: 'object',
  name: 'menuItem',
  fields: [
    defineField({
      name: 'page',
      title: 'Page',
      type: 'reference',
      to: [{type: 'page'}],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'label',
      title: 'Label Override',
      type: 'string',
      description: 'Optional — overrides the page title for this menu only. Leave blank to use the page title.',
    }),
  ],
  preview: {
    select: {
      pageTitle: 'page.title',
      label: 'label',
    },
    prepare({pageTitle, label}) {
      return {
        title: label || pageTitle || 'Untitled',
        subtitle: label ? `→ ${pageTitle}` : undefined,
      }
    },
  },
})

const socialItem = defineArrayMember({
  type: 'object',
  name: 'socialItem',
  fields: [
    defineField({
      name: 'label',
      title: 'Platform Name',
      type: 'string',
      description: 'e.g. Instagram, Facebook, Houzz',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'icon',
      title: 'Icon',
      type: 'image',
      description: 'Optional — upload an SVG or PNG icon. If left blank, only the platform name is shown.',
    }),
    defineField({
      name: 'hideFromMenu',
      title: 'Hide from Follow menu',
      type: 'boolean',
      initialValue: false,
      description:
        'Leave off for normal social links. Turn on to keep the profile out of the site’s Follow menu while still using it for SEO (it stays in the site’s sameAs structured data) — e.g. a Google Business Profile.',
    }),
  ],
  preview: {
    select: {title: 'label', subtitle: 'url', media: 'icon', hideFromMenu: 'hideFromMenu'},
    prepare({title, subtitle, media, hideFromMenu}) {
      return {
        // Flag the SEO-only items so the hidden state is obvious in the list.
        title: hideFromMenu === true ? `${title} (SEO only)` : title,
        subtitle,
        media,
      }
    },
  },
})

export const navigation = defineType({
  name: 'navigation',
  title: 'Navigation',
  type: 'document',
  groups: [
    {name: 'headerMenu', title: 'Header Menu', default: true},
    {name: 'footerMenu', title: 'Footer Menu'},
    {name: 'socialLinks', title: 'Social Links'},
  ],
  fields: [
    defineField({
      name: 'headerMenu',
      title: ' ',
      type: 'array',
      description: 'Drag to reorder. If "Enable Header CTA Button" is on, the LAST item here is styled as the call-to-action button.',
      of: [menuItem],
      group: 'headerMenu',
    }),
    defineField({
      name: 'headerCtaEnabled',
      title: 'Enable Header CTA Button',
      type: 'boolean',
      description: 'When on, the last item in the Header Menu above is displayed as a solid button instead of a plain link.',
      initialValue: true,
      group: 'headerMenu',
    }),
    defineField({
      name: 'footerMenu',
      title: ' ',
      type: 'array',
      description: 'Drag to reorder.',
      of: [menuItem],
      group: 'footerMenu',
    }),
    defineField({
      name: 'socialMenu',
      title: ' ',
      type: 'array',
      description: 'Drag to reorder.',
      of: [socialItem],
      group: 'socialLinks',
    }),
  ],
  preview: {
    prepare() {
      return {title: 'Navigation'}
    },
  },
})
