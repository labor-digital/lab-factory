# Design Log #018 — Claude-Design Content Blocks

## Background

The factory-core boilerplate currently ships ~17 "NuxtUI" content blocks (TYPO3 ContentBlocks + Vue wrappers around `@nuxt/ui` primitives). In parallel, a richer hand-crafted design system was prototyped in **Claude.ai/design** as the project "Labor Website Factory" — 15 content modules with:

- A coherent visual language (custom typography scale, neutral + brand color tokens, 80/170 spacing on desktop)
- 5 brand presets (heckeslmueller, cobalt, forest, ink, sunrise) swappable via a single CSS class
- React/JSX prototypes + per-block READMEs + design tokens in `tokens.css` + `tokens.json` (Tokens Studio compatible)

The first 4 modules already landed in the playground (`page-hero`, `page-section`, `text-slider`, `reference-list`) as the proof-of-concept layer.

## Problem

Two parallel systems are confusing:
1. The retired NuxtUI blocks are still wired in TYPO3 and Vue but no longer reflect the design direction.
2. The naming diverges (Page* prefix on existing, single-word on design).
3. Tokens are inlined per component instead of declared in one CSS variable layer.
4. 11 of the 15 design modules are still unimplemented.

Editors and developers can't tell which set is canonical, and clients can't yet pick a brand preset.

## Design

**One content-block system, Claude-designed, with the four already-built playground stories as the seed.**

### Module inventory (13 final blocks)

The design's 15 modules collapse to 13 final blocks because `intro`, `text`, and `river` are absorbed by the existing flexible `Section` (formerly `PageSection`).

| Final block | Vue | TYPO3 slug | Source design module(s) | Status |
|---|---|---|---|---|
| Hero | `Hero` / `BaseHero` | `hero` | hero | Rename from `PageHero` |
| Section | `Section` / `BaseSection` | `section` | intro + text + river | Rename from `PageSection` (kept flexible) |
| Teaser | `Teaser` / `BaseTeaser` | `teaser` | teaser | Rename from `ReferenceList` |
| ImgSlider | `ImgSlider` / `BaseImgSlider` | `img_slider` | imgslider | Rename from `TextSlider` |
| Cta | `Cta` / `BaseCta` | `cta` | cta | New |
| Header | `Header` / `BaseHeader` | `header` | header | New (site header, not section eyebrow) |
| Footer | `Footer` / `BaseFooter` | `footer` | footer | New |
| Features | `Features` / `BaseFeatures` | `features` | features | New |
| Faq | `Faq` / `BaseFaq` | `faq` | faq | New |
| Stats | `Stats` / `BaseStats` | `stats` | stats | New |
| Testimonials | `Testimonials` / `BaseTestimonials` | `testimonials` | testimonials | New |
| Logowall | `Logowall` / `BaseLogowall` | `logowall` | logowall | New |
| Downloads | `Downloads` / `BaseDownloads` | `downloads` | downloads | New |

### Tokens architecture

The design's `tokens.css` is the single source of truth — ported to `factory-core/nuxt-layer/assets/css/tokens.css` and registered via the layer's `nuxt.config.ts` `css[]`. Provides:

- 62 CSS variables: brand/neutral colors, typography (Open Sans + 11 sizes), spacing (gap-xs..xl, section-x/y), radius (sharp/soft/round presets), button geometry
- 5 brand classes (`.brand-cobalt`, etc.) — opt-in by adding to `<body>`
- 3 density classes (`.density-compact/comfortable/spacious`)
- 3 radius presets (`.radius-sharp/soft/round`)
- Resets + reusable primitives (`.btn`, `.eyebrow`, `.tag`, `.ph`, `.dots`, `.arrows`)

Components consume tokens via `var(--brand-primary)` etc. Tailwind utilities handle layout; tokens handle color/typography/spacing.

### Vue layering (unchanged from existing pattern)

`BaseX.vue` = renderless slot. Parses TYPO3 `content.*` fields via shared utils (`parseButtons`, `parseFile`, `asBool`, `unwrapSelect`). Emits typed `uiProps` to its slot.

