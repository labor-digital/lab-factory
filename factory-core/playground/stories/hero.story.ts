import Hero from '../../nuxt-layer/components/T3/Content/Hero.vue'
import { defineStory } from './types'
import { select, bool, child } from '../fixtures/toContent'
import { placeholderImage } from '../fixtures/images'
import { sampleButtons } from '../fixtures/buttons'

const SEMANTIC_COLORS = [
  { label: 'Primary', value: 'primary' },
  { label: 'Secondary', value: 'secondary' },
  { label: 'Neutral', value: 'neutral' },
  { label: 'Success', value: 'success' },
  { label: 'Info', value: 'info' },
  { label: 'Warning', value: 'warning' },
  { label: 'Error', value: 'error' }
]

export default defineStory({
  slug: 'hero',
  title: 'Hero',
  description: 'Full-bleed hero with optional slides, overlays, and backgrounds.',

  component: Hero,

  controls: {
    height: {
      type: 'enum',
      label: 'Height',
      options: [
        { label: 'Small', value: 'small' },
        { label: 'Medium', value: 'medium' },
        { label: 'Large', value: 'large' },
        { label: 'Fullscreen', value: 'fullscreen' }
      ],
      default: 'medium'
    },
    contentPositionX: {
      type: 'enum',
      label: 'Content · X',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
        { label: 'Right', value: 'right' }
      ],
      default: 'center'
    },
    contentPositionY: {
      type: 'enum',
      label: 'Content · Y',
      options: [
        { label: 'Top', value: 'top' },
        { label: 'Center', value: 'center' },
        { label: 'Bottom', value: 'bottom' }
      ],
      default: 'center'
    },
    showArrows: { type: 'boolean', label: 'Show arrows', default: true },
    showPagination: { type: 'boolean', label: 'Show pagination', default: true },
    autoplay: { type: 'boolean', label: 'Autoplay', default: false },
    loop: { type: 'boolean', label: 'Loop', default: true },

    slides: {
      type: 'array',
      label: 'Slides',
      itemLabel: 'Slide',
      itemSchema: {
        eyebrow: { type: 'string', label: 'Eyebrow', default: 'Featured' },
        headline: { type: 'string', label: 'Headline', default: 'A bold headline.' },
        text: { type: 'string', label: 'Text', default: 'Short supporting copy goes here.', multiline: true },
        textColor: {
          type: 'enum',
          label: 'Text color',
          options: [
            { label: 'Auto', value: 'auto' },
            { label: 'Light', value: 'light' },
            { label: 'Dark', value: 'dark' }
          ],
          default: 'auto'
        },
        overlay: {
          type: 'enum',
          label: 'Overlay',
          options: [
            { label: 'None', value: 'none' },
            { label: 'Light', value: 'light' },
            { label: 'Dark', value: 'dark' }
          ],
          default: 'dark'
        },
        backgroundType: {
          type: 'enum',
          label: 'Background type',
          options: [
            { label: 'Color', value: 'color' },
            { label: 'Image', value: 'image' }
          ],
          default: 'color'
        },
        backgroundColor: {
          type: 'enum',
          label: 'Background color',
          options: SEMANTIC_COLORS,
          default: 'primary'
        },
        backgroundSeed: {
          type: 'string',
          label: 'Image seed',
          default: '1'
        },
        buttonCount: {
          type: 'number',
          label: 'Button count',
          default: 2,
          min: 0,
          max: 4
        }
      },
      default: [
        {
          eyebrow: 'Welcome',
          headline: 'Headless CMS, crafted components.',
          text: 'A design-system foundation for TYPO3 and Nuxt.',
          textColor: 'auto',
          overlay: 'dark',
          backgroundType: 'color',
          backgroundColor: 'primary',
          backgroundSeed: '1',
          buttonCount: 2
        }
      ]
    }
  },

  buildContent(values) {
    const slides = (values.slides || []).map((s: any) =>
      child({
        eyebrow: s.eyebrow || undefined,
        headline: s.headline || undefined,
        text: s.text || undefined,
        text_color: select(s.textColor),
        overlay: select(s.overlay),
        background_type: select(s.backgroundType),
        background_color: select(s.backgroundColor),
        background_image:
          s.backgroundType === 'image' ? placeholderImage(s.backgroundSeed || '1', 1920, 1080, 'Hero') : undefined,
        buttons: sampleButtons(Number(s.buttonCount) || 0)
      })
    )

    return {
      content: {
        height: select(values.height),
        content_position_x: select(values.contentPositionX),
        content_position_y: select(values.contentPositionY),
        show_arrows: bool(values.showArrows),
        show_pagination: bool(values.showPagination),
        autoplay: bool(values.autoplay),
        loop: bool(values.loop),
        slides
      }
    }
  },

  presets: [
    {
      name: 'Simple color',
      values: {
        height: 'medium',
        contentPositionX: 'center',
        contentPositionY: 'center',
        showArrows: false,
        showPagination: false,
        slides: [
          {
            eyebrow: 'New',
            headline: 'Ship faster with Factory.',
            text: 'A shared component library across TYPO3 and Nuxt.',
            textColor: 'auto',
            overlay: 'none',
            backgroundType: 'color',
            backgroundColor: 'primary',
            backgroundSeed: '1',
            buttonCount: 1
          }
        ]
      }
    },
    {
      name: 'Image · fullscreen',
      values: {
        height: 'fullscreen',
        contentPositionX: 'left',
        contentPositionY: 'bottom',
        showArrows: false,
        showPagination: false,
        slides: [
          {
            eyebrow: 'Feature',
            headline: 'Editorially driven pages.',
            text: 'Full-bleed storytelling with on-brand overlays.',
            textColor: 'light',
            overlay: 'dark',
            backgroundType: 'image',
            backgroundColor: 'primary',
            backgroundSeed: 'hero-fullscreen',
            buttonCount: 2
          }
        ]
      }
    },
    {
      name: 'Carousel · 3 slides',
      values: {
        height: 'large',
        showArrows: true,
        showPagination: true,
        autoplay: true,
        loop: true,
        slides: [1, 2, 3].map(i => ({
          eyebrow: `Slide ${i}`,
          headline: `Slide ${i} headline.`,
          text: 'Supporting copy for this slide.',
          textColor: 'light',
          overlay: 'dark',
          backgroundType: 'image',
          backgroundColor: 'primary',
          backgroundSeed: `carousel-${i}`,
          buttonCount: 1
        }))
      }
    }
  ]
})
