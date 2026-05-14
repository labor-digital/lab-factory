import Footer from '../../nuxt-layer/components/T3/Content/Footer.vue'
import { defineStory } from './types'
import { select, child } from '../fixtures/toContent'

const VARIANTS = [
  { label: 'Columns (4-col light)', value: 'columns' },
  { label: 'Compact (single row)', value: 'compact' },
  { label: 'Split (dark)', value: 'split' },
  { label: 'Maximal (giant wordmark)', value: 'maximal' }
]

const COLS = [
  { title: 'Leistungen', links: ['Strategie', 'Design', 'Development', 'Consulting', 'Support'].map((l) => ({ label: l, to: '#' })) },
  { title: 'Unternehmen', links: ['Über uns', 'Team', 'Karriere', 'Presse', 'Kontakt'].map((l) => ({ label: l, to: '#' })) },
  { title: 'Ressourcen', links: ['Blog', 'Case Studies', 'Downloads', 'FAQ', 'Newsletter'].map((l) => ({ label: l, to: '#' })) }
]

export default defineStory({
  slug: 'footer',
  title: 'Footer',
  description: 'Site footer with brand, link columns, address, contacts, social and legal links.',

  component: Footer,

  controls: {
    variant: { type: 'enum', label: 'Variant', options: VARIANTS, default: 'columns' },
    logoText: { type: 'string', label: 'Logo text', default: 'Brand' },
    tagline: { type: 'string', label: 'Tagline', default: 'Kurze Tagline oder Claim, die das Unternehmen beschreibt.', multiline: true },
    claim: { type: 'string', label: 'Claim (split/maximal)', default: 'Lust auf ein Projekt zusammen?', multiline: true },
    address: { type: 'string', label: 'Address', default: 'Musterstraße 12\n80331 München\nDeutschland', multiline: true },
    ctaPrimary: { type: 'string', label: 'CTA Primary', default: 'Kontakt aufnehmen' },
    ctaSecondary: { type: 'string', label: 'CTA Secondary', default: 'Newsletter abonnieren' },
    copyright: { type: 'string', label: 'Copyright', default: '© 2026 Brand. Alle Rechte vorbehalten.' }
  },

  buildContent(values) {
    return {
      content: {
        variant: select(values.variant),
        logo_text: values.logoText || undefined,
        tagline: values.tagline || undefined,
        claim: values.claim || undefined,
        address: values.address || undefined,
        cta_primary: values.ctaPrimary || undefined,
        cta_secondary: values.ctaSecondary || undefined,
        copyright: values.copyright || undefined,
        cols: COLS.map((c) =>
          child({ title: c.title, links: c.links.map((l) => child({ label: l.label, to: l.to })) })
        ),
        contacts: [
          child({ label: '+49 89 123 456 78', to: 'tel:+498912345678' }),
          child({ label: 'hallo@brand.de', to: 'mailto:hallo@brand.de' })
        ],
        socials: ['IN', 'LI', 'XI', 'YT'].map((l) => child({ label: l, to: '#' })),
        legal: ['Impressum', 'Datenschutz', 'AGB', 'Cookies'].map((l) => child({ label: l, to: '#' }))
      }
    }
  },

  presets: [
    { name: 'Columns', values: { variant: 'columns' } },
    { name: 'Compact', values: { variant: 'compact' } },
    { name: 'Split (dark)', values: { variant: 'split' } },
    { name: 'Maximal', values: { variant: 'maximal' } }
  ]
})
