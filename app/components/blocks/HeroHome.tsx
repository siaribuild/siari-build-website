import { SmartLink } from '../SmartLink'
import type { SanityLink } from '../../lib/links'
import { renderMultiline } from './renderMultiline'
import { CdnImage } from '../CdnImage'

interface Props {
  eyebrow?: string
  heading: string
  subheading?: string
  backgroundImage: string
  backgroundImageHotspot?: { x?: number; y?: number } | null
  primaryButtonLabel?: string
  primaryButtonLink?: SanityLink | null
  secondaryButtonLabel?: string
  secondaryButtonLink?: SanityLink | null
}

export function HeroHome({
  eyebrow, heading, subheading, backgroundImage, backgroundImageHotspot,
  primaryButtonLabel, primaryButtonLink,
  secondaryButtonLabel, secondaryButtonLink,
}: Props) {
  return (
    <section className="relative h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0 hero-zoom">
        <CdnImage
          src={backgroundImage}
          hotspot={backgroundImageHotspot}
          alt=""
          fill
          priority
          sizes="100vw"
          widths={[768, 1024, 1366, 1600, 1920, 2560]}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
      </div>

      <div className="on-media relative z-10 w-full px-6 lg:px-12">
        <div className="max-w-[1600px] mx-auto">
          <div className="max-w-4xl">
            {eyebrow && (
              <div className="mb-6 eyebrow">{eyebrow}</div>
            )}
            <h1
              className="mb-8 uppercase"
              style={{ fontSize: 'clamp(3.5rem, 10vw, 7rem)', fontWeight: 700, lineHeight: 0.9, letterSpacing: '-0.02em' }}>{renderMultiline(heading)}</h1>
            {subheading && (
              <p className="mb-10 text-xl max-w-2xl opacity-90">{subheading}</p>
            )}
            <div className="flex flex-wrap gap-4">
              {primaryButtonLabel && (
                <SmartLink link={primaryButtonLink} className="btn btn-bronze">
                  {primaryButtonLabel}
                </SmartLink>
              )}
              {secondaryButtonLabel && (
                <SmartLink link={secondaryButtonLink} className="btn btn-outline">
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
