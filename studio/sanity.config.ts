import './studio.css'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {orderableDocumentListDeskItem} from '@sanity/orderable-document-list'
import {seoMetaFields} from 'sanity-plugin-seo'
import {schemaTypes} from './schemaTypes'
import {duplicateWithoutRank} from './actions/duplicateWithoutRank'

export default defineConfig({
  name: 'default',
  title: 'siari-build',

  projectId: 'f0yvhrzy',
  dataset: 'production',

  plugins: [
    structureTool({
      structure: (S, context) => {
        return S.list()
          .title('Content')
          .items([
            // Pages — drag-and-drop ordering (editing convenience only;
            // the frontend resolves pages by slug, not by this order)
            orderableDocumentListDeskItem({
              type: 'page',
              title: 'Pages',
              S,
              context,
            }),

            S.divider(),

            // Projects — drag-and-drop ordering (top 3 = featured on homepage)
            orderableDocumentListDeskItem({
              type: 'project',
              title: 'Projects',
              S,
              context,
            }),

            // Project Categories — drag-and-drop ordering
            orderableDocumentListDeskItem({
              type: 'projectCategory',
              title: 'Project Categories',
              S,
              context,
            }),

            S.divider(),

            S.listItem()
              .title('Testimonials')
              .child(
                S.documentTypeList('testimonial').title('Testimonials')
              ),

            S.divider(),

            S.listItem()
              .title('Site Settings')
              .child(
                S.document()
                  .schemaType('siteSettings')
                  .documentId('siteSettings')
              ),
            S.listItem()
              .title('Navigation')
              .child(
                S.document()
                  .schemaType('navigation')
                  .documentId('navigation')
              ),

          ])
      },
    }),
    seoMetaFields({
      dashboard: false,
    }),
  ],

  schema: {
    types: schemaTypes,
  },

  document: {
    // For orderable types, swap the default Duplicate for one that doesn't copy
    // the order value — see actions/duplicateWithoutRank.
    actions: (prev, {schemaType}) =>
      ['project', 'page', 'projectCategory'].includes(schemaType)
        ? prev.map((action) => (action.action === 'duplicate' ? duplicateWithoutRank : action))
        : prev,
  },
})
