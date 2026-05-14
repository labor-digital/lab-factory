import Logowall from '../../nuxt-layer/components/T3/Content/Logowall.vue'
import { defineStory } from './types'
import { select, child } from '../fixtures/toContent'

const VARIANTS = [
  { label: 'Grid', value: 'grid' },
  { label: 'Marquee', value: 'marquee' },
  { label: 'Compact', value: 'compact' },
  { label: 'Slider', value: 'slider' }
]

const COLUMNS = [
  { label: '3', value: '3' },
  { label: '4', value: '4' },
  { label: '5', value: '5' },
  { label: '6', value: '6' }
]

const PER_PAGE = [
  { label: '4', value: '4' },
  { label: '6', value: '6' },
  { label: '8', value: '8' }
]

export default defineStory({
  slug: 'logowall',
  title: 'Logowall',
  description: 'Grid / marquee / compact / slider of client logos. Use placeholder cells until real SVGs land.',

  component: Logowall,

  controls: {
    variant: { type: 'enum', label: 'Variant', options: VARIANTS, default: 'grid' },
    eyebrow: { type: 'string', label: 'Eyebrow', default: 'Kunden & Partner' },
    headline: { type: 'string', label: 'Headline', default: 'Unternehmen, die auf uns vertrauen.' },
    intro: { type: 'string', label: 'Intro', default: 'Eine Auswahl unserer Auftraggeber.', multiline: true },
    columns: { type: 'enum', label: 'Columns (grid)', options: COLUMNS, default: '6' },
    perPage: { type: 'enum', label: 'Per page (slider)', options: PER_PAGE, default: '6' },
    logoCount: { type: 'number', label: 'Logo count', default: 12, min: 1, max: 24 }
  },

  buildContent(values) {
    const count = Number(values.logoCount) || 12
    const logos = Array.from({ length: count }, (_, i) =>
      child({
        label: `Logo ${String(i + 1).padStart(2, '0')}`,
        image: undefined,
        url: undefined
      })
    )

    return {
      content: {
        variant: select(values.variant),
        eyebrow: values.eyebrow || undefined,
        headline: values.headline || undefined,
        intro: values.intro || undefined,
        columns: select(String(values.columns)),
        per_page: select(String(values.perPage)),
        logos
      }
    }
  },

  presets: [
    { name: 'Grid · 6-col', values: { variant: 'grid', columns: '6' } },
    { name: 'Marquee', values: { variant: 'marquee' } },
    { name: 'Compact', values: { variant: 'compact' } },
    { name: 'Slider · 6/page', values: { variant: 'slider', perPage: '6' } }
  ]
})
