import Header from '../../nuxt-layer/components/T3/Content/Header.vue'
import { defineStory } from './types'
import { select, bool, child } from '../fixtures/toContent'

const VARIANTS = [
  { label: 'Classic', value: 'classic' },
  { label: 'Transparent', value: 'transparent' },
  { label: 'Minimal', value: 'minimal' },
  { label: 'Mega', value: 'mega' }
]

const SAMPLE_LINKS = [
  { label: 'HOME', to: '/', active: false, children: [] },
  { label: 'ÜBER UNS', to: '/uns', active: false, children: [] },
  {
    label: 'LEISTUNGEN', to: '/leistungen', active: true,
    children: [
      { group: 'Kategorie A', label: 'Leistung Eins', to: '#' },
      { group: 'Kategorie A', label: 'Leistung Zwei', to: '#' },
      { group: 'Kategorie A', label: 'Leistung Drei', to: '#' },
      { group: 'Kategorie B', label: 'Leistung Vier', to: '#' },
      { group: 'Kategorie B', label: 'Leistung Fünf', to: '#' },
      { group: 'Kategorie C', label: 'Leistung Sieben', to: '#' }
    ]
  },
  { label: 'REFERENZEN', to: '/referenzen', active: false, children: [] },
  { label: 'KONTAKT', to: '/kontakt', active: false, children: [] }
]

export default defineStory({
  slug: 'header',
  title: 'Header',
  description: 'Site header with logo, primary nav, and CTA. Classic / transparent / minimal / mega.',

  component: Header,

  controls: {
    variant: { type: 'enum', label: 'Variant', options: VARIANTS, default: 'classic' },
    logoText: { type: 'string', label: 'Logo text', default: 'Brand' },
    ctaLabel: { type: 'string', label: 'CTA label', default: 'Kontakt' }
  },

  buildContent(values) {
    return {
      content: {
        variant: select(values.variant),
        logo_text: values.logoText || undefined,
        cta_label: values.ctaLabel || undefined,
        links: SAMPLE_LINKS.map((l) =>
          child({
            label: l.label,
            to: l.to,
            active: bool(l.active),
            children: l.children.map((c) => child({ group: c.group, label: c.label, to: c.to }))
          })
        )
      }
    }
  },

  presets: [
    { name: 'Classic', values: { variant: 'classic' } },
    { name: 'Transparent', values: { variant: 'transparent' } },
    { name: 'Minimal', values: { variant: 'minimal' } },
    { name: 'Mega', values: { variant: 'mega' } }
  ]
})
