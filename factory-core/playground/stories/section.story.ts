import Section from '../../nuxt-layer/components/T3/Content/Section.vue'
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
  slug: 'section',
  title: 'Section',
  description: 'Flexible editorial section with text, media, and layout variants (covers intro / text / river patterns).',

  component: Section,

  controls: {
    mediaPosition: {
      type: 'enum',
      label: 'Media position',
      options: [
        { label: 'Right', value: 'right' },
        { label: 'Left', value: 'left' },
        { label: 'Top', value: 'top' },
        { label: 'Bottom', value: 'bottom' },
        { label: 'None (text only)', value: 'none' }
      ],
      default: 'right'
    },
    mediaWidth: {
      type: 'enum',
      label: 'Media width',
      options: [
        { label: 'Narrow', value: 'narrow' },
        { label: 'Normal', value: 'normal' },
        { label: 'Wide', value: 'wide' }
      ],
      default: 'normal'
    },
    contentAlign: {
      type: 'enum',
      label: 'Content align',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
        { label: 'Right', value: 'right' }
      ],
      default: 'left'
    },
    textMaxWidth: {
      type: 'enum',
      label: 'Text max width',
      options: [
        { label: 'Narrow', value: 'narrow' },
        { label: 'Normal', value: 'normal' },
        { label: 'Wide', value: 'wide' },
        { label: 'Full', value: 'full' }
      ],
      default: 'normal'
    },
    aspectRatio: {
      type: 'enum',
      label: 'Aspect ratio',
      options: [
        { label: '1:1', value: '1/1' },
        { label: '16:9', value: '16/9' },
        { label: '4:3', value: '4/3' },
        { label: '3:2', value: '3/2' },
        { label: 'Auto', value: 'auto' }
      ],
      default: '16/9'
    },

    eyebrow: { type: 'string', label: 'Eyebrow', default: 'Our mission' },
    eyebrowDecoration: {
      type: 'enum',
      label: 'Eyebrow decoration',
      options: [
        { label: 'Bar', value: 'bar' },
        { label: 'Dot', value: 'dot' },
        { label: 'None', value: 'none' }
      ],
      default: 'bar'
    },
    eyebrowColor: {
      type: 'enum',
      label: 'Eyebrow color',
      options: SEMANTIC_COLORS,
      default: 'primary'
    },
    title: {
      type: 'string',
      label: 'Title',
      default: 'Build <strong>beautiful</strong> headless pages.',
      multiline: true
    },
    description: {
      type: 'string',
      label: 'Description',
      default:
        'A shared component library across TYPO3 and Nuxt — so editors and engineers speak the same visual language.',
      multiline: true
    },
    icon: { type: 'string', label: 'Icon (iconify id)', default: '' },

    backgroundType: {
      type: 'enum',
      label: 'Background type',
      options: [
        { label: 'None', value: 'none' },
        { label: 'Color', value: 'color' },
        { label: 'Image', value: 'image' }
      ],
      default: 'none'
    },
    backgroundColor: {
      type: 'enum',
      label: 'Background color',
      options: SEMANTIC_COLORS,
      default: 'neutral'
    },
    backgroundOverlay: {
      type: 'enum',
      label: 'Background overlay',
      options: [
        { label: 'None', value: 'none' },
        { label: 'Light', value: 'light' },
        { label: 'Dark', value: 'dark' }
      ],
      default: 'none'
    },

    captionPosition: {
      type: 'enum',
      label: 'Caption position',
      options: [
        { label: 'Below', value: 'below' },
        { label: 'Overlay', value: 'overlay' }
      ],
      default: 'below'
    },
    showArrows: { type: 'boolean', label: 'Gallery arrows', default: true },
    showPagination: { type: 'boolean', label: 'Gallery pagination', default: true },
    enableLightbox: { type: 'boolean', label: 'Enable lightbox', default: true },

    buttonCount: {
      type: 'number',
      label: 'Button count',
      default: 1,
      min: 0,
      max: 4
    },

    media: {
      type: 'array',
      label: 'Media',
      itemLabel: 'Media',
      itemSchema: {
        type: {
          type: 'enum',
          label: 'Type',
          options: [
            { label: 'Image', value: 'image' },
            { label: 'Video (URL)', value: 'video' }
          ],
          default: 'image'
        },
        seed: { type: 'string', label: 'Image seed', default: 'section-1' },
        caption: { type: 'string', label: 'Caption', default: '' },
        videoUrl: { type: 'string', label: 'Video URL', default: '' }
      },
      default: [{ type: 'image', seed: 'section-1', caption: '', videoUrl: '' }]
    }
  },

  buildContent(values) {
    const media = (values.media || []).map((m: any) =>
      child({
        type: select(m.type),
        image: m.type === 'image' ? placeholderImage(m.seed || 'section', 1600, 900, 'Section') : undefined,
        video_url: m.type === 'video' ? m.videoUrl || undefined : undefined,
        caption: m.caption || undefined
      })
    )

    return {
      content: {
        eyebrow: values.eyebrow || undefined,
        eyebrow_decoration: select(values.eyebrowDecoration),
        eyebrow_color: select(values.eyebrowColor),
        title: values.title || undefined,
        description: values.description || undefined,
        icon: values.icon || undefined,
        buttons: sampleButtons(Number(values.buttonCount) || 0),

        media_position: select(values.mediaPosition),
        media_width: select(values.mediaWidth),
        content_align: select(values.contentAlign),
        text_max_width: select(values.textMaxWidth),

        background_type: select(values.backgroundType),
        background_color: select(values.backgroundColor),
        background_overlay: select(values.backgroundOverlay),

        aspect_ratio: select(values.aspectRatio),
        caption_position: select(values.captionPosition),
        show_arrows: bool(values.showArrows),
        show_pagination: bool(values.showPagination),
        enable_lightbox: bool(values.enableLightbox),

        media
      }
    }
  },

  presets: [
    {
      name: 'Vertical · text only',
      values: {
        mediaPosition: 'none',
        contentAlign: 'center',
        textMaxWidth: 'normal',
        buttonCount: 2,
        media: []
      }
    },
    {
      name: 'Image right · 16:9',
      values: {
        mediaPosition: 'right',
        mediaWidth: 'normal',
        contentAlign: 'left',
        aspectRatio: '16/9',
        buttonCount: 1,
        media: [{ type: 'image', seed: 'image-right', caption: '', videoUrl: '' }]
      }
    },
    {
      name: 'Image left · narrow',
      values: {
        mediaPosition: 'left',
        mediaWidth: 'narrow',
        contentAlign: 'left',
        aspectRatio: '4/3',
        buttonCount: 1,
        media: [{ type: 'image', seed: 'image-left', caption: '', videoUrl: '' }]
      }
    },
    {
      name: 'Gallery · lightbox',
      values: {
        mediaPosition: 'top',
        contentAlign: 'center',
        aspectRatio: '16/9',
        enableLightbox: true,
        showArrows: true,
        showPagination: true,
        buttonCount: 0,
        media: [
          { type: 'image', seed: 'gallery-a', caption: 'Shot A', videoUrl: '' },
          { type: 'image', seed: 'gallery-b', caption: 'Shot B', videoUrl: '' },
          { type: 'image', seed: 'gallery-c', caption: 'Shot C', videoUrl: '' }
        ]
      }
    }
  ]
})
