# 008 — Component Playground

## Background

The `factory-core/nuxt-layer` ships a growing set of Vue 3 content components (`PageHero`, `PageSection`, `PageGrid`, …). Previewing any of them required booting the full TYPO3 + Nuxt + Docker stack with seeded CMS data — slow for design iteration, opaque for reviewers, and incapable of surfacing the full variant matrix in one place.

The TYPO3 Content Block UI is the source of truth for editors, but it can't exercise props on its own (it renders what its seeded record contains), and Figma mockups aren't interactive. There was no single surface where a designer or engineer could say "flip this enum and watch the component react."

## Problem

We want an interactive preview environment for layer components that:
- Runs on the host without Docker / TYPO3.
- Exposes every controllable prop as a live widget (enum, boolean, string, number, array of rows).
- Exercises the real production code path (`BasePageHero` / `BasePageSection` parsing of raw TYPO3-shape JSON), not a parallel mock renderer that could drift.
- Makes "add a new component" a one-file operation.
- Shows the generated `content` JSON alongside the preview so editors can copy a shape that matches the wire format.

## Design

### Location

A new Nuxt 4 app at `factory-core/playground/` that `extends: ['../nuxt-layer']`. Standard Nuxt layer pattern — the playground inherits components, composables, utilities, styles, and module wiring from the layer for free.

### Story abstraction

`stories/types.ts` defines `StoryDefinition`:

```ts
interface StoryDefinition<T> {
  slug: string
  title: string
  component: Component
  controls: Record<string, ControlDef>     // enum | boolean | string | number | array
  buildContent: (values: T) => { content: Record<string, any> }
  presets?: { name: string; values: Partial<T> }[]
}
```

Each component gets one `stories/<slug>.story.ts`. `import.meta.glob('./stories/*.story.ts', { eager: true })` auto-registers them; the dynamic route `/components/[slug]` and the sidebar pick them up without edits to any central registry.

### Why `buildContent` emits TYPO3-shape

`BasePageHero` / `BasePageSection` consume `props.content.content` (raw headless-TYPO3 JSON) and parse via `utils/parseContent.ts` (`unwrapSelect`, `parseFile`, `parseButtons`, `asBool`). Stories therefore emit the wire shape so the real parsing pipeline runs:

- Select fields → single-element arrays: `['primary']`
- Booleans → `'1'` / `'0'` strings
- File fields → arrays with `publicUrl` + `properties`

Helpers in `fixtures/toContent.ts` (`select`, `bool`, `file`, `child`) do the wrapping so story authors still write plain values.

### UI layout

Each story page:
- Left: one widget per control (Nuxt UI: `USelectMenu`, `USwitch`, `UInput`, `UTextarea`). `ControlArray` renders add/remove rows for `slides`, `media`, `buttons`.
- Right: `<component :is="story.component" :content="story.buildContent(values)" />` in a scrollable pane.
- Bottom: `<pre>` with the full generated JSON and a copy-to-clipboard button.
- Header: preset buttons snap all controls to curated variants; Reset returns to defaults.

### TYPO3 module handling

The layer registers `@t3headless/nuxt-typo3` unconditionally. Without a real backend, its `initialData` route middleware fails the first request. The playground sets:

```ts
typo3: {
  features: { initInitialData: false, i18nMiddleware: false },
  api: { baseUrl: 'http://localhost/_noop' }
}
```

to neutralize both global middlewares. The module still loads (it registers T3 components), but no network call is attempted.

## Implementation Plan

1. Scaffold `factory-core/playground/`: `package.json`, `nuxt.config.ts`, `tsconfig.json`, `app.vue`, `app.config.ts`, `assets/css/main.css`.
2. Story types + composables: `stories/types.ts`, `composables/usePlaygroundStories.ts` (glob registry), `composables/useStoryState.ts` (reactive defaults, reset, preset application).
3. Control widgets: `components/controls/{ControlEnum,ControlBoolean,ControlString,ControlNumber,ControlArray}.vue`.
4. Shell + story renderer: `components/PlaygroundShell.vue` (sidebar nav), `components/PlaygroundStory.vue` (controls + preview + JSON).
5. Fixtures: `fixtures/toContent.ts`, `fixtures/images.ts`, `fixtures/buttons.ts`.
6. Stories: `stories/page-hero.story.ts`, `stories/page-section.story.ts`.
7. Pages: `pages/index.vue` (story index), `pages/components/[slug].vue` (dynamic renderer).

## Examples

### Adding a new component

Drop one file, nothing else:

```ts
// stories/my-component.story.ts
import MyComponent from '../../nuxt-layer/components/T3/Content/MyComponent.vue'
import { defineStory } from './types'
import { select, bool } from '../fixtures/toContent'

export default defineStory({
  slug: 'my-component',
  title: 'MyComponent',
  component: MyComponent,
  controls: {
    variant: {
      type: 'enum', label: 'Variant',
      options: [{ label: 'Solid', value: 'solid' }, { label: 'Outline', value: 'outline' }],
      default: 'solid'
    }
  },
  buildContent: (v) => ({ content: { variant: select(v.variant) } })
})
```

