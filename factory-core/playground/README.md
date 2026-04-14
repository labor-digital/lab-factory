# Factory Playground

Interactive Storybook-style preview for the Vue 3 components shipped by
`factory-core/nuxt-layer`.

## Run

```bash
cd factory-core/playground
npm install
npm run dev
```

Open http://127.0.0.1:3030.

Runs on the host — no Docker, no TYPO3 backend required. The
`@t3headless/nuxt-typo3` module is registered by the layer; the playground
disables its `initInitialData` and `i18nMiddleware` features so no backend
call is attempted.

Note: `@splidejs/vue-splide` and `@iconify/vue` are declared as direct
dependencies of the playground even though they come in via the layer.
Without them hoisted to the playground's own `node_modules`, SSR crashes
with `IPC connection closed` during the first request.

## Adding a component

Drop a new file `stories/<slug>.story.ts` that default-exports a
`StoryDefinition`. The dynamic `/components/[slug]` route and the sidebar pick
it up automatically via `import.meta.glob`.

Minimal template:

```ts
import MyComponent from '../../nuxt-layer/components/T3/Content/MyComponent.vue'
import { defineStory } from './types'
import { select, bool } from '../fixtures/toContent'

export default defineStory({
  slug: 'my-component',
  title: 'MyComponent',
  component: MyComponent,
  controls: {
    variant: {
      type: 'enum',
      label: 'Variant',
      options: [
        { label: 'Solid', value: 'solid' },
        { label: 'Outline', value: 'outline' }
      ],
      default: 'solid'
    }
  },
  buildContent(values) {
    return {
      content: {
        variant: select(values.variant)
      }
    }
  }
})
```

## Why the `buildContent` wrapper?

The styled components (e.g. `PageHero`, `PageSection`) internally use their
`Base*` counterparts, which parse raw TYPO3-headless JSON via
`utils/parseContent.ts`. To exercise the real parsing pipeline — not a
mocked-around shortcut — stories emit the TYPO3 wire shape:

- Select fields → single-element arrays: `['primary']`
- Booleans → `'1'` / `'0'` strings
- File fields → arrays with `publicUrl` + `properties`

The helpers in `fixtures/toContent.ts` (`select`, `bool`, `file`, `child`) do
that wrapping so story authors can work with plain values.

## Control types

- `enum` — `USelectMenu`
- `boolean` — `USwitch`
- `string` — `UInput` (or `UTextarea` when `multiline: true`)
- `number` — `UInput type="number"`
- `array` — add/remove rows, each row follows `itemSchema`

## Structure

```
playground/
  nuxt.config.ts            extends ../nuxt-layer
  app.vue / layouts/
  components/
    PlaygroundShell.vue     sidebar + outlet
    PlaygroundStory.vue     controls + preview + JSON pane
    controls/*              one component per control type
  composables/
    usePlaygroundStories.ts glob-based story registry
    useStoryState.ts        reactive values, reset, presets
  stories/
    types.ts                StoryDefinition & ControlDef types
    *.story.ts              one file per component
  fixtures/
    toContent.ts            select/bool/file/child helpers
    images.ts               picsum placeholder file()s
    buttons.ts              sample button arrays
  pages/
    index.vue               story index
    components/[slug].vue   dynamic story renderer
```
