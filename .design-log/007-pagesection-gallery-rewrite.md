# 007 — PageSection v2.0.0 (gallery + lightbox + backgrounds)

## Background

Design Log #006 rebuilt PageHero as a Tailwind component with multi-slide + background media. PageSection was still the old Nuxt UI `UPage*` implementation with a features list and a single image. Client Figma designs (nodes `47:727`, `47:754`, `47:768` in file `XSf9bqe4tA6IwvRBYrNlUx`) show a different pattern: text + button + gallery with 3 media-position variants and no features list.

## Problem

The old PageSection couldn't express:
- A gallery of images (single image only).
- Selectable aspect ratios (images were shown at natural size).
- Media positions beyond vertical/horizontal + reverse (Figma wants explicit left/right/top/bottom).
- Section backgrounds (the hero had them; section did not).
- Video in-section (only the hero had video support).
- A lightbox for enlarging cropped imagery.
- Iconified eyebrows / decoration lines for section markers.
- Control over relative media/text column widths.

## Design

### Breaking change

PageSection v2.0.0 is **not backwards-compatible**:
- `features` collection removed. Clients using features should use PageGrid (or re-add the field per-client if needed — v2 is a clean slate).
- `links` renamed to `buttons` (matches Hero / Button Group convention).
- `orientation` + `reverse` replaced with an explicit `media_position` select.
- `headline` renamed to `eyebrow` (matches Hero convention).

Existing content elements must be re-seeded or their DB rows manually migrated — acceptable because the feature is still in development and no client project uses it in production yet.

### New fields

| Field | Values | Purpose |
|---|---|---|
| `icon` | Iconify name | Rendered above eyebrow |
| `eyebrow_decoration` | none/bar/dot | Visual marker next to the eyebrow |
| `eyebrow_color` | 7 semantic | Drives eyebrow + decoration + `<strong>` accent in title |
| `buttons` | Collection | Full Button schema |
| `media_position` | left/right/top/bottom | Explicit axis |
| `media_width` | narrow/normal/wide | 33/50/67 for media column |
| `content_align` | left/center/right | Text alignment inside text column |
| `text_max_width` | narrow/normal/wide/full | For top/bottom layouts only |
| `background_type` | none/color/image | Section-level background |
| `background_color` | 7 semantic | Conditional on type=color |
| `background_image` | File | Conditional on type=image |
| `background_overlay` | none/dark/light | Scrim for readability |
| `media` | Collection (image/video) | Per-item: type, image/video/video_url, poster, alt, caption |
| `aspect_ratio` | auto / 7 preset ratios | Applied to all gallery items |
| `caption_position` | below/overlay/none | Per-section |
| `show_arrows` / `show_pagination` | bool | Slider toggles |
| `enable_lightbox` | bool (default 1) | Click any media to open full-screen modal |

### Layout logic

```
media_position = right  → flex lg:flex-row
media_position = left   → flex lg:flex-row-reverse
media_position = top    → flex flex-col-reverse
media_position = bottom → flex flex-col
```

Media/text width only applies to `left`/`right`:
- `narrow`: media `lg:w-1/3` · text `lg:w-2/3`
- `normal`: `lg:w-1/2` · `lg:w-1/2`
- `wide`:   media `lg:w-2/3` · text `lg:w-1/3`

### Gallery rendering

- `media.length === 1` → render the single item directly (no Splide init — saves ~30KB and an `onMount`).
- `media.length > 1`   → `<Splide>` with `type: loop`, drag-enabled. Arrows/pagination toggled per-field.
- All items fit inside a `<div style="aspect-ratio: X/Y" class="overflow-hidden">` — the ratio is section-wide.
- Clicking any item (when `enable_lightbox`) opens a full-screen modal.

### Lightbox

- Rendered via `<Teleport to="body">` so it sits above any page chrome.
- Full-viewport `fixed inset-0 bg-black/90` overlay.
- Inner `<Splide>` (second instance) with `start: lightboxIndex` — opens at the clicked item.
- Body scroll locked via `document.body.style.overflow = 'hidden'`.
- Keyboard: `Esc` closes, arrow keys navigate.
- Video items autoplay in the lightbox (not in the thumbnail view).
- No new dependency — reuses `@splidejs/vue-splide` already introduced by PageHero.

### Title accent color

The title supports inline `<strong>…</strong>`. A scoped `:deep(strong)` rule consumes a CSS variable (`--accent-color`) set via `:style` from `eyebrow_color`. This lets each section pick its own accent without Tailwind class purging issues:

