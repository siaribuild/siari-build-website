export type Theme = 'light' | 'gray' | 'dark'

/* ---------------------------------------------------------------------------
 * Block theming — now class-based.
 *
 * Every helper returns a *semantic class name* defined in styles/brand.css.
 * The single important call is `themeBg`, which puts a `section--{theme}`
 * scope on the block wrapper; that scope maps all the contextual CSS
 * variables (--accent, --card-bg, --btn-*, …) that the child classes below
 * read. Change the section class and the whole subtree recolours — including
 * resolving eyebrows/accents to the correct on-light / on-dark bronze shade
 * for WCAG contrast, without any per-component branching.
 * ------------------------------------------------------------------------- */

// Section background + base text colour + theme variable scope.
export function themeBg(theme: Theme = 'light') {
  return { light: 'section--light', gray: 'section--gray', dark: 'section--dark' }[theme]
}

// Card surface — inverts against the section (colour only; keep inline clip).
export function themeCard(_theme: Theme = 'light') {
  return 'surface-card'
}

// Signature hover — card flips to the inverted surface.
export function themeCardHover(_theme: Theme = 'light') {
  return 'hover-flip'
}

// Icon tile background (the small notched square behind an icon).
export function themeIconTile(_theme: Theme = 'light') {
  return 'icon-tile-fill'
}

// Icon colour inside the tile (lucide / currentColor icons).
export function themeIconColor(_theme: Theme = 'light') {
  return 'icon-brand'
}

// Same intent as themeIconColor but as background-color — for CSS-masked SVGs.
export function themeIconMaskColor(_theme: Theme = 'light') {
  return 'icon-mask'
}

// Stat card surface.
export function themeStatCard(_theme: Theme = 'light') {
  return 'surface-stat'
}

// Primary CTA button styling per section theme.
export function themePrimaryBtn(_theme: Theme = 'light') {
  return 'btn-primary'
}

// Section background as a fill CLASS — paints a cut-out shape the section colour.
export function themeSectionFill(_theme: Theme = 'light') {
  return 'surface-section-fill'
}

// Raw section background colour — used to detect consecutive same-colour blocks
// so they can be visually joined. Kept as literal hexes (matches the neutral
// surface tokens) purely for the join-detection comparison in PageBuilder.
export function themeBgColor(theme: Theme = 'light') {
  return { light: '#ffffff', gray: '#F5F3EF', dark: '#111111' }[theme]
}

// Vertical padding for a section (unchanged — pure layout).
export function sectionPad(
  joinTop?: boolean,
  joinBottom?: boolean,
  fullTop = 'pt-24 lg:pt-32',
  fullBottom = 'pb-24 lg:pb-32',
) {
  return `${joinTop ? 'pt-8' : fullTop} ${joinBottom ? 'pb-8' : fullBottom}`
}
