# Design Log #005 — Section Component Library

## Background

Factory uses a two-tier component architecture: **Base\*** components parse TYPO3 Content Block data into clean props, and **Content** components render those props into HTML. The rendering layer currently uses Nuxt UI v4's `UPage*` components (`UPageHero`, `UPageSection`, `UPageFeature`, `UPageGrid`, `UPageCard`, `UPageCTA`, `UPageLogos`).

These page-level Nuxt UI components are designed for SaaS marketing pages and docs sites. They impose an aesthetic that doesn't match real client designs — validated against the first real client mockup (Heckelsmüller, a construction company). The gap is too wide to bridge with `ui` prop overrides and CSS variables.

## Problem

Every new client design will require fighting Nuxt UI's opinionated layout and styling decisions. We need a rendering layer that:

1. Covers 80%+ of typical business website designs through **variants and props** — not per-client rewrites
2. Uses the **existing factory-settings theming** (OKLCH color palettes, CSS variables, `--ui-primary`, `--ui-secondary`, `--ui-radius`, `--font-sans`)
3. Keeps **Nuxt UI atoms** (UButton, UIcon, UForm, UInput, UTextarea, UAccordion, USeparator) for interactive primitives
4. Stays aligned with the **TYPO3 Content Block field definitions** so editors control the same variation axes
5. Supports **slot-based overrides** for the 20% that variants can't cover

## Questions and Answers

### Q1. Should we create new components or replace existing ones?

**Answer:** Replace the existing Content components in-place. The Base\* layer stays untouched. The Ce\* wrappers stay untouched. Only the rendering components change. This preserves backward compatibility with the TYPO3 Content Block definitions and the factory.json activation contract.

### Q2. What happens to Nuxt UI as a dependency?

**Answer:** `@nuxt/ui` stays as a peer dependency. We continue using it for:
- **Buttons**: `UButton` (used in links/CTAs everywhere)
- **Icons**: `UIcon` (used in features, contact items)
- **Forms**: `UForm`, `UFormField`, `UInput`, `UTextarea` (PageContact)
- **Interactive**: `UAccordion` (Accordion), `UCarousel` (Carousel)
- **Layout**: `UContainer` (consistent max-width)
- **Dividers**: `USeparator` (Header, Separator)

We drop the page-level compositions: `UPageHero`, `UPageSection`, `UPageFeature`, `UPageGrid`, `UPageCard`, `UPageCTA`, `UPageLogos`, `UBlogPosts`, `UBlogPost`.

### Q3. Should the design team define new patterns or validate existing ones?

**Answer:** Validate. The 10 section patterns below are derived from the existing TYPO3 Content Block definitions. The fields are already built — we're designing the rendering layer to be flexible enough to cover multiple visual treatments of the same data structure. The design team should confirm that the variation axes and variant options are sufficient.

### Q4. Is the navbar in scope?

**Answer:** Yes. The `useFactoryNavigation` composable currently depends on Nuxt UI's `NavigationMenuItem` type. We'll define our own type and build a custom navbar component.

## Design

### Architecture — What Changes, What Stays

```
TYPO3 Content Block data
  ↓
Ce* wrapper (unchanged — global registration for nuxt-typo3)
  ↓
Base* component (unchanged — data parsing, slot-based)
  ↓
Content component (REPLACE — custom Tailwind + UButton/UIcon atoms)
  ↓
HTML
```

### Component Rendering Approach

- Semantic HTML (`<section>`, `<article>`, `<header>`, `<nav>`, `<footer>`)
- Tailwind v4 utility classes directly in Vue templates
- CSS variables from factory-settings for theme-dependent values
- `UContainer` for consistent page width
- `UButton` for all link/CTA rendering
- `UIcon` for all icon rendering

---

### Section Pattern Inventory

Each pattern maps 1:1 to an existing TYPO3 Content Block. The variation axes come from the Content Block field definitions — editors already have these controls.

#### 1. Hero (`page_hero`)

Full-width intro section with headline, title, description, CTA buttons, and optional image.

**Variation axes (from Content Block fields):**
| Axis | Values | Effect |
|------|--------|--------|
| `variant` | `default`, `solid`, `soft`, `subtle`, `naked` | Background treatment |
| `orientation` | `vertical`, `horizontal` | Stack vs side-by-side layout |
| `reverse` | `boolean` | Flip image/content order |