```vue
<h2 :style="{ '--accent-color': semanticColor(uiProps.eyebrowColor) }" v-html="uiProps.title" />
<style scoped>
h2 :deep(strong) { color: var(--accent-color); }
</style>
```

### Shared utilities

Factored out of `BasePageHero.vue` to avoid drift:
- `utils/parseContent.ts`: `parseFile`, `parseButtons`, `asBool`.
- `utils/semanticColor.ts`: maps semantic name → CSS color (var for primary/secondary, hex for the other 5 until factory-settings exposes them).

Both are consumed by `BasePageHero`, `BasePageSection`, `PageHero`, `PageSection`, and `Button`. `Button.vue`'s color token map was replaced with a single call to `semanticColor()`.

## Decisions (from AskUserQuestion)

1. **Approach**: rewrite PageSection as v2.0.0 (drop features list), not a new component.
2. **Gallery**: Splide slider (reuse hero stack).
3. **Media position axis**: 4 explicit values (left / right / top / bottom).
4. **Aspect ratios**: 7 presets + `auto` (native).

Additionally approved during implementation (all previously-deferred "future suggestions"):
- Image lightbox on click (default on).
- Per-section caption position (`below` / `overlay` / `none`).
- Text column max-width (narrow / normal / wide / full).
- Section background (none / color / image, with overlay).
- Eyebrow / accent color decoupled from `--ui-primary`.
- Icon above eyebrow.
- Video as gallery item (in addition to images) with poster support.
- Media width preset (narrow / normal / wide) for left/right layouts.

## Trade-offs

- **Scope**: v2.0.0 is big. It replaces the old schema entirely and introduces a lot of fields. The alternative was a minimal "PageIntro" and keeping PageSection as-is — rejected because it duplicates ~80% of the fields and leaves a stale component around.
- **Breaking change over soft migration**: the old schema had no real-world usage yet, so a hard break is cheaper than a compatibility shim.
- **Single section-wide aspect ratio**: per-image ratios were considered. Rejected because mixed ratios on a slider look bad and the extra complexity isn't worth it for v1. Editors can split into multiple PageSections if they truly need different crops.
- **Section-level caption position, not per-image**: consistent, easier to reason about. Per-image override deferred.
- **Lightbox reuses Splide (no new dep)**: Splide works well for a read-only lightbox; if we need fancier zoom/pan later we'd consider a dedicated library (medium-zoom, photoswipe) but that's a follow-up.
- **Video background at section level deliberately omitted**: the hero is the place for attention-grabbing motion; sections should not autoplay video (perf + distraction). Video is still available per-item inside the gallery with explicit user-triggered playback.
- **Hardcoded semantic color hexes**: neutral/success/info/warning/error are still hardcoded in `semanticColor.ts`. The proper fix is to emit `--ui-neutral`, `--ui-success`, etc. from factory-settings. Deferred to a dedicated design-log.

## Implementation results

- Created `factory-core/nuxt-layer/utils/parseContent.ts` + `utils/semanticColor.ts`.
- Rewrote `factory-core/typo3-extension/ContentBlocks/ContentElements/page_section/config.yaml` + `SeedData.yaml`.
- Rewrote `factory-core/nuxt-layer/components/T3/Content/BasePageSection.vue` (new parsed shape, placeholder fallback that respects aspect ratio).
- Rewrote `factory-core/nuxt-layer/components/T3/Content/PageSection.vue` (gallery + lightbox + backgrounds; Tailwind-only, no Nuxt UI).
- Refactored `BasePageHero.vue` + `PageHero.vue` + `Button.vue` to consume the new shared utils.
- Bumped PageSection to `2.0.0` in `factory-core/manifest.json` with `nuxt_ui: false` and correct npm deps.
- Added `factory-core/typo3-extension/ContentBlocks/ContentElements/page_section/DESIGNER_BRIEF.md`.

### Deviations from plan

- Did **not** extract a standalone `Lightbox.vue` component. Reason: it's tightly coupled to the section's `media` shape and only needed here for now. If PageGrid or PageHero ever need a lightbox, extracting is mechanical.
- Seed data sets `buttons` → outline variant instead of solid to match Figma. Not strictly a spec deviation but worth noting.

### Follow-up work

- Declare `--ui-neutral`, `--ui-success`, `--ui-info`, `--ui-warning`, `--ui-error` CSS variables in factory-settings so `semanticColor.ts` can stop hard-coding hexes.
- Extract `Lightbox` as a reusable component once a second consumer appears.
- Consider a `PageGallery` standalone block (pure gallery, no text) if designers ask for it.
