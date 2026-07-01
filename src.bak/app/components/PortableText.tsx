import { PortableText as SanityPortableText } from '@portabletext/react'
import { urlFor } from '../lib/sanity'

const components = {
  types: {
    image: ({ value }: any) => (
      <img
        src={urlFor(value).width(800).format('webp').url()}
        alt={value.alt || ''}
        className="w-full my-6"
      />
    ),
  },
  block: {
    normal: ({ children }: any) => (
      <p className="mb-4 text-lg leading-relaxed opacity-80">{children}</p>
    ),
    h2: ({ children }: any) => (
      <h2 className="mb-4 mt-8 text-2xl font-bold">{children}</h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="mb-3 mt-6 text-xl font-bold">{children}</h3>
    ),
  },
  list: {
    bullet: ({ children }: any) => (
      <ul className="mb-6 space-y-3">{children}</ul>
    ),
  },
  listItem: {
    bullet: ({ children }: any) => (
      <li
        className="flex items-start gap-3 bg-[#F5F3EF] p-4 border-l-4 border-[#B8946A]"
        style={{ clipPath: 'polygon(0 0, calc(100% - 30px) 0, 100% 30px, 100% 100%, 0 100%)' }}
      >
        <div className="w-2 h-2 bg-[#B8946A] mt-2 flex-shrink-0" />
        <span className="opacity-80">{children}</span>
      </li>
    ),
  },
  marks: {
    strong: ({ children }: any) => <strong className="font-bold">{children}</strong>,
    em: ({ children }: any) => <em className="italic">{children}</em>,
  },
}

export function PortableText({ value }: { value: any[] }) {
  if (!value || value.length === 0) return null
  return <SanityPortableText value={value} components={components} />
}
