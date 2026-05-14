import Downloads from '../../nuxt-layer/components/T3/Content/Downloads.vue'
import { defineStory } from './types'
import { select, child } from '../fixtures/toContent'

const VARIANTS = [
  { label: 'List', value: 'list' },
  { label: 'Icons', value: 'icons' },
  { label: 'Featured', value: 'featured' },
  { label: 'Grouped', value: 'grouped' }
]

const SAMPLE_ITEMS = [
  { title: 'Unternehmens-Broschüre 2026', ext: 'pdf', size: '4.2 MB', desc: 'Leistungen, Referenzen und Team im Überblick.', group: 'Produktinformationen' },
  { title: 'Produktdatenblatt · Massivhaus', ext: 'pdf', size: '1.8 MB', desc: 'Technische Spezifikationen und Materialien.', group: 'Produktinformationen' },
  { title: 'Anfrage-Formular', ext: 'docx', size: '64 KB', desc: 'Vorausgefülltes Formular zum Ausdrucken.', group: 'Formulare & Vorlagen' },
  { title: 'Kalkulations-Vorlage', ext: 'xlsx', size: '128 KB', desc: 'Excel-Template für Kostenschätzung.', group: 'Formulare & Vorlagen' },
  { title: 'Projekt-Galerie (komprimiert)', ext: 'zip', size: '28 MB', desc: 'Alle Projekt-Fotos als ZIP-Download.', group: 'Medien & Präsentationen' },
  { title: 'Firmen-Präsentation', ext: 'pptx', size: '12 MB', desc: 'Kurz-Präsentation für Erstgespräche.', group: 'Medien & Präsentationen' },
  { title: 'Bauplan-Muster', ext: 'dwg', size: '890 KB', desc: 'AutoCAD-Beispielzeichnung.', group: 'Medien & Präsentationen' },
  { title: 'Projekt-Video', ext: 'mp4', size: '86 MB', desc: 'Baustellen-Timelapse (3 min).', group: 'Medien & Präsentationen' }
]

export default defineStory({
  slug: 'downloads',
  title: 'Downloads',
  description: 'Downloadable files with format-coloured icons. List / icons / featured / grouped layouts.',

  component: Downloads,

  controls: {
    variant: { type: 'enum', label: 'Variant', options: VARIANTS, default: 'list' },
    eyebrow: { type: 'string', label: 'Eyebrow', default: 'Downloads' },
    headline: { type: 'string', label: 'Headline', default: 'Unterlagen zum Mitnehmen.' },
    intro: { type: 'string', label: 'Intro', default: 'Datenblätter, Broschüren und Formulare zum Download.', multiline: true },
    items: {
      type: 'array',
      label: 'Files',
      itemLabel: 'File',
      itemSchema: {
        title: { type: 'string', label: 'Title', default: 'File' },
        ext: { type: 'string', label: 'Ext', default: 'pdf' },
        size: { type: 'string', label: 'Size', default: '1 MB' },
        desc: { type: 'string', label: 'Description', default: '' },
        group: { type: 'string', label: 'Group', default: 'Allgemein' }
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
        items: (values.items || []).map((it: any) =>
          child({ title: it.title, ext: it.ext, size: it.size, desc: it.desc || undefined, group: it.group || undefined })
        )
      }
    }
  },

  presets: [
    { name: 'List', values: { variant: 'list' } },
    { name: 'Icons', values: { variant: 'icons' } },
    { name: 'Featured', values: { variant: 'featured' } },
    { name: 'Grouped', values: { variant: 'grouped' } }
  ]
})
