import {defineField, defineType, defineArrayMember} from 'sanity'
import {orderRankField, orderRankOrdering} from '@sanity/orderable-document-list'

// All available block types for the page builder
const pageBuilderBlocks = [
  defineArrayMember({type: 'heroHome'}),
  defineArrayMember({type: 'heroInner'}),
  defineArrayMember({type: 'featuredProjects'}),
  defineArrayMember({type: 'projectsGrid'}),
  defineArrayMember({type: 'cardGrid2'}),
  defineArrayMember({type: 'cardGrid3'}),
  defineArrayMember({type: 'cardGrid4'}),
  defineArrayMember({type: 'textImage'}),
  defineArrayMember({type: 'textImageStats2'}),
  defineArrayMember({type: 'textImageStats3'}),
  defineArrayMember({type: 'statsRow'}),
  defineArrayMember({type: 'ourStory'}),
  defineArrayMember({type: 'testimonialsBlock'}),
  defineArrayMember({type: 'ctaBlock'}),
  defineArrayMember({type: 'contactFormBlock'}),
  defineArrayMember({type: 'mapBlock'}),
  defineArrayMember({type: 'richTextBlock'}),
]

export const page = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  orderings: [orderRankOrdering],
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    orderRankField({type: 'page'}),
    defineField({
      name: 'title',
      title: 'Page Title',
      type: 'string',
      description: 'Internal name — shown in the Studio sidebar e.g. "Home", "About", "Contact"',
      validation: (Rule) => Rule.required(),
      group: 'content',
    }),
    defineField({
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      options: {source: 'title'},
      description: 'The URL path for this page e.g. /about → slug is "about". Use "home" for the homepage.',
      validation: (Rule) => Rule.required(),
      group: 'content',
    }),
    defineField({
      name: 'sections',
      title: 'Page Sections',
      type: 'array',
      description: 'Add, remove and reorder blocks to build this page',
      of: pageBuilderBlocks,
      group: 'content',
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seoMetaFields',
      group: 'seo',
    }),
  ],
  preview: {
    select: {title: 'title', subtitle: 'slug.current'},
    prepare({title, subtitle}) {
      return {title, subtitle: `/${subtitle}`}
    },
  },
})
