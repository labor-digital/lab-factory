import Features from '../../nuxt-layer/components/T3/Content/Features.vue'
import { defineStory } from './types'
import { select, child } from '../fixtures/toContent'
import { placeholderImage } from '../fixtures/images'

const VARIANTS = [
  { label: 'Cards (3-col)', value: 'cards' },
  { label: 'Flat (3-col)', value: 'flat' },
  { label: 'Numbered', value: 'numbered' },
  { label: 'Media (with image)', value: 'media' }
]

const SAMPLE_ITEMS = [
  { num: '01', title: 'Strategie & Konzept', text: 'Wir analysieren Zielgruppen, Wettbewerb und Potenziale.', linkLabel: 'Mehr erfahren', icon: 'i-lucide-target' },
  { num: '02', title: 'Design & Gestaltung', text: 'Identitäten, Interfaces, Druckstücke mit Haltung.', linkLabel: 'Mehr erfahren', icon: 'i-lucide-palette' },
  { num: '03', title: 'Development', text: 'Saubere, performante Websites und Web-Apps.', linkLabel: 'Mehr erfahren', icon: 'i-lucide-code' },
  { num: '04', title: 'Beratung & Workshops', text: 'Strukturierte Begleitung mit klaren Ergebnissen.', linkLabel: 'Mehr erfahren', icon: 'i-lucide-users' },
  { num: '05', title: 'Content & Redaktion', text: 'Texte, die tragen. Recherche, Redaktion, Pflege.', linkLabel: 'Mehr erfahren', icon: 'i-lucide-pen-tool' },
  { num: '06', title: 'Support & Wartung', text: 'Regelmäßige Updates, Monitoring, Ansprechpartner.', linkLabel: 'Mehr erfahren', icon: 'i-lucide-life-buoy' }
]

export default defineStory({
  slug: 'features',
  title: 'Features',
  description: 'Grid of feature cards in cards / flat / numbered / media variants.',

  component: Features,

  controls: {
    variant: { type: 'enum', label: 'Variant', options: VARIANTS, default: 'cards' },
    eyebrow: { type: 'string', label: 'Eyebrow', default: 'Leistungen' },
    headline: { type: 'string', label: 'Headline', default: 'Was wir für Sie tun' },
    intro: { type: 'string', label: 'Intro', default: 'Kurzer einleitender Satz, der die Leistungen einordnet.', multiline: true },
    items: {
      type: 'array',
      label: 'Items',
      itemLabel: 'Feature',
      itemSchema: {
        num: { type: 'string', label: 'Num', default: '01' },
        title: { type: 'string', label: 'Title', default: 'Feature' },
        text: { type: 'string', label: 'Text', default: 'Description', multiline: true },
        linkLabel: { type: 'string', label: 'Link', default: 'Mehr erfahren' },
        icon: { type: 'string', label: 'Icon', default: 'i-lucide-star' }
      },
      default: SAMPLE_ITEMS
    }
  },

  buildContent(values) {
    const isMedia = values.variant === 'media'
    return {
      content: {
        variant: select(values.variant),
        eyebrow: values.eyebrow || undefined,
        headline: values.headline || undefined,
        intro: values.intro || undefined,
        items: (values.items || []).map((it: any, i: number) =>
          child({
            num: it.num || undefined,
            title: it.title,
            text: it.text,
            icon: it.icon || undefined,
            image: isMedia ? placeholderImage(`feature-${i}`, 800, 600, `F${i + 1}`) : undefined,
            link_label: it.linkLabel || undefined
          })
        )
      }
    }
  },

  presets: [
    { name: 'Cards · 6 items', values: { variant: 'cards' } },
    { name: 'Flat · 3 items', values: { variant: 'flat', items: SAMPLE_ITEMS.slice(0, 3) } },
    { name: 'Numbered', values: { variant: 'numbered' } },
    { name: 'Media', values: { variant: 'media', items: SAMPLE_ITEMS.slice(0, 3) } }
  ]
})
