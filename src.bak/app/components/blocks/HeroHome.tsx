import { motion } from 'motion/react'
import { SmartLink } from '../SmartLink'
import type { SanityLink } from '../../lib/links'
import { renderMultiline } from './renderMultiline'
import { img } from '../../lib/image'

interface Props {
  eyebrow?: string
  heading: string
  subheading?: string
  backgroundImage: string
  primaryButtonLabel?: string
  primaryButtonLink?: SanityLink | null
  secondaryButtonLabel?: string
  secondaryButtonLink?: SanityLink | null
}

export function HeroHome({
  eyebrow, heading, subheading, backgroundImage,
  primaryButtonLabel, primaryButtonLink,
  secondaryButtonLabel, secondaryButtonLink,
}: Props) {
  return (
    <section className="relative h-screen flex items-center overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${img(backgroundImage, { w: 1920 })})` }}
        initial={{ scale: 1.05 }}
        animate={{ scale: 1 }}
        transition={{ duration: 2.5, ease: 'easeOut' }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
      </motion.div>

      <div className="relative z-10 w-full px-6 lg:px-12">
        <div className="max-w-[1600px] mx-auto">
          <div className="max-w-4xl">
            {eyebrow && (
              <div className="mb-6 text-sm tracking-[0.3em] uppercase text-[#B8946A]">{eyebrow}</div>
            )}
            <h1
              className="mb-8 text-[#F5F3EF] uppercase"
              style={{ fontSize: 'clamp(3.5rem, 10vw, 7rem)', fontWeight: 700, lineHeight: 0.9, letterSpacing: '-0.02em' }}>{renderMultiline(heading)}</h1>
            {subheading && (
              <p className="mb-10 text-xl max-w-2xl text-[#F5F3EF]/90">{subheading}</p>
            )}
            <div className="flex flex-wrap gap-4">
              {primaryButtonLabel && (
                <SmartLink
                  link={primaryButtonLink}
                  className="inline-block bg-[#B8946A] text-[#F5F3EF] px-10 py-4 text-sm tracking-wider uppercase transition-all hover:bg-[#F5F3EF] hover:text-[#111111]"
                  style={{ clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))' }}
                >
                  {primaryButtonLabel}
                </SmartLink>
              )}
              {secondaryButtonLabel && (
                <SmartLink
                  link={secondaryButtonLink}
                  className="inline-block border-2 border-[#F5F3EF] text-[#F5F3EF] px-10 py-4 text-sm tracking-wider uppercase transition-all hover:bg-[#F5F3EF] hover:text-[#111111]"
                  style={{ clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))' }}
                >
                  {secondaryButtonLabel}
                </SmartLink>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
