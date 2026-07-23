// ─────────────────────────────────────────────────────────────────────────────
//  JSON-LD structured data (Task 2 of the SEO/AEO brief).
//
//  Emits ONE `<script type="application/ld+json">` per page containing a single
//  Schema.org @graph. Building one graph (rather than several scripts) lets the
//  nodes reference each other by @id and guarantees the business entity appears
//  exactly once per page — no duplicate/competing nodes.
//
//  Nodes, per page:
//    • GeneralContractor  (#business)  — the site-wide business entity.
//    • WebSite            (#website)   — the site; WebPage nodes link to it.
//    • WebPage            (<url>#webpage) — this page; references business+website.
//    • BreadcrumbList                  — non-home pages; describes the REAL URL
//                                        hierarchy (machine-facing, like the
//                                        sitemap — not on-page UI).
//
//  FAQPage is CONDITIONAL: when the page renders visible faqBlock Q&As (passed
//  in as faqItems), the page node's @type becomes ["WebPage","FAQPage"] with a
//  mainEntity built from that same visible content — markup always matches what
//  the visitor reads. Pages without a FAQ block emit a plain WebPage node.
//
//  Everything is derived from Sanity `siteSettings` + `navigation.socialMenu`
//  (passed in from the root loader) and the current page's meta. We NEVER invent
//  data: empty inputs simply omit the corresponding field/node. In particular
//  there is no aggregateRating unless real on-page reviews back it (there aren't,
//  so it's absent).
// ─────────────────────────────────────────────────────────────────────────────

interface Settings {
  siteName?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  legalLine?: string | null
  workingHours?: string | null
  mapLocation?: { lat?: number | null; lng?: number | null } | null
}

interface BuildJsonLdArgs {
  siteUrl: string
  settings: Settings
  socialUrls: string[]
  canonical: string
  /** Clean display title for the current page (not the branded meta title). */
  title: string
  description?: string
  /** Absolute OG image URL (already resolved by buildMeta). */
  image?: string
  /** seo.schemaOrg.schemaType, if set. */
  schemaType?: string | null
  /** Path portion of the canonical, e.g. '', '/about', '/projects/slug'. */
  path: string
  datePublished?: string | null
  dateModified?: string | null
  /** Q&A pairs from the page's VISIBLE FAQ block(s). Drives FAQPage. */
  faqItems?: Array<{ question?: string | null; answer?: string | null }> | null
}

// ── Small, dependency-free parsers ──────────────────────────────────────────

/** Australian local number → E.164 (e.g. "0419 000 991" → "+61419000991"). */
function toE164(phone?: string | null): string | undefined {
  if (!phone) return undefined
  const d = phone.replace(/[^\d+]/g, '')
  if (!d) return undefined
  if (d.startsWith('+')) return d
  if (d.startsWith('0')) return `+61${d.slice(1)}`
  return `+61${d}`
}

/** Pull ABN + Builder Licence out of the free-text legal line. */
function parseIdentifiers(legalLine?: string | null) {
  const ids: Array<{ '@type': 'PropertyValue'; name: string; value: string }> = []
  if (!legalLine) return ids
  const abn = legalLine.match(/ABN\s+([\d ]+?)(?=\s*\||$)/i)?.[1]?.trim()
  if (abn) ids.push({ '@type': 'PropertyValue', name: 'ABN', value: abn })
  const lic = legalLine.match(/Builder\s+Licen[cs]e\s+(.+?)(?=\s*\||$)/i)?.[1]?.trim()
  if (lic) ids.push({ '@type': 'PropertyValue', name: 'Builder Licence', value: lic })
  return ids
}

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

/** "8:00 AM" → "08:00", "5:00 PM" → "17:00". Returns undefined if unparseable. */
function to24h(t: string): string | undefined {
  const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i)
  if (!m) return undefined
  let h = parseInt(m[1], 10)
  const min = m[2]
  const mer = m[3]?.toUpperCase()
  if (mer === 'PM' && h !== 12) h += 12
  if (mer === 'AM' && h === 12) h = 0
  return `${String(h).padStart(2, '0')}:${min}`
}

