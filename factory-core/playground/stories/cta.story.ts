import Cta from '../../nuxt-layer/components/T3/Content/Cta.vue'
import { defineStory } from './types'
import { select, bool, child } from '../fixtures/toContent'
import { placeholderImage } from '../fixtures/images'

const VARIANTS = [
  { label: 'Split (soft brand bg)', value: 'split' },
  { label: 'Center Dark', value: 'center-dark' },
  { label: 'Full-bleed Image', value: 'fullbleed-image' },
  { label: 'Inline Form', value: 'inline-form' }
]

export default defineStory({
  slug: 'cta',
  title: 'Cta',
  description: 'Call-to-action banner with two-tone headline, body, buttons, or inline form.',

  component: Cta,

  controls: {
    variant: { type: 'enum', label: 'Variant', options: VARIANTS, default: 'split' },
    eyebrow: { type: 'string', label: 'Eyebrow', default: 'CALL TO ACTION' },
    titleLight: { type: 'string', label: 'Title (light)', default: 'Bereit für den' },
    titleBold: { type: 'string', label: 'Title (bold)', default: 'nächsten Schritt?' },
    body: {
      type: 'string',
      label: 'Body',
      default: 'Ein kurzer Satz, der den Nutzen klar macht und zur Handlung einlädt.',
      multiline: true
    },
    backgroundSeed: { type: 'string', label: 'Background image seed', default: 'cta-bg' },
    primaryLabel: { type: 'string', label: 'Primary button', default: 'Primäre Aktion' },
    secondaryLabel: { type: 'string', label: 'Secondary button', default: 'Mehr erfahren' },
    showSecondary: { type: 'boolean', label: 'Show secondary', default: true },
    formNote: { type: 'string', label: 'Form note', default: 'Ihre Angaben behandeln wir vertraulich.' }
  },

  buildContent(values) {
    const isFullbleed = values.variant === 'fullbleed-image'
    const isInlineForm = values.variant === 'inline-form'
    const onDark = values.variant === 'center-dark' || values.variant === 'fullbleed-image'

    const buttons = isInlineForm
      ? []
      : [
          child({
            label: values.primaryLabel,
            color: select(onDark ? 'neutral' : 'primary'),
            variant: select(onDark ? 'white-solid' : 'solid'),
            size: select('md')
          }),
          ...(values.showSecondary
            ? [
                child({
                  label: values.secondaryLabel,
                  color: select('primary'),
                  variant: select(onDark ? 'outline-white' : 'outline'),
                  size: select('md')
                })
              ]
            : [])
        ]

    return {
      content: {
        variant: select(values.variant),
        eyebrow: values.eyebrow || undefined,
        title_light: values.titleLight || undefined,
        title_bold: values.titleBold || undefined,
        body: values.body || undefined,
        background_image: isFullbleed
          ? placeholderImage(values.backgroundSeed || 'cta-bg', 1920, 800, 'CTA')
          : undefined,
        buttons,
        form_enabled: bool(isInlineForm),
        form_name_label: 'Name',
        form_mail_label: 'E-Mail-Adresse',
        form_submit_label: 'Absenden',
        form_note: isInlineForm ? values.formNote : undefined
      }
    }
  },

  presets: [
    { name: 'Split · default', values: { variant: 'split' } },
    { name: 'Center Dark', values: { variant: 'center-dark' } },
    { name: 'Full-bleed Image', values: { variant: 'fullbleed-image' } },
    { name: 'Inline Form', values: { variant: 'inline-form' } }
  ]
})
