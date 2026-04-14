import TextSlider from '../../nuxt-layer/components/T3/Content/TextSlider.vue'
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
  slug: 'text-slider',
  title: 'TextSlider',
  description: 'Header text block followed by an image/video slider with dot pagination.',

  component: TextSlider,

  controls: {
    eyebrow: { type: 'string', label: 'Eyebrow', default: 'Referenzen' },
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
      default: 'Unsere <strong>Projekte</strong>',
      multiline: true
    },
    description: {
      type: 'string',
      label: 'Description',
      default:
        'Hier eine Übersicht unserer Projekte. Für ein individuelles Angebot stehen wir jederzeit zur Verfügung.',
      multiline: true
    },
    textAlign: {
      type: 'enum',
      label: 'Header alignment',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
        { label: 'Right', value: 'right' }
      ],
      default: 'left'
    },
    aspectRatio: {
      type: 'enum',
      label: 'Aspect ratio',
      options: [
        { label: '16:9', value: '16/9' },
        { label: '4:3', value: '4/3' },
        { label: '21:9', value: '21/9' },
        { label: '1:1', value: '1/1' },
        { label: 'Auto', value: 'auto' }
      ],
      default: '16/9'
    },
    showArrows: { type: 'boolean', label: 'Arrows', default: false },
    showPagination: { type: 'boolean', label: 'Pagination dots', default: true },
    autoplay: { type: 'boolean', label: 'Autoplay', default: false },
    loop: { type: 'boolean', label: 'Loop', default: true },

    buttonCount: {
      type: 'number',
      label: 'Header button count',
      default: 1,
      min: 0,
      max: 3
    },

    slides: {
      type: 'array',
      label: 'Slides',
      itemLabel: 'Slide',
      itemSchema: {
        type: {
          type: 'enum',
          label: 'Type',
          options: [
            { label: 'Image', value: 'image' },
            { label: 'Video (URL)', value: 'video_url' }
          ],
          default: 'image'
        },
        seed: { type: 'string', label: 'Image seed', default: 'slider-1' },
        caption: { type: 'string', label: 'Caption', default: '' },
        videoUrl: { type: 'string', label: 'Video URL', default: '' }
      },
      default: [
        { type: 'image', seed: 'slider-a', caption: 'Wohnhaus in Nackenheim', videoUrl: '' },
        { type: 'image', seed: 'slider-b', caption: 'Sanierung Altbau', videoUrl: '' },
        { type: 'image', seed: 'slider-c', caption: 'Neubau Reihenhaus', videoUrl: '' }
      ]
    }
  },

  buildContent(values) {
    const slides = (values.slides || []).map((s: any) =>
      child({
        type: select(s.type),
        image: s.type === 'image' ? placeholderImage(s.seed || 'slider', 1600, 900, 'Slide') : undefined,
        video_url: s.type === 'video_url' ? s.videoUrl || undefined : undefined,
        caption: s.caption || undefined,
        alt: s.caption || undefined
      })
    )

    return {
      content: {
        eyebrow: values.eyebrow || undefined,
        eyebrow_decoration: select(values.eyebrowDecoration),
        eyebrow_color: select(values.eyebrowColor),
        title: values.title || undefined,
        description: values.description || undefined,
        text_align: select(values.textAlign),
        buttons: sampleButtons(Number(values.buttonCount) || 0),

        aspect_ratio: select(values.aspectRatio),
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
      name: 'Left · 3 images · dots',
      values: {
        textAlign: 'left',
        aspectRatio: '16/9',
        showArrows: false,
        showPagination: true,
        autoplay: false,
        loop: true,
        buttonCount: 1,
        slides: [
          { type: 'image', seed: 'preset-left-a', caption: 'Projekt A', videoUrl: '' },
          { type: 'image', seed: 'preset-left-b', caption: 'Projekt B', videoUrl: '' },
          { type: 'image', seed: 'preset-left-c', caption: 'Projekt C', videoUrl: '' }
        ]
      }
    },
    {
      name: 'Centered · 4:3 · autoplay loop',
      values: {
        textAlign: 'center',
        aspectRatio: '4/3',
        showArrows: false,
        showPagination: true,
        autoplay: true,
        loop: true,
        buttonCount: 0,
        slides: [
          { type: 'image', seed: 'preset-center-a', caption: '', videoUrl: '' },
          { type: 'image', seed: 'preset-center-b', caption: '', videoUrl: '' },
          { type: 'image', seed: 'preset-center-c', caption: '', videoUrl: '' },
          { type: 'image', seed: 'preset-center-d', caption: '', videoUrl: '' }
        ]
      }
    },
    {
      name: 'Right · 21:9 · arrows only',
      values: {
        textAlign: 'right',
        aspectRatio: '21/9',
        showArrows: true,
        showPagination: false,
        autoplay: false,
        loop: false,
        buttonCount: 2,
        slides: [
          { type: 'image', seed: 'preset-right-a', caption: 'Panorama A', videoUrl: '' },
          { type: 'image', seed: 'preset-right-b', caption: 'Panorama B', videoUrl: '' }
        ]
      }
    }
  ]
})
