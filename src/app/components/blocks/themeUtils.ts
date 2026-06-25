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
