# 006 — PageHero slider + shared Button component

## Background

Design Log #005 replaced Nuxt UI `UPage*` components with custom Tailwind implementations for Feature / Grid / Section / Cta. PageHero was left on Nuxt UI in that batch. Client designs (Figma file `XSf9bqe4tA6IwvRBYrNlUx`) show a full-bleed hero with multi-slide slider, per-slide backgrounds, and CTA buttons laid out in three content-alignment variants.

The existing hero (single image + title + description + links, Nuxt UI `UPageHero`) can't express this.

## Problem

1. No slider support in the hero — client needs multi-slide rotation.
2. Hero backgrounds are image-only; designs require per-slide color, image, or video.
3. Content positioning is hard-coded vertical/horizontal orientation; designs need 9 positions (3×3 x/y).
4. Button rendering depends on `UButton`; there is no Factory-owned button primitive. Other Tailwind components (PageCta, PageSection, ButtonGroup) also use `UButton` — which keeps Nuxt UI entangled.

## Design

### Component structure

```
PageHero.vue                      ← Tailwind + <Splide> renderer
  ↳ BasePageHero.vue              ← parses TYPO3 JSON → clean ui shape
  ↳ Button.vue                    ← NEW shared button component
      ↳ BaseButton.vue            ← parses button props, v-slot contract
```

### New Button component

- No Nuxt UI. No `UButton`, no `UIcon`.
- Icons via `@iconify/vue` — accepts both `i-lucide-foo` (TYPO3 convention) and `lucide:foo` (Iconify native) names.
- Colors: 7 semantic tokens (primary, secondary, neutral, success, info, warning, error). primary/secondary resolve to CSS vars `--ui-primary` / `--ui-secondary`; the other 5 are hardcoded tailwind-palette values (neutral-900, green-600, blue-600, amber-600, red-600).
- Variants: solid / outline / soft / subtle / ghost / link — same 6 as Nuxt UI for parity.
- Sizes: xs / sm / md / lg / xl.
- Rendered via `<component :is="to ? 'a' : 'button'">` with scoped CSS consuming `--btn-color` / `--btn-contrast` (set inline per instance) — clean, avoids dynamic-class Tailwind purging issues.

### New PageHero component

- `<Splide>` from `@splidejs/vue-splide` wraps 1..n `<SplideSlide>`s.
- Each slide is a `<article>` with 3 stacked layers: background → overlay → content.
- Backgrounds:
  - `color` → div with inline background from the 7-color token map
  - `image` → `<NuxtImg object-cover inset-0>`
  - `video` → `<video autoplay muted loop playsinline>` from upload or external URL
- Overlay: `none` / `dark` (black/40) / `light` (white/40) — separate from text_color.
- Text color: per-slide `auto | light | dark`. Auto → light (white) for all supported backgrounds (all 7 semantic colors are dark enough; image/video default to light and expect overlay if needed).
- Content positioning: `content_position_x` (left/center/right) × `content_position_y` (top/center/bottom) → outer flex `items-*` + `justify-*` classes and inner column `text-*` alignment.
- Height presets: small / medium / large / fullscreen.

### TYPO3 Content Block schema

`page_hero/config.yaml` becomes:
- Hero-level fields: `content_position_x`, `content_position_y`, `height`, `show_arrows`, `show_pagination`, `autoplay`, `loop`.
- `slides` Collection with `minitems: 1`. Per slide: `eyebrow`, `headline`, `text`, `text_color`, `background_type`, `background_color|image|video|video_url` (via `displayCond`), `overlay`, nested `buttons` Collection.
- `SeedData.yaml` provides one default slide so newly-created heroes have content immediately.

### Nuxt UI migration

- `ButtonGroup.vue`, `PageCta.vue`, `PageSection.vue` swap `<UButton>` → `<Button>` (v-bind spread). Other `UIcon` / `UContainer` / utility class usage (`bg-elevated`, `text-default`) stays — removing those is scope for a later pass.

## Decisions (from plan-mode AskUserQuestion)

1. **Splide package**: `@splidejs/vue-splide` (official Vue 3 wrapper).
2. **Text contrast**: editor picks `auto | light | dark` per slide; no runtime brightness detection.
3. **Content position**: two separate selects for X and Y axes (not a single 9-way grid).
4. **Button scope**: build Button + migrate all current Tailwind consumers (ButtonGroup, PageHero, PageCta, PageSection) in the same PR.

## Trade-offs

- **Inline CSS vars for button color**: avoids Tailwind's dynamic-class purging problem and keeps the component's class list static. Cost: ~20 lines of scoped CSS instead of pure Tailwind.
- **Semantic color hex fallbacks**: neutral/success/info/warning/error have hardcoded hex values in Button.vue + PageHero.vue. When a future project needs to override them, we should either (a) expose `--ui-neutral` etc. CSS vars in factory-settings, or (b) add a theme map to `factory.json`. Deferred to a follow-up.
- **displayCond in TYPO3**: relies on Content Blocks' conditional-field support; fields still exist in DB but only some are editable based on `background_type`. Unset fields are ignored by the Nuxt parser.
- **No runtime brightness detection**: sidesteps edge cases (CORS, video sampling) at the cost of one extra manual step for editors placing text on busy images. The `overlay` field is the escape hatch.
- **`UIcon` still used in migrated components**: pure Tailwind migration of PageCta/PageSection/PageFeature/Layout components is a separate design-log. This PR shrinks Nuxt UI surface; it doesn't eliminate it from every migrated file.

## Implementation results

Implemented in this PR:

- Created `factory-core/nuxt-layer/components/T3/Content/BaseButton.vue` + `Button.vue`.
- Rewrote `factory-core/nuxt-layer/components/T3/Content/BasePageHero.vue` (slide collection + background parsing) + `PageHero.vue` (Splide + Tailwind).
- Rewrote `factory-core/typo3-extension/ContentBlocks/ContentElements/page_hero/config.yaml` + `SeedData.yaml`.
- Migrated `ButtonGroup.vue`, `PageCta.vue`, `PageSection.vue` off `<UButton>`.
- Updated `factory-core/manifest.json` (Button added, PageHero bumped to 2.0.0, `nuxt_ui: false`).
- Added `@splidejs/vue-splide` and `@iconify/vue` to `factory-core/nuxt-layer/package.json`.
- Added `page_hero/DESIGNER_BRIEF.md` so designers know the configurable axes.

### Deviations from plan

- Replaced `UIcon` in the new Button with `@iconify/vue`'s `<Icon>` so Button + PageHero are genuinely Nuxt UI-free (the plan originally kept UIcon "for consistency, migrate later"). Rationale: the user's explicit requirement was "works without Nuxt UI", so keeping UIcon in the new component would contradict the goal. One extra npm dep (`@iconify/vue`), zero behavior change for editors.
- Added `height` preset field (small/medium/large/fullscreen) — promoted from "future suggestion" to v1 because the Figma variants already imply a fixed height and hard-coding one class in the component felt wrong for the first real-world usage.

### Future work (flagged in DESIGNER_BRIEF.md)

- Per-slide duration for autoplay
- Slide transition types (fade/zoom)
- Ken-burns / parallax for image backgrounds
- Video poster image + mute/unmute control
- Scroll-down indicator
- Anchor id per slide
- Theme mode override per hero
- Declare `--ui-neutral`, `--ui-success`, etc. as CSS variables in factory-settings so we stop hard-coding hex values
