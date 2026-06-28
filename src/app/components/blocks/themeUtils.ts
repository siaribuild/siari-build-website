export type Theme = 'light' | 'gray' | 'dark'

// Section background + base text colour
export function themeBg(theme: Theme = 'light') {
  return {
    light: 'bg-white text-[#111111]',
    gray: 'bg-[#F5F3EF] text-[#111111]',
    dark: 'bg-[#111111] text-[#F5F3EF]',
  }[theme]
}

// Card background — cards INVERT against the section background per the design.
export function themeCard(theme: Theme = 'light') {
  return {
    light: 'bg-[#F5F3EF]',
    gray: 'bg-white',
    dark: 'bg-[#1a1a1a]',
  }[theme]
}

// Card hover treatment
export function themeCardHover(theme: Theme = 'light') {
  return {
    // On light/gray the signature hover flips the card to dark with light text
    light: 'hover:bg-[#111111] hover:text-[#F5F3EF]',
    gray: 'hover:bg-[#111111] hover:text-[#F5F3EF]',
    dark: 'hover:bg-[#222]',
  }[theme]
}

// Icon tile background (the small notched square behind an icon)
export function themeIconTile(theme: Theme = 'light') {
  return {
    light: 'bg-[#F5F3EF] group-hover:bg-[#B8946A]',
    gray: 'bg-[#F5F3EF]',
    dark: 'bg-[#111111]',
  }[theme]
}

// Icon colour inside the tile
export function themeIconColor(theme: Theme = 'light') {
  return {
    light: 'text-[#111111] group-hover:text-[#F5F3EF]',
    gray: 'text-[#111111]',
    dark: 'text-[#B8946A]',
  }[theme]
}

// Same intent as themeIconColor, but as background-color — used when an uploaded
// SVG is painted via CSS mask (an <img>-loaded SVG can't inherit currentColor,
// so we mask the shape and colour it with the background instead).
export function themeIconMaskColor(theme: Theme = 'light') {
  return {
    light: 'bg-[#111111] group-hover:bg-[#F5F3EF]',
    gray: 'bg-[#111111]',
    dark: 'bg-[#B8946A]',
  }[theme]
}

// Stat card background (stat cards stay cream on light/gray, darker on dark)
export function themeStatCard(theme: Theme = 'light') {
  return {
    light: 'bg-[#F5F3EF] text-[#111111]',
    gray: 'bg-white text-[#111111]',
    dark: 'bg-[#1a1a1a] text-[#F5F3EF]',
  }[theme]
}

// Primary button styling per section theme
export function themePrimaryBtn(theme: Theme = 'light') {
  return {
    light: 'bg-[#111111] text-[#F5F3EF] hover:bg-[#B8946A]',
    gray: 'bg-[#111111] text-[#F5F3EF] hover:bg-[#B8946A]',
    dark: 'bg-[#B8946A] text-[#F5F3EF] hover:bg-[#F5F3EF] hover:text-[#111111]',
  }[theme]
}

// Raw section background colour — used to detect consecutive same-colour blocks
// so they can be visually joined. light=white and gray=cream are deliberately
// different, so only truly identical backgrounds collapse together.
export function themeBgColor(theme: Theme = 'light') {
  return { light: '#ffffff', gray: '#F5F3EF', dark: '#111111' }[theme]
}

// Vertical padding for a section. When a block sits directly against another
// block of the SAME background colour, the touching edge collapses to 32px (pt/pb-8)
// so the two read as one continuous section instead of two stacked ones.
export function sectionPad(
  joinTop?: boolean,
  joinBottom?: boolean,
  fullTop = 'pt-24 lg:pt-32',
  fullBottom = 'pb-24 lg:pb-32',
) {
  return `${joinTop ? 'pt-8' : fullTop} ${joinBottom ? 'pb-8' : fullBottom}`
}
