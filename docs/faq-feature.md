# FAQ feature — requirements, implementation & structured data

Status: **Live.** The visible FAQ page shipped as the `faqBlock` page-builder block
(categorised accordion, five groups on `/faq`); this document records how it works and
how the `FAQPage` structured data is derived from it.

> Naming note: an earlier drop of this feature used a block called `faqSection`
> (flat list, `<details>/<summary>`). The production implementation is **`faqBlock`**
> (grouped layout matching the Figma design, one block per category). The JSON-LD
> bridge (`faqItemsOf`) is keyed to `faqBlock` — all groups on a page flatten into a
> single `mainEntity` list.

---

## 1. Goal

Give Siari Build a genuine, visible FAQ that:

1. Renders on the page for visitors (a themed, accessible accordion), and
2. Emits valid `FAQPage` Schema.org structured data **derived from that same visible
   content** — so the markup never claims a Q&A that isn't on the page.

Its home is the dedicated page at slug **`faq`**, linked from the footer. But the
block works on **any** page.

### Why FAQ (and the honest caveat)
- **AEO:** answer engines (ChatGPT, Perplexity, Google AI overviews) parse `FAQPage`
  Q&A cleanly, improving the odds Siari is quoted for high-intent questions ("how much
  does a custom home cost in Melbourne", "how long does a build take", …).
- **Caveat:** Google restricted FAQ *rich results* to government/health sites in 2023,
  so a builder should **not** expect the SERP rich result. The value is AEO + on-page
  UX + a stronger entity graph, not a rich snippet.

### Non-negotiable principle
`FAQPage` structured data is emitted **only** from visible `faqBlock` content. No
inventing questions around prose. If there's no visible FAQ, there's no FAQ markup.

---

## 2. Implementation (file inventory)

### Studio (schema)
- **`studio/schemaTypes/blocks.ts`** — the `faqBlock` object: `theme`
  (light/gray/dark), required `title` (the category label, e.g. "Getting Started"),
  and `items[]` of `{ question (string, required), answer (text, required) }`
  (min 1, unlimited, drag-sortable). Registered in `index.ts` and `page.ts`.

### Frontend (render)
- **`app/components/blocks/FaqBlock.tsx`** — the visible accordion: category label
  left, Q&A rows right, animated expand, `aria-expanded`/`aria-controls`. No heading
  elements — the page hero owns the single `<h1>`.
- **`app/components/blocks/PageBuilder.tsx`** — renders `case 'faqBlock'`;
  participates in the same-colour "join" logic via its `theme`, so stacked groups
  merge into one continuous section.

### Data (query)
- **`app/lib/queries.ts`** — `PAGE_QUERY` sections projection includes `title` and
  `items[]{ question, answer }`.

### Structured data (JSON-LD)
- **`app/lib/meta.ts`**
  - `faqItemsOf(page)` — flattens every `faqBlock` on a page into one
    `{ question, answer }[]` (five groups on `/faq` → 14 pairs).
  - `buildMeta` accepts `faqItems` and passes them to `buildJsonLd`.
- **`app/lib/jsonld.ts`** — when `faqItems` contains complete Q&A pairs, the page's
  `WebPage` node gains type `FAQPage` and a `mainEntity` array of
  `Question`/`acceptedAnswer` → **one** page entity that is both a WebPage and an
  FAQPage (no duplicate/competing page node). Empty/partial pairs are dropped.

### Routes
- **`app/routes/page.tsx`** and **`app/routes/home.tsx`** — pass
  `faqItems: faqItemsOf(data?.page)` into `buildMeta`.

---

## 3. Data model

```ts
faqBlock {
  _type: 'faqBlock'
  theme: 'light' | 'gray' | 'dark'      // default 'light'; /faq uses 'gray'
  title: string                          // category label, e.g. "Getting Started"
  items: Array<{
    question: string                     // required
    answer: string                       // required, plain text
  }>                                     // min 1, no upper limit
}
```

Answers are **plain text** by design: it keeps `acceptedAnswer.text` exactly equal to
the visible answer. (Rich-text answers are a possible future enhancement.)

---

## 4. Verification

- [ ] `/faq` shows the categorised accordion; one `<h1>` (the hero).
- [ ] View source: a single `<script type="application/ld+json">` whose `@graph`
      contains a node typed `["WebPage","FAQPage"]` with a `mainEntity` whose
      `Question` names + `acceptedAnswer.text` **exactly match** the on-page Q&A.
- [ ] Google Rich Results Test detects **FAQ** with no errors;
      validator.schema.org reports no errors.
- [ ] `/sitemap.xml` includes `/faq` with a `<lastmod>`.
- [ ] Pages **without** a `faqBlock` emit **no** `FAQPage` markup.

---

## 5. Future enhancements (out of scope)

- Rich-text answers (`blockContent` serialised to plain text for the JSON-LD).
- Per-question anchor links (`#question-slug`) for deep-linking and AI citation.
- Search/filter on long FAQ lists.

---

## 6. Notes for future agents

- Keep the invariant: **JSON-LD FAQ is derived from `faqBlock` only** (via
  `faqItemsOf`). Never source it from SEO-tab metadata or invented questions.
- The block is theme-aware; colours come from `themeBg`/`sectionPad` + the
  `.faq-divider`/`.faq-toggle` role classes in `styles/brand.css` — don't hardcode.
- The single-`<h1>`-per-page rule is by convention (hero = h1, everything else
  h2/h3). Don't introduce an `<h1>` in FAQ or other section blocks.