**Rendering rules:**
- `vertical`: centered text, stacked content, image below (if present)
- `horizontal`: two-column grid, image beside text
- `solid`: uses `--ui-secondary` background, inverted text colors
- `soft`/`subtle`: elevated/muted background tones
- `naked`: no background, no padding (useful for embedding)

**Slots:**
- `#media` — override the image area
- `#actions` — override the CTA buttons area

---

#### 2. Section (`page_section`)

Two-column content section with headline, title, description, features list, CTA buttons, and optional image.

**Variation axes:**
| Axis | Values | Effect |
|------|--------|--------|
| `orientation` | `vertical`, `horizontal` | Features/image stacking |
| `reverse` | `boolean` | Flip column order |

**Rendering rules:**
- `vertical`: centered header, features in a grid below, image above features if present
- `horizontal`: text+features on one side, image on the other
- Features render as inline items with icon + title + description

**Slots:**
- `#media` — override the image area
- `#features` — override the features list rendering

---

#### 3. Feature (`page_feature`)

Single feature card with icon, title, description, and optional link. Used standalone or composed inside a Section's features list.

**Variation axes:**
| Axis | Values | Effect |
|------|--------|--------|
| `orientation` | `horizontal`, `vertical` | Icon placement (left vs top) |

**Rendering rules:**
- `horizontal`: icon left, text right in a row
- `vertical`: icon top, text below, centered

---

#### 4. Grid (`page_grid`)

Grid of cards, each with icon, title, description, optional image, and optional link. Supports column spanning for layout emphasis.

**Variation axes (per card):**
| Axis | Values | Effect |
|------|--------|--------|
| `variant` | `outline`, `solid`, `soft`, `subtle`, `ghost`, `naked` | Card visual style |
| `orientation` | `vertical`, `horizontal` | Card internal layout |
| `reverse` | `boolean` | Flip card content order |
| `col_span` | `1`, `2`, `3` | Grid column width |
| `highlight` | `boolean` + color | Accent border |
| `spotlight` | `boolean` + color | Hover glow effect |

**Rendering rules:**
- Container uses CSS grid with `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- Cards respect `col_span` for asymmetric layouts
- `outline`: border with rounded corners
- `solid`: filled background with contrasting text
- `ghost`/`naked`: minimal or no chrome
- Clickable cards (when `to` is set) get hover transitions

**Slots:**
- `#card` — override individual card rendering (scoped: card data + index)

---

#### 5. CTA (`page_cta`)

Full-width call-to-action banner with title, description, buttons, and optional image.

**Variation axes:**
| Axis | Values | Effect |
|------|--------|--------|
| `variant` | `outline`, `solid`, `soft`, `subtle`, `naked` | Background treatment |
| `orientation` | `vertical`, `horizontal` | Layout direction |
| `reverse` | `boolean` | Flip content/image order |

**Rendering rules:**
- `solid`: colored background (primary), inverted text
- `outline`: bordered container
- `vertical`: centered text and buttons
- `horizontal`: text + buttons on one side, image on other

---

#### 6. Contact (`page_contact`)

Split section with contact information and a form.

**Variation axes:**
| Axis | Values | Effect |
|------|--------|--------|
| `orientation` | `horizontal`, `vertical` | Side-by-side vs stacked |

**Rendering rules:**
- Contact items render with icon + value, auto-linked for phone/email types
- Form uses `UForm`/`UFormField`/`UInput`/`UTextarea` (Nuxt UI atoms)
- Form grid with `col_span` support for half/full width fields

**Note:** This component already uses custom Tailwind markup (not UPage* components). Minimal changes needed — mostly cleanup and consistency with the new pattern.

---

#### 7. Navbar (new — currently handled in client projects)

Site navigation with logo, menu items, and optional CTA button.

**Variation axes (to define):**
| Axis | Values | Effect |
|------|--------|--------|
| `layout` | `default`, `centered` | Menu positioning |
| `sticky` | `boolean` | Fixed to top on scroll |
| `transparent` | `boolean` | Transparent background over hero |

**New type to replace Nuxt UI's `NavigationMenuItem`:**
```typescript
interface FactoryNavItem {
  label: string
  to: string
  children?: FactoryNavItem[]
}
```

