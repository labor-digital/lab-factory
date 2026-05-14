import Faq from '../../nuxt-layer/components/T3/Content/Faq.vue'
import { defineStory } from './types'
import { select, child } from '../fixtures/toContent'

const VARIANTS = [
  { label: 'Single Column', value: 'single' },
  { label: 'Two Column', value: 'two-col' },
  { label: 'Grouped', value: 'grouped' },
  { label: 'Bordered XL', value: 'bordered' }
]

const SAMPLE_ITEMS = [
  { q: 'Wie lange dauert ein typisches Projekt?', a: 'Die Projektdauer hängt stark vom Umfang ab. Kleinere Websites setzen wir in 4–8 Wochen um, komplexere Plattformen brauchen 3–6 Monate.', group: 'Projekte & Ablauf' },
  { q: 'Arbeiten Sie nach Festpreis oder Aufwand?', a: 'Beides ist möglich. Für klar umrissene Leistungen bieten wir Festpreise an, bei iterativen Projekten rechnen wir nach Aufwand ab.', group: 'Projekte & Ablauf' },
  { q: 'Was passiert nach dem Launch?', a: 'Wir bieten Pflege- und Supportpakete, die Hosting, Updates, Monitoring und kleinere Weiterentwicklungen abdecken.', group: 'Projekte & Ablauf' },
  { q: 'Können wir Inhalte später selbst pflegen?', a: 'Ja. Wir setzen auf CMS-Lösungen, die von Ihrem Team intuitiv bedient werden können.', group: 'Technologie & Betrieb' },
  { q: 'Welche Technologien setzen Sie ein?', a: 'Je nach Projekt: moderne Headless-CMS, statische Site-Generatoren oder TYPO3.', group: 'Technologie & Betrieb' },
  { q: 'Unterstützen Sie bei SEO und Performance?', a: 'Ja. Technisches SEO, saubere Semantik, Core-Web-Vitals sind fester Teil unserer Arbeit.', group: 'Technologie & Betrieb' }
]

export default defineStory({
  slug: 'faq',
  title: 'Faq',
  description: 'Accordion of questions and answers in single / two-col / grouped / bordered layouts.',

  component: Faq,

  controls: {
    variant: { type: 'enum', label: 'Variant', options: VARIANTS, default: 'single' },
    eyebrow: { type: 'string', label: 'Eyebrow', default: 'Häufige Fragen' },
    headline: { type: 'string', label: 'Headline', default: 'Antworten auf Ihre Fragen' },
    intro: { type: 'string', label: 'Intro', default: 'Die wichtigsten Antworten auf einen Blick.', multiline: true },
    contactLabel: { type: 'string', label: 'Contact label', default: 'Frage nicht dabei?' },
    contactMail: { type: 'string', label: 'Contact mail', default: 'hallo@brand.de' },
    contactButton: { type: 'string', label: 'Contact button', default: 'Kontakt aufnehmen' },
    items: {
      type: 'array',
      label: 'Q&A',
      itemLabel: 'Q&A',
      itemSchema: {
        q: { type: 'string', label: 'Question', default: 'Question?' },
        a: { type: 'string', label: 'Answer', default: 'Answer.', multiline: true },
        group: { type: 'string', label: 'Group', default: 'General' }
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
        contact_label: values.contactLabel || undefined,
        contact_mail: values.contactMail || undefined,
        contact_button: values.contactButton || undefined,
        items: (values.items || []).map((it: any) => child({ q: it.q, a: it.a, group: it.group || undefined }))
      }
    }
  },

  presets: [
    { name: 'Single', values: { variant: 'single' } },
    { name: 'Two-col', values: { variant: 'two-col' } },
    { name: 'Grouped', values: { variant: 'grouped' } },
    { name: 'Bordered XL', values: { variant: 'bordered' } }
  ]
})
