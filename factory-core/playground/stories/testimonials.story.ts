import Testimonials from '../../nuxt-layer/components/T3/Content/Testimonials.vue'
import { defineStory } from './types'
import { select, child } from '../fixtures/toContent'
import { placeholderImage } from '../fixtures/images'

const VARIANTS = [
  { label: 'Quote XL', value: 'quote-xl' },
  { label: 'Quote Flow', value: 'quote-flow' },
  { label: 'Cards', value: 'cards' },
  { label: 'Slider', value: 'slider' },
  { label: 'Featured (dark)', value: 'featured' }
]

const SAMPLE_ITEMS = [
  { quote: 'Die Zusammenarbeit war von Anfang an professionell und hat unseren Auftritt auf ein neues Niveau gehoben.', name: 'Martina Keller', role: 'Leitung Marketing', company: 'Keller & Partner' },
  { quote: 'Klare Kommunikation, pünktliche Lieferung, hochwertiges Ergebnis. Genau das, was wir gebraucht haben.', name: 'Stefan Brandl', role: 'Geschäftsführer', company: 'Brandl Industrie' },
  { quote: 'Ein Partner, der zuhört und dann mutig Dinge vorschlägt, die man selbst nicht gesehen hat.', name: 'Julia Weiss', role: 'Head of Brand', company: 'Weiss Consulting' },
  { quote: 'Wir haben mit anderen Agenturen gearbeitet. Der Unterschied war sofort spürbar.', name: 'Robert Hoffmann', role: 'CTO', company: 'Hoffmann Systems' }
]

const LONG_QUOTE = 'Was uns wirklich überzeugt hat, war die Mischung aus analytischer Tiefe und gestalterischer Freiheit. Das Team hat sich ernsthaft in unsere Prozesse eingearbeitet, bevor ein einziger Entwurf auf dem Tisch lag. Das Ergebnis ist eine Website, die nicht nur gut aussieht, sondern messbar funktioniert.'

export default defineStory({
  slug: 'testimonials',
  title: 'Testimonials',
  description: 'Customer quotes in five layouts. Single XL, long flow, 3-col cards, image+quote slider, featured dark.',

  component: Testimonials,

  controls: {
    variant: { type: 'enum', label: 'Variant', options: VARIANTS, default: 'quote-xl' },
    eyebrow: { type: 'string', label: 'Eyebrow', default: 'Kundenstimmen' },
    headline: { type: 'string', label: 'Headline', default: 'Was unsere Kunden sagen' },
    intro: { type: 'string', label: 'Intro', default: 'Echte Stimmen aus abgeschlossenen Projekten.', multiline: true },
    longQuote: { type: 'string', label: 'Long-form Quote', default: LONG_QUOTE, multiline: true },
    itemCount: { type: 'number', label: 'Item count', default: 4, min: 1, max: 6 }
  },

  buildContent(values) {
    const count = Math.max(1, Math.min(SAMPLE_ITEMS.length, Number(values.itemCount) || 4))
    const useMedia = values.variant === 'slider' || values.variant === 'featured'
    return {
      content: {
        variant: select(values.variant),
        eyebrow: values.eyebrow || undefined,
        headline: values.headline || undefined,
        intro: values.intro || undefined,
        long_quote: values.variant === 'quote-flow' ? values.longQuote : undefined,
        items: SAMPLE_ITEMS.slice(0, count).map((it, i) =>
          child({
            quote: it.quote,
            name: it.name,
            role: it.role,
            company: it.company,
            avatar: placeholderImage(`avatar-${i}`, 200, 200, it.name.slice(0, 2)),
            media: useMedia ? placeholderImage(`portrait-${i}`, 800, 1000, `${it.name.split(' ')[0]}`) : undefined
          })
        )
      }
    }
  },

  presets: [
    { name: 'Quote XL', values: { variant: 'quote-xl', itemCount: 1 } },
    { name: 'Quote Flow', values: { variant: 'quote-flow', itemCount: 1 } },
    { name: 'Cards', values: { variant: 'cards', itemCount: 3 } },
    { name: 'Slider', values: { variant: 'slider', itemCount: 4 } },
    { name: 'Featured', values: { variant: 'featured', itemCount: 1 } }
  ]
})