---

#### 8. Footer (currently handled in client projects)

Site footer with navigation links and optional content.

---

#### 9. Logos (`page_logos`)

Logo marquee or grid display.

**Variation axes (to define):**
| Axis | Values | Effect |
|------|--------|--------|
| `marquee` | `boolean` | Scrolling vs static grid |

---

#### 10. BlogPosts (`blog_posts`)

Blog post listing with cards.

---

### Cross-Cutting Variation Axes

These props appear across multiple components with consistent behavior:

| Prop | Type | Values | Behavior |
|------|------|--------|----------|
| `variant` | string | `default`, `solid`, `soft`, `subtle`, `outline`, `ghost`, `naked` | Visual style — background color, border, text color |
| `orientation` | string | `vertical`, `horizontal` | Layout direction — stacked vs side-by-side |
| `reverse` | boolean | `true`, `false` | Flip the content order within the orientation |

**Variant rendering contract:**

| Variant | Background | Text | Border |
|---------|-----------|------|--------|
| `default` | `bg-default` | default | none |
| `solid` | `bg-(--ui-primary)` or `bg-(--ui-secondary)` | inverted | none |
| `soft` | `bg-elevated` | default | none |
| `subtle` | `bg-elevated/50` | default | none |
| `outline` | transparent | default | `border border-default` |
| `ghost` | transparent | default | none |
| `naked` | none | default | none, no padding |

---

### CSS Variable Contract

Components consume these variables (generated by factory-settings from `factory.json`):

| Variable | Source | Usage |
|----------|--------|-------|
| `--ui-primary` | `settings.colors.primary` | Accent color for headlines, icons, buttons |
| `--ui-secondary` | `settings.colors.secondary` | Solid section backgrounds |
| `--ui-radius` | `settings.radius` | Border radius for cards, images |
| `--font-sans` | `settings.fonts.sans` | Body typography |
| `--font-mono` | `settings.fonts.mono` | Code/data typography |
| `--ui-color-primary-{50-950}` | Generated OKLCH palette | Full shade range for gradients, hover states |
| `--ui-color-secondary-{50-950}` | Generated OKLCH palette | Full shade range |

No new CSS variables are needed. The existing factory-settings infrastructure is sufficient.

---

### Slot Contract Summary

| Component | Slots | Purpose |
|-----------|-------|---------|
| Hero | `#media`, `#actions` | Override image area, override CTA buttons |
| Section | `#media`, `#features` | Override image area, override features rendering |
| Grid | `#card` (scoped) | Override individual card rendering |
| CTA | `#media`, `#actions` | Override image area, override CTA buttons |
| Contact | `#form` | Override form rendering |
| Navbar | `#logo`, `#actions` | Override logo, override right-side CTA area |

All components also support a `#default` slot for complete content override.

---

### Example: Same Data, Two Themes

**Theme A** (`factory.json` — Heckelsmüller construction):
```json
{
  "settings": {
    "colors": { "primary": "#B03030", "secondary": "#4E5239" },
    "radius": "0rem",
    "fonts": { "sans": "Open Sans" }
  }
}
```

**Theme B** (`factory.json` — tech startup):
```json
{
  "settings": {
    "colors": { "primary": "#3B82F6", "secondary": "#1E293B" },
    "radius": "0.75rem",
    "fonts": { "sans": "Inter" }
  }
}
```

Same `PageHero` component with `variant="solid"`:
- **Theme A**: Dark olive-green background (`#4E5239`), no border radius, Open Sans, sharp edges
- **Theme B**: Dark navy background (`#1E293B`), rounded corners, Inter, modern feel

No code changes between themes — only `factory.json` settings differ.

---

## Questions for the Design Team

1. **Pattern coverage**: Are these 10 section patterns sufficient to cover 80%+ of client designs? What patterns are missing?
2. **Variant sufficiency**: Are 7 variant styles (`default`, `solid`, `soft`, `subtle`, `outline`, `ghost`, `naked`) enough differentiation, or do specific patterns need additional visual modes?
3. **Spacing control**: Should editors be able to control vertical spacing (`sm`/`md`/`lg`/`xl` padding) per section, or is consistent spacing preferred?
4. **Alignment control**: Should editors be able to set text alignment (`left`/`center`/`right`) per section, or should alignment be determined by variant + orientation?
5. **Navbar patterns**: What navbar layouts appear across client designs? Centered logo? Split nav? Mega menu? Hamburger breakpoint?
6. **Footer patterns**: What footer layouts are common? Multi-column? Simple bar? Newsletter integration?
7. **Color axis per section**: Currently `variant="solid"` always uses `--ui-secondary`. Should sections support choosing between `primary`/`secondary`/`neutral` for their solid background?

