import {defineField, defineType} from 'sanity'
import {orderRankField} from '@sanity/orderable-document-list'

export const projectCategory = defineType({
  name: 'projectCategory',
  title: 'Project Category',
  type: 'document',
  fields: [
    orderRankField({type: 'projectCategory'}),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'e.g. Custom Build, Renovation, Extension',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title'},
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {title: 'title'},
  },
})
