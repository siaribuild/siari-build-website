import {defineField, defineType} from 'sanity'

export const contactSubmission = defineType({
  name: 'contactSubmission',
  title: 'Contact Submissions',
  type: 'document',
  fields: [
    defineField({name: 'firstName', title: 'First Name', type: 'string'}),
    defineField({name: 'lastName', title: 'Last Name', type: 'string'}),
    defineField({name: 'email', title: 'Email', type: 'string'}),
    defineField({name: 'phone', title: 'Phone', type: 'string'}),
    defineField({name: 'projectType', title: 'Project Type', type: 'string'}),
    defineField({name: 'message', title: 'Message', type: 'text', rows: 4}),
    defineField({name: 'submittedAt', title: 'Submitted At', type: 'datetime'}),
  ],
  preview: {
    select: {
      firstName: 'firstName',
      lastName: 'lastName',
      submittedAt: 'submittedAt',
    },
    prepare({firstName, lastName, submittedAt}) {
      const name = [firstName, lastName].filter(Boolean).join(' ') || 'Unnamed'
      const when = submittedAt
        ? new Date(submittedAt).toLocaleString('en-AU', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'No date'
      return {
        title: when,
        subtitle: name,
      }
    },
  },
})