/**
 * Parse the multi-line workingHours string into OpeningHoursSpecification[].
 * Handles "Mon - Fri: 8:00 AM - 5:00 PM", "Saturday: 9:00 AM - 2:00 PM" and
 * skips "Sunday: Closed". Unknown/garbled lines are ignored rather than guessed.
 */
function parseHours(workingHours?: string | null) {
  const specs: Array<{
    '@type': 'OpeningHoursSpecification'
    dayOfWeek: string[]
    opens: string
    closes: string
  }> = []
  if (!workingHours) return specs

  for (const raw of workingHours.split('\n')) {
    const line = raw.trim()
    if (!line || /closed/i.test(line)) continue
    const m = line.match(/^([A-Za-z]+)(?:\s*[-–]\s*([A-Za-z]+))?\s*:\s*(.+?)\s*[-–]\s*(.+)$/)
    if (!m) continue
    const [, startDay, endDay, openRaw, closeRaw] = m
    const opens = to24h(openRaw)
    const closes = to24h(closeRaw)
    if (!opens || !closes) continue

    const si = DAY_ORDER.findIndex((d) => d.toLowerCase() === startDay.toLowerCase())
    if (si < 0) continue
    let days: string[]
    if (endDay) {
      const ei = DAY_ORDER.findIndex((d) => d.toLowerCase() === endDay.toLowerCase())
      days = ei >= si ? DAY_ORDER.slice(si, ei + 1) : [DAY_ORDER[si]]
    } else {
      days = [DAY_ORDER[si]]
    }
    specs.push({ '@type': 'OpeningHoursSpecification', dayOfWeek: days, opens, closes })
  }
  return specs
}

const REGION_MAP: Record<string, string> = {
  victoria: 'VIC',
  'new south wales': 'NSW',
  queensland: 'QLD',
  'south australia': 'SA',
  'western australia': 'WA',
  tasmania: 'TAS',
  'northern territory': 'NT',
  'australian capital territory': 'ACT',
}

/** "Point Cook, Victoria" → { locality: "Point Cook", region: "VIC" }. */
function parseAddress(address?: string | null) {
  if (!address) return { locality: undefined as string | undefined, region: 'VIC' }
  const parts = address.split(',').map((p) => p.trim()).filter(Boolean)
  const locality = parts[0]
  const regionRaw = parts[1]?.toLowerCase()
  const region = (regionRaw && REGION_MAP[regionRaw]) || 'VIC'
  return { locality, region }
}

/**
 * Normalise the CMS social links (navigation.socialMenu[].url) into a clean
 * `sameAs` list: trimmed, absolute http(s) URLs only, de-duplicated
 * case-insensitively (ignoring a trailing slash), original casing kept.
 * The CMS is the single source of truth — like the sitemap, `sameAs` is
 * derived from content, never hand-maintained.
 */
function normalizeSameAs(urls: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of urls) {
    const u = (raw ?? '').trim()
    if (!/^https?:\/\//i.test(u)) continue
    const key = u.toLowerCase().replace(/\/+$/, '')
    if (seen.has(key)) continue
    seen.add(key)
    out.push(u)
  }
  return out
}

// ── Node builders ────────────────────────────────────────────────────────────

function businessNode(args: BuildJsonLdArgs) {
  const { siteUrl, settings, socialUrls } = args
  const { locality, region } = parseAddress(settings.address)
  const telephone = toE164(settings.phone)
  const hours = parseHours(settings.workingHours)
  const identifiers = parseIdentifiers(settings.legalLine)
  const lat = settings.mapLocation?.lat
  const lng = settings.mapLocation?.lng

  const node: Record<string, unknown> = {
    '@type': 'GeneralContractor',
    '@id': `${siteUrl}/#business`,
    name: settings.siteName || 'SIARI Build',
    url: `${siteUrl}/`,
    image: `${siteUrl}/og-default.png`,
    logo: `${siteUrl}/icon-512.png`,
  }
  if (telephone) node.telephone = telephone
  if (settings.email) node.email = settings.email
  if (locality) {
    node.address = {
      '@type': 'PostalAddress',
      addressLocality: locality,
      addressRegion: region,
      addressCountry: 'AU',
    }
  }
  if (lat != null && lng != null) {
    node.geo = { '@type': 'GeoCoordinates', latitude: lat, longitude: lng }
  }
  node.areaServed = { '@type': 'City', name: 'Melbourne' }
  if (hours.length) node.openingHoursSpecification = hours
  if (identifiers.length) node.identifier = identifiers
  const sameAs = normalizeSameAs(socialUrls)
  if (sameAs.length) node.sameAs = sameAs
  return node
}