## Implementation Plan

### Phase 1 — Reference Implementation
1. Rewrite `PageHero.vue` using custom Tailwind markup + UButton/UIcon atoms
2. Validate against Heckelsmüller mockup and at least one other design style
3. Confirm factory-settings theming works correctly with custom markup

### Phase 2 — Core Components
4. Rewrite `PageSection.vue`
5. Rewrite `PageFeature.vue`
6. Rewrite `PageGrid.vue` (cards)
7. Rewrite `PageCta.vue`

### Phase 3 — Supporting Components
8. Clean up `PageContact.vue` (already mostly custom)
9. Rewrite `PageLogos.vue`
10. Rewrite `BlogPosts.vue`

### Phase 4 — Navigation
11. Define `FactoryNavItem` type, replace `NavigationMenuItem` import
12. Update `useFactoryNavigation.ts` composable
13. Build navbar component in factory-core layer

### Phase 5 — Verification
14. Run Playwright visual regression tests
15. Verify component activation/deactivation via factory.json
16. Test with two different `factory.json` theme configs

## Trade-offs

| Pro | Con |
|-----|-----|
| Full control over rendered HTML and styling | More markup to maintain per component |
| Designs match client expectations without fighting framework | Lose Nuxt UI's built-in accessibility patterns on page sections |
| Same component works across visual themes via CSS variables | Need to implement responsive behavior ourselves |
| Keeps Nuxt UI atoms for interactive primitives | Two styling systems to understand (custom sections + Nuxt UI atoms) |

## Implementation Results

Design team requested skipping the validation step and implementing the full set immediately to evaluate how it feels in practice. All section components, navbar, and footer were rewritten in one pass.

### Files Changed

**Rewritten (UPage* → custom Tailwind + Nuxt UI atoms):**
- [factory-core/nuxt-layer/components/T3/Content/PageHero.vue](factory-core/nuxt-layer/components/T3/Content/PageHero.vue)
- [factory-core/nuxt-layer/components/T3/Content/PageSection.vue](factory-core/nuxt-layer/components/T3/Content/PageSection.vue)
- [factory-core/nuxt-layer/components/T3/Content/PageFeature.vue](factory-core/nuxt-layer/components/T3/Content/PageFeature.vue)
- [factory-core/nuxt-layer/components/T3/Content/PageGrid.vue](factory-core/nuxt-layer/components/T3/Content/PageGrid.vue)
- [factory-core/nuxt-layer/components/T3/Content/PageCta.vue](factory-core/nuxt-layer/components/T3/Content/PageCta.vue)
- [factory-core/nuxt-layer/components/T3/Content/PageContact.vue](factory-core/nuxt-layer/components/T3/Content/PageContact.vue) — already mostly custom, restructured for consistency
- [factory-core/nuxt-layer/components/T3/Content/PageLogos.vue](factory-core/nuxt-layer/components/T3/Content/PageLogos.vue)
- [factory-core/nuxt-layer/components/T3/Content/BlogPosts.vue](factory-core/nuxt-layer/components/T3/Content/BlogPosts.vue)

**New (layout components):**
- [factory-core/nuxt-layer/components/Layout/Navbar.vue](factory-core/nuxt-layer/components/Layout/Navbar.vue) — sticky/transparent props, mobile drawer, slot for actions
- [factory-core/nuxt-layer/components/Layout/Footer.vue](factory-core/nuxt-layer/components/Layout/Footer.vue) — multi-column nav + copyright bar

**Navigation type:**
- [factory-core/nuxt-layer/composables/useFactoryNavigation.ts](factory-core/nuxt-layer/composables/useFactoryNavigation.ts) — removed `NavigationMenuItem` import from `@nuxt/ui`, now exports `FactoryNavItem` interface

