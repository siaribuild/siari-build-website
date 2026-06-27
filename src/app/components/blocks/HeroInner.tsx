import { motion } from 'motion/react'
import { renderMultiline } from './renderMultiline'
import { img } from '../../lib/image'

const heightMap = {
  half: 'min-h-[40vh]',
  compact: 'min-h-[30vh]',
}

interface Props {
  height?: 'half' | 'compact'
  eyebrow?: string
  heading: string
  subheading?: string
  backgroundImage: string
}

export function HeroInner({ height = 'half', eyebrow, heading, subheading, backgroundImage }: Props) {
  return (
    <section className={`relative ${heightMap[height]} flex items-center justify-center overflow-hidden bg-[#111111] text-[#F5F3EF]`}>
      <motion.div
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: `url(${img(backgroundImage, { w: 1920 })})` }}
        initial={{ scale: 1.05 }}
        animate={{ scale: 1 }}
        transition={{ duration: 2.5, ease: 'easeOut' }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <div
        className="absolute top-0 left-0 w-96 h-96 border-l-2 border-t-2 border-[#B8946A]/30"
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% 60px, 60px 60px, 60px 100%, 0 100%)' }}
      />

      <div className="relative z-10 text-center px-6 py-24">
        {eyebrow && (
          <div className="mb-4 text-sm tracking-[0.3em] uppercase text-[#B8946A]">{eyebrow}</div>
        )}
        <h1
          className="mb-6 uppercase"
          style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', fontWeight: 700, lineHeight: 0.95, letterSpacing: '-0.02em' }}>{renderMultiline(heading)}</h1>
        {subheading && (
          <p className="text-xl max-w-3xl mx-auto opacity-90">{subheading}</p>
        )}
      </div>
    </section>
  )
}
