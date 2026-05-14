import Stats from '../../nuxt-layer/components/T3/Content/Stats.vue'
import { defineStory } from './types'
import { select, child } from '../fixtures/toContent'

const VARIANTS = [
  { label: 'Row (4 KPIs)', value: 'row' },
  { label: 'Big Four (2×2 dark)', value: 'bigfour' },
  { label: 'Inline (dividers)', value: 'inline' },
  { label: 'Split (head + grid)', value: 'split' }
]

const SAMPLE_ITEMS = [
  { value: '120+', label: 'Projekte umgesetzt', sub: 'seit 2015' },
  { value: '18', label: 'Jahre Erfahrung', sub: 'im Digitalen' },
  { value: '42', label: 'Aktive Kunden', sub: 'national & international' },
  { value: '98%', label: 'Kunden-Zufriedenheit', sub: 'aus anonymen Befragungen' }
]

export default defineStory({
  slug: 'stats',
  title: 'Stats',
  description: 'A grid of headline numbers / KPIs in row, big-four, inline, or split layout.',

  component: Stats,

  controls: {
    variant: { type: 'enum', label: 'Variant', options: VARIANTS, default: 'row' },
    eyebrow: { type: 'string', label: 'Eyebrow', default: 'In Zahlen' },
    headline: { type: 'string', label: 'Headline', default: 'Was wir bewegen' },
    intro: {
      type: 'string',
      label: 'Intro',
      default: 'Ein kleiner Ausschnitt aus unserer Arbeit der letzten Jahre.',
      multiline: true
    },
    callout: {
      type: 'string',
      label: 'Callout (bigfour only)',
      default: 'Wir glauben: Zahlen sind nur Kontext. Was zählt, sind die Menschen dahinter.',
      multiline: true
    },
    items: {
      type: 'array',
      label: 'Stats',
      itemLabel: 'Stat',
      itemSchema: {
        value: { type: 'string', label: 'Value', default: '100+' },
        label: { type: 'string', label: 'Label', default: 'Projects' },
        sub: { type: 'string', label: 'Sub', default: '' }
      },
      default: SAMPLE_ITEMS
    }
  },

  buildContent(values) {
    return {
      content: {
        variant: select(values.variant),
        eyebrow: values.eyebrow || undefined,
        headline: values.headline || undefined,
        intro: values.intro || undefined,
        callout: values.variant === 'bigfour' ? values.callout || undefined : undefined,
        items: (values.items || []).map((it: any) =>
          child({ value: it.value, label: it.label, sub: it.sub || undefined })
        )
      }
    }
  },

  presets: [
    { name: 'Row · 4 KPIs', values: { variant: 'row' } },
    { name: 'Big Four · dark', values: { variant: 'bigfour' } },
    { name: 'Inline', values: { variant: 'inline' } },
    { name: 'Split', values: { variant: 'split' } }
  ]
})