**Module + layout:**
- [factory-core/nuxt-layer/lib/register-ce-global.ts](factory-core/nuxt-layer/lib/register-ce-global.ts) — added `addComponentsDir` for `components/Layout` with prefix `Layout`
- [factory-core/nuxt-layer/layouts/default.vue](factory-core/nuxt-layer/layouts/default.vue) — replaced `UHeader`/`UFooter`/`UNavigationMenu` with `<LayoutNavbar />` and `<LayoutFooter />`

**Untouched (as planned):**
- All `Base*.vue` data-parsing components
- All `Ce` wrapper components
- `Accordion.vue`, `ButtonGroup.vue`, `Header.vue`, `Separator.vue`, `Carousel.vue`, `Table.vue`, `Text.vue` (already use atoms only)
- `factory-settings.ts`, `factory-components.ts`, `factory.json` activation contract
- `manifest.json`

### Component Pattern

All rewritten components follow the same skeleton:

```vue
<script setup lang="ts">
import BasePageX from './BasePageX.vue'
defineProps<{ content: any }>()
function variantClasses(variant: string) { /* map variant → Tailwind */ }
</script>

<template>
  <BasePageX :content="content" v-slot="{ uiProps }">
    <section :class="['w-full py-...', variantClasses(uiProps.variant)]">
      <UContainer>
        <!-- semantic markup using Tailwind + UButton/UIcon atoms -->
      </UContainer>
    </section>
  </BasePageX>
</template>
```

### Variant Implementation

Each component implements the variant contract from the design log:

| Variant | Tailwind classes |
|---------|-----------------|
| `default` | (none — transparent) |
| `solid` | `bg-(--ui-primary)` or `bg-(--ui-secondary)` + `text-white` |
| `soft` | `bg-elevated` |
| `subtle` | `bg-elevated/50` |
| `outline` | `border border-default bg-default` |
| `ghost` | `bg-transparent` |
| `naked` | no background, no padding |

### CSS Variable Usage

Components consume the existing factory-settings variables directly via Tailwind v4 arbitrary value syntax:
- `text-(--ui-primary)` for accent text
- `bg-(--ui-primary)` / `bg-(--ui-secondary)` for solid backgrounds
- `rounded-(--ui-radius)` for border radius

No new CSS variables were introduced.

### Slots Implemented

- **Hero**: `#media`, `#actions`
- **Section**: `#media`, `#features`
- **Cta**: `#media`, `#actions`
- **Contact**: `#form`
- **Navbar**: `#logo`, `#actions`
- **Footer**: `#logo`, `#meta`

### Deviations from Design

1. **Footer background**: Plan said "use CSS variable contract." Implementation uses `bg-neutral-900` as a safe Tailwind color since `--ui-bg-inverted` is not guaranteed to exist in the factory-settings output. Can be changed to a CSS variable later if factory-settings adds one.
2. **Mobile navbar**: Implementation uses a simple click-to-toggle mobile drawer (`open` ref). Plan didn't specify behavior. No external state, no transitions — minimal viable mobile menu.
3. **Grid card highlight**: Implementation uses `ring-2` with `--tw-ring-color` set via inline style mapped from the card's `highlightColor` field. Plan mentioned "accent border" but didn't specify the technique.
4. **Spotlight effect**: Field exists in Content Block, but implementation only adds `relative overflow-hidden` to the card. The actual spotlight (mouse-tracking glow) is not implemented — needs JS/CSS interaction work in a follow-up.
5. **Logos marquee**: Implementation uses a CSS keyframe animation in a scoped `<style>` block. Plan didn't specify the technique.

### Verification (To Be Done)

The component code has not yet been built or rendered. Next steps:

1. Run `npm run build` in `client-dummy/frontend/app/src/` (or `test-client-auto`) to verify the rewritten components compile cleanly
2. Run `npm start` and visually verify each Content Element renders against the seeded data
3. Run Playwright visual regression tests in `client-dummy/backend/app/tests/`
4. Test with two different `factory.json` color settings to confirm CSS variable theming works
5. Confirm `<LayoutNavbar />` and `<LayoutFooter />` are auto-imported correctly (the `addComponentsDir` registration needs to take effect)

| Base* layer completely unchanged | Initial rewrite effort for ~8 components |
