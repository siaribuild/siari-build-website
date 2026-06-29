// ─── Reusable SEO GROQ fragment (sanity-plugin-seo shape) ─────────────────────
const SEO_FRAGMENT = `
  seo {
    metaTitle,
    metaDescription,
    nofollowAttributes,
    seoKeywords,
    "metaImage": metaImage.asset->url,
    openGraph {
      title,
      description,
      siteName,
      "image": image.asset->url
    },
    twitter {
      cardType,
      site,
      creator,
      handle
    }
  }
`

// ─── Reusable link projection (internal reference dereferenced to type + slug) ─
const LINK = `{
    kind,
    href,
    newTab,
    internal->{ _type, "slug": slug.current }
  }`

// markDefs projection that dereferences inline link annotations inside Portable Text
const PT_MARKDEFS = `markDefs[]{
    ...,
    _type == "link" => { ..., internal->{ _type, "slug": slug.current } }
  }`

// ─── Site Settings ───────────────────────────────────────────────────────────
export const SITE_SETTINGS_QUERY = `*[_type == "siteSettings"][0] {
  siteName,
  tagline,
  phone,
  email,
  address,
  copyrightText,
  legalLine,
  workingHours,
  maintenanceEnabled,
  maintenanceHeading,
  maintenanceMessage,
  maintenanceShowContact,
  "maintenanceImage": maintenanceImage.asset->url,
  notFoundHeading,
  notFoundMessage,
  notFoundButtonLabel,
  "notFoundImage": notFoundImage.asset->url,
  mapLocation,
  mapZoom,
  mapAddressLabel
}`

// ─── Navigation (header menu, footer menu, social links) ──────────────────────
export const NAVIGATION_QUERY = `*[_type == "navigation"][0] {
  headerMenu[] {
    "pageSlug": page->slug.current,
    "pageTitle": page->title,
    label
  },
  headerCtaEnabled,
  footerMenu[] {
    "pageSlug": page->slug.current,
    "pageTitle": page->title,
    label
  },
  socialMenu[] {
    label,
    url,
    "icon": icon.asset->url
  }
}`

// ─── Page by slug ─────────────────────────────────────────────────────────────
export const PAGE_QUERY = `*[_type == "page" && slug.current == $slug][0] {
  title,
  "slug": slug.current,
  sections[] {
    _type,
    _key,
    eyebrow, heading, subheading,
    "backgroundImage": backgroundImage.asset->url,
    primaryButtonLabel,
    primaryButtonLink ${LINK},
    secondaryButtonLabel,
    secondaryButtonLink ${LINK},
    height,
    theme,
    columns,
    imagePosition,
    imageSize,
    "image": image.asset->url,
    text[]{
      ...,
      ${PT_MARKDEFS}
    },
    ctaLabel,
    ctaLink ${LINK},
    stats[] { value, label },
    cards[] {
      "icon": icon.asset->url,
      label,
      title,
      text
    },
    buttonLabel,
    buttonLink ${LINK},
    body,
    content[] {
      ...,
      _type == "image" => {
        ...,
        "asset": asset->{ url }
      },
      ${PT_MARKDEFS}
    },
    testimonials[]-> {
      _id,
      quote,
      clientName,
      projectReference,
      "projectSlug": project->slug.current
    },
    formHeading, infoHeading,
  },
  ${SEO_FRAGMENT}
}`

// ─── All Projects (ordered) ───────────────────────────────────────────────────
export const PROJECTS_QUERY = `*[_type == "project"] | order(orderRank) {
  _id,
  title,
  "slug": slug.current,
  "heroImage": heroImage.asset->url,
  description,
  details {
    year,
    location,
    "category": category->title,
    "categorySlug": category->slug.current,
    client,
    duration,
    size
  }
}`

// ─── Top 3 Projects (featured = first 3 in order) ─────────────────────────────
export const FEATURED_PROJECTS_QUERY = `*[_type == "project"] | order(orderRank) [0..2] {
  _id,
  title,
  "slug": slug.current,
  "heroImage": heroImage.asset->url,
  description,
  details {
    year,
    location,
    "category": category->title
  }
}`

// ─── Project Categories — ONLY those with at least one project ────────────────
export const CATEGORIES_QUERY = `*[_type == "projectCategory" && count(*[_type == "project" && references(^._id)]) > 0] | order(orderRank) {
  _id,
  title,
  "slug": slug.current
}`

// ─── Project Categories — ALL (used in the contact form dropdown) ─────────────
export const ALL_CATEGORIES_QUERY = `*[_type == "projectCategory"] | order(orderRank) {
  _id,
  title,
  "slug": slug.current
}`

// ─── Single Project by slug ───────────────────────────────────────────────────
export const PROJECT_QUERY = `*[_type == "project" && slug.current == $slug][0] {
  _id,
  title,
  "slug": slug.current,
  description[]{
    ...,
    ${PT_MARKDEFS}
  },
  "heroImage": heroImage.asset->url,
  details {
    year,
    location,
    "category": category->title,
    client,
    duration,
    size
  },
  gallery[] {
    "url": asset->url,
    caption
  },
  ${SEO_FRAGMENT}
}`

// ─── Other Projects (for "More Projects" carousel, ordered) ───────────────────
export const OTHER_PROJECTS_QUERY = `*[_type == "project" && slug.current != $slug] | order(orderRank) {
  _id,
  title,
  "slug": slug.current,
  "heroImage": heroImage.asset->url,
  details {
    year,
    location,
    "category": category->title
  }
}`