### Preset snap

```ts
presets: [{
  name: 'Image · fullscreen',
  values: {
    height: 'fullscreen',
    contentPositionX: 'left',
    contentPositionY: 'bottom',
    slides: [{ backgroundType: 'image', overlay: 'dark', textColor: 'light', ... }]
  }
}]
```

One click resets every control to this configuration.

## Trade-offs

✅ **Chose**: extend the layer with a host-side Nuxt app — inherits all styling and component wiring for free, and exercises real code paths.
❌ **Rejected**: Histoire / Storybook — extra tooling surface, Nuxt 4 compatibility is still catching up, and we wanted full control over the rendering container (real layouts, real CSS) without a sandbox iframe.
❌ **Rejected**: render the `Base*` components with fabricated "parsed" props directly — that would bypass `parseContent.ts` and the real TYPO3 shape, so drift between playground and production would go undetected.

✅ **Chose**: `import.meta.glob` auto-registration — zero-touch for new stories.
❌ **Rejected**: a static story manifest — another file to forget on every new component.

✅ **Chose**: `typo3.features.initInitialData: false` to neutralize the middleware cleanly.
❌ **Rejected**: patching the layer's `nuxt.config.ts` to make the TYPO3 module optional — keeps the layer's production contract simple and puts the playground-only concern inside the playground.

## Implementation Results

Built and verified on 2026-04-14.

### Structure shipped

```
factory-core/playground/
  package.json, nuxt.config.ts, tsconfig.json
  app.vue, app.config.ts, assets/css/main.css
  layouts/default.vue
  components/
    PlaygroundShell.vue, PlaygroundStory.vue
    controls/{ControlEnum,ControlBoolean,ControlString,ControlNumber,ControlArray}.vue
  composables/{usePlaygroundStories,useStoryState}.ts
  stories/{types,page-hero.story,page-section.story}.ts
  fixtures/{toContent,images,buttons}.ts
  pages/{index.vue,components/[slug].vue}
  README.md
```

### Stories

- **PageHero**: controls for `height`, `contentPositionX/Y`, arrows/pagination/autoplay/loop, and a `slides` array (each with eyebrow/headline/text/textColor/overlay/backgroundType/backgroundColor/backgroundSeed/buttonCount). Presets: Simple color, Image fullscreen, 3-slide carousel.
- **PageSection**: controls for `mediaPosition`, `mediaWidth`, `contentAlign`, `textMaxWidth`, `aspectRatio`, eyebrow/title/description/icon, background type/color/overlay, caption position, arrows/pagination/lightbox, `buttonCount`, and a `media` array. Presets: Vertical text-only, Image right 16:9, Image left narrow, Gallery lightbox.

### Deviations from plan

- The playground needed `@splidejs/vue-splide` and `@iconify/vue` declared as **direct dependencies**, not inherited from the layer. Without them hoisted to the playground's own `node_modules`, the first SSR request crashed the vite-node worker with `IPC connection closed` (the layer's `file:../nuxt-layer` install did not bring these sub-deps through for Vite to resolve at SSR time). Adding the two deps to `playground/package.json` resolved it.
- Both `typo3.features.initInitialData` and `typo3.features.i18nMiddleware` were disabled (the plan mentioned only the noop baseUrl, which was insufficient — the middleware still tried to fetch and threw).
- `devServer.host` was dropped; Nuxt's default `localhost` binding is what curl and the browser expect.

### Verification

- `npm install && npm run dev` inside `factory-core/playground`.
- `GET /` → 200, renders story index.
- `GET /components/page-hero` → 200, renders PageHero with default preset; toggling `height` / `backgroundType` updates the preview live; adding a slide re-renders Splide.
- `GET /components/page-section` → 200, renders PageSection; flipping `mediaPosition` reverses layout; enabling lightbox makes the image clickable.
- JSON panel updates live and matches the TYPO3 wire shape (`height: ['large']`, `show_arrows: '1'`).
- Server log clean of unhandled errors (only harmless `Duplicated imports "useAppConfig"` warnings from Nitro 2.13).

### Notes for future component stories

- Whenever a new layer component imports a third-party dep that isn't already a transitive dep of Nuxt itself (e.g. chart libraries, date pickers), add it to `playground/package.json` as well — otherwise expect the same IPC-closed SSR crash on the first hit.
- `buildContent` should always run the full TYPO3 shape through `select`/`bool`/`file`/`child` helpers so the `Base*` parser is actually exercised. Resist the temptation to take a shortcut and pass already-parsed props straight to a component — it will pass the preview but diverge from production.