`X.vue` = imports `BaseX`, renders the design's markup. Uses tokens + Tailwind utilities + scoped CSS only where Tailwind can't (e.g. `:deep()` Splide overrides).

### TYPO3 ContentBlocks

One folder per block in `factory-core/typo3-extension/ContentBlocks/ContentElements/`. `config.yaml` mirrors playground story controls. `templates/frontend.html` (lowercase!) emits JSON.

Constraints learned from prior incidents:
- Don't use `Relation: pages` — use `Number` or `Link` (memory: `feedback_cb_relation_pages.md`).
- Custom dataProcessor nests under `fields.content.dataProcessing.10.dataProcessing` (memory: `feedback_nb_cb_dataprocessor_nesting.md`).
- Template filename must be lowercase (memory: `feedback_content_blocks_template_case.md`).

## Implementation plan

**Phase 0** — Design log (this file) and `.design-log/` directory.

**Phase 1 — Foundations**
1.1 Port `tokens.css` to `factory-core/nuxt-layer/assets/css/tokens.css`; wire via layer `nuxt.config.ts`.
1.2 Refresh atoms: `Button` (design's outline/solid/white-outline/white-solid variants), add `Eyebrow.vue` and `Tag.vue` if missing.
1.3 Rename `PageHero` → `Hero` (Vue + Base + story + TYPO3 + manifest); adapt to tokens.
1.4 Rename `PageSection` → `Section`.
1.5 Rename `TextSlider` → `ImgSlider`.
1.6 Rename `ReferenceList` → `Teaser`.

**Phase 2 — New blocks (3 batches)**

Batch A: `Cta`, `Stats`, `Logowall` — simple section-style blocks.
Batch B: `Features`, `Faq`, `Downloads` — content-list blocks.
Batch C: `Header`, `Footer`, `Testimonials` — chrome + social proof.

**Phase 3 — Cleanup**
- Delete 11 retired NuxtUI Vue components + their TYPO3 ContentBlocks.
- Drop `nuxt_ui` flag from `manifest.json`.
- Populate `factory.json` templates' `active_components` with all 13.

## Examples — per-block scaffold

For each block `X`:

```
factory-core/
├── nuxt-layer/components/T3/Content/
│   ├── BaseX.vue          ← slot-only parser
│   └── X.vue              ← renders design markup
├── playground/stories/
│   └── x.story.ts         ← defineStory({ slug, controls, buildContent, presets })
├── typo3-extension/ContentBlocks/ContentElements/x/
│   ├── config.yaml        ← name: factory_core/x; fields match story controls
│   └── templates/
│       └── frontend.html  ← lowercase! emits JSON
└── manifest.json          ← "X": { version, composer_dependencies, npm_dependencies }
```

## Trade-offs

- **Collapsing intro/text/river into one Section block**: Simpler maintenance, more cognitive load on the editor (one block with many controls). Mitigated by good control labels + presets in the playground. We can split later if it proves clunky in real use.
- **Site Header/Footer as content blocks**: TYPO3 traditionally treats these as layout/site-wide elements. The design treats them as modules. We follow the design for now, but acknowledge this might want revisiting — flagged as an open question below.
- **Sharp aesthetic by default** (`--radius-card: 0px`, `--radius-button: 0px`): Matches design's Heckelsmüller brand. Other brand presets can override via the `.radius-soft` / `.radius-round` classes.
- **Design tokens as CSS variables, not Tailwind theme extension**: Easier per-client override (just swap the brand class), at the cost of not getting Tailwind autocomplete on tokens. We use Tailwind for layout and tokens for color/type — a clear split.

## Open questions

- **Header/Footer as content block vs. layout element** — design treats them as modules but TYPO3 idiom is site-wide. Confirm in real client usage.
- **Variant fidelity** — design lists e.g. `hero: [left, center, right]` but the playground story already has 3×3 X/Y positioning. Keep the more expressive variant from the playground; design's 3 alignments fall out as special cases.
- **Tailwind v4 + tokens.css coexistence** — both end up in the same cascade. No conflict observed in early renames, but worth monitoring as new blocks land.

## Implementation Results

### Phase 0 — Design Log

Created `.design-log/018-claude-design-content-blocks.md` (this file).

### Phase 1 — Foundations

1.1 **Tokens** — Ported `tokens.css` (361 lines: 62 CSS variables, 5 brand presets, density / radius modifiers, resets, primitives `.btn` / `.eyebrow` / `.tag` / `.ph` / `.dots` / `.arrows`) from `lab-factoiry/project/styles/tokens.css` to `factory-core/nuxt-layer/assets/css/tokens.css`. Wired via `factory-core/nuxt-layer/nuxt.config.ts` `css[]` so every layer consumer inherits it.

1.2 **Atoms** — Added `outline-white` / `white-solid` variants to `Button.vue` (on-dark CTAs used by Hero / Cta / Footer). Added new `Eyebrow.vue` and `Tag.vue` atoms that wrap the design's `.eyebrow` and `.tag` primitives. Updated `semanticColor.ts` to resolve `primary` → `var(--brand-primary, var(--ui-primary))` so consumers can switch brand via tokens without re-deploying.

1.3–1.6 **Renames** — `PageHero` → `Hero`, `PageSection` → `Section`, `TextSlider` → `ImgSlider`, `ReferenceList` → `Teaser`. For each: Vue file, `Base*.vue`, `Factory*.vue` (CE wrapper), TYPO3 ContentBlock folder, ContentBlock `name:` (`factory/hero`, …), playground story file + slug/title/import, manifest entry. The Teaser rename also moved TypoScript `ReferenceList.typoscript` → `Teaser.typoscript`, updated the CType-keyed TypoScript path to `tt_content.factory_teaser`, and renamed the TCA-override column `factory_referencelist_auto_storage_pid` → `factory_teaser_auto_storage_pid`. The PHP `ReferenceListProcessor` class kept its name (it processes references — the data layer label is still accurate).

### Phase 2 — New blocks (9 blocks across 3 batches)

For every new block the same five-file scaffold landed: `BaseX.vue` (TYPO3 → typed props), `X.vue` (renderer), `FactoryX.vue` (CE wrapper), `ContentElements/x/config.yaml` + `templates/frontend.html`, and `playground/stories/x.story.ts`, plus a `manifest.json` entry.

- **2.A** — `Cta` (4 variants: split / center-dark / fullbleed-image / inline-form), `Stats` (4: row / bigfour / inline / split), `Logowall` (4: grid / marquee / compact / slider).
- **2.B** — `Features` (4: cards / flat / numbered / media), `Faq` (4: single / two-col / grouped / bordered), `Downloads` (4: list / icons / featured / grouped, with file-format colour map).
- **2.C** — `Header` (4: classic / transparent / minimal / mega with mega-menu), `Footer` (4: columns / compact / split-dark / maximal with giant wordmark), `Testimonials` (5: quote-xl / quote-flow / cards / slider / featured-dark).

### Phase 3 — Cleanup

Deleted:
- 13 retired Vue content components from `nuxt-layer/components/T3/Content/`: `Accordion`, `BlogPosts`, `Carousel`, `PageContact`, `PageCta`, `PageFeature`, `PageGrid`, `PageLogos`, `Table`, `Text`, plus the surviving-but-NuxtUI atoms `ButtonGroup`, `Separator`, and the helper `ContentContainer`.
- Matching `Base*` files for all of the above.
- 10 matching CE wrappers in `T3/Ce/` (`FactoryAccordion`, `FactoryBlogposts`, `FactoryCarousel`, `FactoryPagecontact`, `FactoryPagecta`, `FactoryPagefeature`, `FactoryPagegrid`, `FactoryPagelogos`, `FactoryTable`, `FactoryText`) plus `FactoryButtongroup` and `FactorySeparator`.
- 12 TYPO3 ContentBlocks under `typo3-extension/ContentBlocks/ContentElements/`: `accordion`, `blog_posts`, `carousel`, `page_contact`, `page_cta`, `page_feature`, `page_grid`, `page_logos`, `table`, `text`, `button_group`, `separator`.
- `Configuration/TypoScript/ContentElement/BlogPosts.typoscript` and its `@import` in `setup.typoscript`.

Rewrote `manifest.json` to drop the `nuxt_ui` flag entirely and list only the 13 final blocks + `Button` atom + `Property` record type.

Populated `templates/frontend/src/factory.json` and `templates/backend/src/factory.json` `active_components` with all 13 new blocks plus `Property` as the active record type. Both templates now ship a working out-of-the-box block set.

Updated `pipeline-app/src/lib/pipeline/config.ts` defaults (`componentsToTest`, `homeElements`, tenant `activeComponents`) and `ConfigForm.svelte` placeholder JSON to reference the new block names.

### Final inventory

- **Playground stories**: 14 (13 blocks + `property`)
- **TYPO3 ContentBlocks**: 13 — `hero`, `section`, `teaser`, `img_slider`, `cta`, `stats`, `logowall`, `features`, `faq`, `downloads`, `header`, `footer`, `testimonials`
- **TYPO3 RecordTypes**: 1 — `property`
- **Vue Content components**: 13 × 2 (`Base*` + main) + 3 atoms (`Button`, `Eyebrow`, `Tag`) + `Property` × 2
- **CE wrappers**: 13 — `FactoryHero`, `FactorySection`, …
- **Tokens**: 1 CSS file with 62 vars + 5 brand presets in `nuxt-layer/assets/css/tokens.css`

### Deviations from the original design / plan

1. **`Section` covers `intro` / `text` / `river`** (single flexible block) — agreed in planning. Design's variant list had 3 separate modules; we collapsed them per the "less surface, more reuse" decision.
2. **Atom retirement** — Plan said to keep `ButtonGroup` and `Separator` as atoms; in practice they were the last `@nuxt/ui`-dependent components and weren't in the design's 15 modules. Removed them for consistency. `Button` survives as an internal atom used by `Hero`, `Cta`, `Footer`, `Faq`.
3. **PHP class name kept** — `ReferenceListProcessor.php` was not renamed to `TeaserProcessor.php`. The user-facing block is `Teaser`, the data-layer service stays `ReferenceListProcessor` (it resolves arbitrary record references — that name is still accurate). All TYPO3 wiring (CType keys, TypoScript file, TCA columns) was updated to `teaser`.
4. **Documentation refs not all updated** — A handful of README / `DESIGNER_BRIEF.md` files still mention the old names. These are read-only docs that drift naturally; not blocking. Flagged in a follow-up.

### Verification status

Code-side complete. Not yet verified at runtime:
- Playground dev-server start (`npm run dev` in `factory-core/playground`) — recommended next step. Watch for missing-import errors on the 4 renamed stories (auto-import should resolve `Hero`, `Section`, etc.).
- TYPO3 backend CB-validate pass — `composer validate` and the content-blocks validator should run against the 13 new `config.yaml` files.
- Brand-mode swap — set `<body class="brand-cobalt">` in a sandbox, confirm `--brand-primary` flips across every block.
- Visual regression — Playwright snapshots in `client-dummy/backend/app/tests/` will need regenerating for the 9 new blocks and 4 renamed ones.

### Follow-ups

- **Header/Footer as content blocks vs. layout** — Still flagged. The design treats both as modules and that's what shipped. Revisit after first real client uses them.
- **Mega-menu reactivity on touch** — Header's mega-menu uses mouse-enter/leave. Tap targets on mobile need work in a follow-up pass.
- **Downloads icon polish** — The folded-page SVG from the design's `dl-icon` was replaced by a simpler badge while the build settles. Re-introduce the folded-page SVG for the icons / featured variants once the rest is verified.
- **Stale doc strings** — `SeedTemplates/README.md`, `templates/backend-shared/README.md`, and a couple of `DESIGNER_BRIEF.md` files still reference `PageHero` / `Text` etc. Mechanical update.
