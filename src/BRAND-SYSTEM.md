# SIARI BUILD — Class-Based Brand System (3-Shade Primary)

This refactor moves the site's brand/colour styling from scattered Tailwind
arbitrary values (`bg-[#B8946A]`, `text-[#B8946A]`, per-theme string maps) to a
**single, class-based, token-driven system** in `src/styles/brand.css`.

The goal: set **three shades of the primary bronze** so text/UI meets WCAG AA
contrast on every background, **without changing the brand**. Setting all three
shades equal reproduces the original site pixel-for-pixel.

---

## 1. The three swatches

Defined once in `src/styles/brand.css`:

```css
:root {
  --brand-primary:         #9F7C53;  /* buttons, borders, solid fills          */
  --brand-accent-on-dark:  #B8946A;  /* eyebrows / thin accents on DARK  bg     */
  --brand-accent-on-light: #8B6940;  /* eyebrows / thin accents on LIGHT bg     */
}
```

Why three? The original single `#B8946A` fails AA as text on light surfaces:

| Check                          | `#B8946A` (old) | 3-shade      | AA min |
|--------------------------------|-----------------|--------------|--------|
| Eyebrow text on white          | 2.81:1 ❌       | 5.01:1 ✅    | 4.5    |
| Eyebrow text on cream          | 2.53:1 ❌       | 4.52:1 ✅    | 4.5    |
| Eyebrow text on black          | 6.73:1 ✅       | 6.73:1 ✅    | 4.5    |
| Primary border/UI on white     | 2.81:1 ❌       | 3.83:1 ✅    | 3.0    |
| Primary border/UI on black     | —               | 4.93:1 ✅    | 3.0    |

Components **never reference a shade directly**. They read two contextual
variables:

- `--brand-primary` — always the solid brand colour.
- `--accent` — the section decides whether this is the on-dark or on-light
  shade, so the same class recolours correctly in any block.

---

## 2. Section backgrounds drive everything

Put **one** class on a block wrapper. It maps every contextual variable its
children read, so "each block can be white / cream / black and all components
render differently" is automatic:

```html
<section class="section--light"> … </section>   <!-- white bg -->
<section class="section--gray">  … </section>   <!-- cream bg -->
<section class="section--dark">  … </section>   <!-- near-black bg -->
```

Content sitting over a photo (heroes, project cards) uses `.on-media`, which
always reads as "on dark" (cream text, bright bronze) regardless of the
surrounding section.

Inside those scopes, `--accent`, `--card-bg`, `--card-fg`, `--btn-*`,
`--icon-*`, `--stat-*`, `--section-fill` are all remapped. Change the wrapper
class → the whole subtree recolours. No per-component branching.

In React this is wired through `blocks/themeUtils.ts`, whose `themeBg(theme)`
returns `section--light | section--gray | section--dark` for the block's
`theme` prop (`'light' | 'gray' | 'dark'`), unchanged from the CMS side.

---

## 3. Component classes

Rich components:

- `.btn` + `.btn-primary` / `.btn-bronze` / `.btn-outline` (+ `.btn-lg` / `.btn-sm`)
- `.card` (+ `--compact`, `--stat`, `--testimonial`, `--flush`, `--hover`), `.card-invert`, `.card-label`
- `.eyebrow`, `.text-accent`, `.rule-accent` (accent), `.rule-primary` (solid)
- `.icon-tile`, `.icon-brand`, `.icon-mask`, `.icon-mask-primary`
- `.field`, `.info-icon`
- `.nav-underline`, `.nav-divider`, `.brand-border-left`, `.brand-border-top`, `.corner-bracket`, `.contact-chip`

Lean colour-only atoms (used to migrate existing markup while keeping its
inline geometry/clip-paths): `.surface-card`, `.surface-stat`,
`.surface-section-fill`, `.hover-flip`, `.icon-tile-fill`, `.surface-white`,
`.surface-cream`, `.surface-black`, `.border-brand`, `.hover-accent`,
`.hover-border-brand`, `.hover-bg-brand`, `.group-hover-accent`.

Geometry (the signature angular cuts) is centralised as `--cut-*` tokens so
clip-paths are consistent and editable in one place.

---

## 4. Fallback guarantee

```html
<html class="brand-legacy"> … </html>
```

`.brand-legacy` sets all three swatches to `#B8946A`, reproducing the original
single-bronze design exactly. Proven in `preview.html` (toggle button) and in
`preview-legacy.png` vs `preview-3shade.png`.

---

## 5. Files changed

- **New:** `src/styles/brand.css` — the token + class system (source of truth).
- `src/styles/index.css` — imports `brand.css` last.
- `src/styles/theme.css` — base `--accent` / `--ring` now reference brand tokens.
- `src/app/styles/cards.css` — bronze border + cuts now token-driven.
- `src/app/components/blocks/themeUtils.ts` — helpers now return semantic class names.
- All live blocks, `Header`, `Footer`, pages, `MaintenanceScreen`,
  `ErrorBoundary`, `MaintenanceGate`, `PortableText`, `MapBlock` (pin colour
  read from `--brand-primary` at runtime) — migrated to the classes above.
- `Blocks.tsx` is legacy/unused (not imported by `PageBuilder`) and left as-is.

**Layout utilities (grid/flex/spacing) stay in the markup** — only brand/colour
styling became class/token-driven, which keeps the diff small and the build
identical. Verified compiling under Tailwind v4 (`v4.3.2`).

---

## 6. How to tune contrast later

Only edit the three swatches. If a client's brand needs a different bronze,
nudge `--brand-accent-on-light` darker until eyebrow-on-white ≥ 4.5:1 and
`--brand-primary` until border-on-white ≥ 3.0:1. `preview.html` shows these
ratios live as you drag the colour pickers.