function websiteNode(args: BuildJsonLdArgs) {
  const { siteUrl, settings } = args
  return {
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    url: `${siteUrl}/`,
    name: settings.siteName || 'SIARI Build',
    inLanguage: 'en-AU',
    publisher: { '@id': `${siteUrl}/#business` },
  }
}

/** WebPage / ContactPage / AboutPage / CollectionPage, chosen from schemaType.
 *  Also becomes an FAQPage (adding mainEntity) when the page has a visible FAQ. */
function webPageNode(args: BuildJsonLdArgs) {
  const { siteUrl, canonical, title, description, image, schemaType, path, datePublished, dateModified, faqItems } = args

  let type: string | string[] = 'WebPage'
  if (schemaType === 'Organization' || /^\/about\b/.test(path)) type = 'AboutPage'
  else if (/contact/.test(path)) type = 'ContactPage'
  else if (path === '/projects') type = 'CollectionPage'

  // Only questions with a real answer — never fabricate the Q&A format.
  const qas = (faqItems ?? [])
    .map((f) => ({ q: (f.question ?? '').trim(), a: (f.answer ?? '').trim() }))
    .filter((f) => f.q && f.a)
  if (qas.length) type = Array.isArray(type) ? [...type, 'FAQPage'] : [type, 'FAQPage']

  const node: Record<string, unknown> = {
    '@type': type,
    '@id': `${canonical}#webpage`,
    url: canonical,
    name: title,
    isPartOf: { '@id': `${siteUrl}/#website` },
    about: { '@id': `${siteUrl}/#business` },
    publisher: { '@id': `${siteUrl}/#business` },
    inLanguage: 'en-AU',
  }
  if (description) node.description = description
  if (image) node.primaryImageOfPage = image
  if (datePublished) node.datePublished = datePublished
  if (dateModified) node.dateModified = dateModified
  if (qas.length) {
    node.mainEntity = qas.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    }))
  }
  return node
}

// Describes the page's position in the REAL URL hierarchy (like sitemap.xml,
// this is machine-facing structure, not on-page UI). Home has no trail.
//   /projects/<slug> → Home > Projects > <Title>
//   /<slug>          → Home > <Title>
function breadcrumbNode(args: BuildJsonLdArgs) {
  const { siteUrl, path, title } = args
  if (!path || path === '/') return null

  const items: Array<{ name: string; item: string }> = [{ name: 'Home', item: `${siteUrl}/` }]
  if (path.startsWith('/projects/')) {
    items.push({ name: 'Projects', item: `${siteUrl}/projects` })
    items.push({ name: title, item: `${siteUrl}${path}` })
  } else {
    items.push({ name: title, item: `${siteUrl}${path}` })
  }

  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.item,
    })),
  }
}

// ── Public entry ─────────────────────────────────────────────────────────────

/**
 * Returns a single Schema.org @graph object for the page, or null if there's
 * no siteUrl (can't build absolute @ids). Emit via a `script:ld+json` meta
 * descriptor.
 */
export function buildJsonLd(args: BuildJsonLdArgs): Record<string, unknown> | null {
  if (!args.siteUrl) return null

  const graph: Record<string, unknown>[] = [
    businessNode(args),
    websiteNode(args),
    webPageNode(args),
  ]

  const crumbs = breadcrumbNode(args)
  if (crumbs) graph.push(crumbs)

  return { '@context': 'https://schema.org', '@graph': graph }
}
