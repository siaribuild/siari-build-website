import imageUrlBuilder from '@sanity/image-url'

// Browser-safe image URL builder. Uses @sanity/image-url with a plain project
// config so it does NOT import @sanity/client (the query/fetch infrastructure),
// keeping that out of the client bundle. Used by PortableText for inline images.
const builder = imageUrlBuilder({
  projectId: import.meta.env.VITE_SANITY_PROJECT_ID,
  dataset: import.meta.env.VITE_SANITY_DATASET,
})

export function urlFor(source: any) {
  return builder.image(source)
}
