import { type PortableTextComponents } from '@portabletext/react'

// Shared Portable Text rendering config used by every block that renders
// rich content (RichText block, project description, etc.). Defining it once
// keeps content styling consistent everywhere — headings, lists, links, and
// crucially IMAGES, which all get the site's angular top-right corner cut.

// The signature angular cut used on content images and cards site-wide.
const CONTENT_IMAGE_CLIP =
  'polygon(0 0, calc(100% - 60px) 0, 100% 60px, 100% 100%, 0 100%)'

export const portableTextComponents: PortableTextComponents = {
  types: {
    // Inline image inserted into rich text. The query must resolve
    // `asset->url` (and optional alt) for this to render — see queries.ts.
    image: ({ value }) => {
      const url = value?.asset?.url
      if (!url) return null
      return (
        <figure className="my-10">
          <div className="overflow-hidden" style={{ clipPath: CONTENT_IMAGE_CLIP }}>
            <img src={url} alt={value?.alt || ''} className="w-full h-auto block" loading="lazy" />
          </div>
          {value?.caption && (
            <figcaption className="mt-3 text-sm opacity-60 text-center">{value.caption}</figcaption>
          )}
        </figure>
      )
    },
  },
  block: {
    h2: ({ children }) => (
      <h2 style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1.2, marginTop: '2.5rem', marginBottom: '1rem' }}>
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 style={{ fontSize: '1.4rem', fontWeight: 700, lineHeight: 1.3, marginTop: '2rem', marginBottom: '0.75rem' }}>
        {children}
      </h3>
    ),
    normal: ({ children }) => (
      <p style={{ marginBottom: '1.25rem', lineHeight: 1.8 }} className="opacity-80">
        {children}
      </p>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="mb-6 space-y-2 list-disc pl-6 opacity-80" style={{ lineHeight: 1.8 }}>{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="mb-6 space-y-2 list-decimal pl-6 opacity-80" style={{ lineHeight: 1.8 }}>{children}</ol>
    ),
  },
  marks: {
    strong: ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
    em: ({ children }) => <em>{children}</em>,
    link: ({ children, value }) => {
      const newTab = value?.openInNewTab
      return (
        <a
          href={value?.href}
          target={newTab ? '_blank' : undefined}
          rel={newTab ? 'noopener noreferrer' : undefined}
          className="text-[#B8946A] underline hover:opacity-70 transition-opacity"
        >
          {children}
        </a>
      )
    },
  },
}
