# 009 — TextSlider Content Block

## Background

Factory is migrating its Nuxt UI-based content components to custom Tailwind implementations backed by a shared TYPO3 Content Block. PageHero (#006) and PageSection (#007) are done. The Heckelsmüller Figma introduces a new pattern that neither covers: a section **header** (eyebrow / title / description / optional CTAs) followed by an **image slider** with dot pagination — no text overlay on the slides, no media next to the text.

Figma source: node `47:1219` in file `XSf9bqe4tA6IwvRBYrNlUx` ("Image Slider – Left – Desktop").

## Problem

- PageSection's gallery is subordinate to the text column (1/3–2/3 split) — it's not the section's focal point.
- PageHero is full-bleed and puts text **on** the slide, not above it.
- The Heckelsmüller "Referenzen" pattern wants the slider to be the hero of the section, with the header as the lead-in.

We need a dedicated block so editors don't hack PageSection + a wide aspect ratio to fake it.

## Questions and Answers

1. **What should each slide contain?**
   — Image or video (same media shape as PageSection, minus lightbox for now).

2. **Top-right CTA in the Figma ("ALLE ANZEIGEN →")?**
   — Buttons collection (0–N), same shape as PageHero/PageSection. When the header is left-aligned the buttons render opposite the title (lg: `justify-between`); when centered/right they stack with the text.

3. **Header alignment?**
   — `left | center | right` select, default `left` (matches Figma).

4. **Aspect ratio?**
   — Editor-picked: `16/9` (default), `4/3`, `21/9`, `1/1`, `auto`. Same field shape as PageSection so editors transfer muscle memory.

5. **Version?**
   — v1.0.0 — no manifest bumps beyond 1.0.0 until the whole Factory custom-component library has stabilised.

## Design

### TYPO3 Content Block — `text_slider`

`ContentBlocks/ContentElements/text_slider/config.yaml`:

**Header fields**: `eyebrow`, `eyebrow_decoration` (`none|bar|dot`), `eyebrow_color` (7 semantic), `title` (HTML `<strong>` allowed), `description` (textarea), `text_align` (`left|center|right`), `buttons` (Collection).

**Slider behaviour**: `aspect_ratio` (`auto|16/9|4/3|21/9|1/1`, default `16/9`), `show_arrows`, `show_pagination`, `autoplay`, `loop`.

**Slides** (Collection, `minitems: 1`): `type` (`image|video|video_url`), `image | video | video_url | poster` (mutually exclusive via `displayCond`), `alt`, `caption`.

The slide `type` is richer than PageSection (which collapses video file vs. URL under one `video` type with an optional `video_url` override). Here we split `video_url` into its own enum option so the editor can't upload and URL at the same time by accident.

### Vue layer — two components

Two-layer Base/Content pattern established by #006/#007:

- `BaseTextSlider.vue` — parses `content.content` via shared utilities (`parseFile`, `parseButtons`, `asBool`, `unwrapSelect`), injects a placeholder image (via `useFactoryPlaceholder`) when a slide has `type: image` but no file attached — identical to PageSection's pattern. Exposes a single `uiProps` slot-scope.
- `TextSlider.vue` — consumes `uiProps`, wires `@splidejs/vue-splide` with the same options function as `PageHero.vue` (`type: loop | slide`, `rewind: !loop`, `interval: 6000`, `pauseOnHover: true`).

### Visual details

- **Eyebrow decoration + title accent**: identical to PageSection — a short bar/dot in the accent color, and `<strong>` inside the title styled via `--accent-color` CSS var.
- **Header row**: on `lg`, `flex justify-between items-end` when `text_align === 'left'` so buttons snap to the top-right like in Figma. On mobile / centered / right alignments, buttons wrap under the text column.
- **Pagination dots**: overridden to match Figma — inactive `6×6px` grey pills, active `24×6px` black pill, with a CSS `transition: width 200ms` for the morph. This style lives in scoped `:deep()` rules on `.factory-text-slider` (same pattern as PageSection's pagination override, with different metrics).
- **Slide frame**: fixed `aspect-ratio` CSS (not Tailwind `aspect-*` class, so the `16/9` value coming from TYPO3 can be used verbatim as `16 / 9`).
- **Captions** are always below the slide — no overlay option in v1. Keeps the scope tight; can add later.

### Reuse

Zero new utilities. All of:
- `utils/parseContent.ts` — `parseFile`, `parseButtons`, `asBool`
- `utils/unwrapSelect.ts` — auto-imported
- `utils/semanticColor.ts` — eyebrow decoration + button colors + title accent
- `composables/useFactoryPlaceholder.ts` — seeding fallback
- `components/T3/Content/Button.vue` — header CTAs
- `@splidejs/vue-splide` — slider engine (already a dep for PageHero / PageSection)

### Playground story (per #008)

`factory-core/playground/stories/text-slider.story.ts` — uses `import.meta.glob` auto-registration (no index edit). Controls for every public prop, a `slides` array control (each row: `type`, `seed`, `caption`, `videoUrl`), three presets covering Left/Center/Right alignments and the main aspect ratios. `buildContent` emits the full TYPO3 wire shape via `select`/`bool`/`file`/`child` so the real `BaseTextSlider` parser runs — not a shortcut through fabricated props (per #008's explicit note).

## Implementation Plan

1. TYPO3 Content Block: `config.yaml`, `SeedData.yaml`, `DESIGNER_BRIEF.md`, `templates/Frontend.html` (headless stub).
2. Nuxt layer: `BaseTextSlider.vue` + `TextSlider.vue` under `components/T3/Content/`.
3. `manifest.json` — add `TextSlider` entry (v1.0.0, npm deps: Splide + Iconify).
4. `SeedTemplates/heckelsmueller.json` — append a Referenzen text-slider demo (3 image slides, left-aligned, trailing-arrow "Alle anzeigen" link button). *(2026-05-12: the heckelsmueller seed was migrated out of the public builtins into the private `labor-factory-seeds` library — see DL #014 for the split convention.)*
5. Playground story under `factory-core/playground/stories/`.

## Examples

### config.yaml (slide collection extract)

```yaml
- identifier: slides
  type: Collection
  minitems: 1
  fields:
    - { identifier: type, type: Select, items: [image, video, video_url], default: image }
    - { identifier: image, type: File, displayCond: 'FIELD:type:=:image', ... }
    - { identifier: video, type: File, displayCond: 'FIELD:type:=:video', ... }
    - { identifier: video_url, type: Text, displayCond: 'FIELD:type:=:video_url' }
    - { identifier: poster, type: File, displayCond: 'FIELD:type:!=:image', ... }
    - { identifier: alt, type: Text }
    - { identifier: caption, type: Text }
```

### Parsed `uiProps` shape (from `BaseTextSlider`)

```ts
{
  eyebrow: string | undefined
  eyebrowDecoration: 'none' | 'bar' | 'dot'
  eyebrowColor: SemanticColor
  title: string | undefined     // HTML <strong> allowed
  description: string | undefined
  textAlign: 'left' | 'center' | 'right'
  buttons: ParsedButton[]

  aspectRatio: '16/9' | '4/3' | '21/9' | '1/1' | 'auto'
  showArrows: boolean
  showPagination: boolean
  autoplay: boolean
  loop: boolean

  slides: Array<{
    type: 'image' | 'video' | 'video_url'
    image: ParsedFile | null
    video: ParsedFile | null
    videoUrl: string | undefined
    poster: ParsedFile | null
    alt: string
    caption: string | undefined
    _key: string
  }>
}
```

### Splide options (mirrors PageHero)

```ts
{
  type: ui.loop && ui.slides.length > 1 ? 'loop' : 'slide',
  arrows: ui.showArrows && ui.slides.length > 1,
  pagination: ui.showPagination && ui.slides.length > 1,
  autoplay: ui.autoplay,
  interval: 6000,
  pauseOnHover: true,
  drag: ui.slides.length > 1,
  speed: 600,
  rewind: !ui.loop
}
```

## Trade-offs

✅ **Chose**: dedicated `text_slider` block instead of extending PageSection with a "slider-dominant" layout. PageSection's layout matrix is already dense (`media_position × media_width × aspect_ratio × caption_position × lightbox`); adding a "header-only-above-slider" mode would bloat it further and confuse editors. Two narrow blocks beat one generic one.

✅ **Chose**: `video_url` as its own `type` enum value (not a sibling override of `video`). Forces the editor into one source of truth per slide. Slightly diverges from PageSection's pattern — documented in the brief.

❌ **Rejected**: lightbox for v1. PageSection already owns that interaction; adding it here would mean lifting the lightbox into a shared composable, which is its own refactor. If a client needs image zoom on this block, they can pair it with a PageSection below.

❌ **Rejected**: overlay captions. Figma shows captions below (implied), and the dot pagination already crowds the bottom of the slide. Can be added later as a `caption_position` select like PageSection.

❌ **Rejected**: carousel autoplay for video slides. A video inside an autoplay slider is a UX landmine (two things advancing on their own). Autoplay progresses, but the editor is expected to use still images for autoplay decks.
