import Teaser from '../../nuxt-layer/components/T3/Content/Teaser.vue'
import { defineStory } from './types'
import { select, bool } from '../fixtures/toContent'
import { placeholderImage } from '../fixtures/images'
import { sampleButtons } from '../fixtures/buttons'

const SEMANTIC_COLORS = [
  { label: 'Primary', value: 'primary' },
  { label: 'Secondary', value: 'secondary' },
  { label: 'Neutral', value: 'neutral' }
]

const TAG_OPTIONS = [
  { label: 'NEUBAU', value: 'neubau' },
  { label: 'UMBAU', value: 'umbau' },
  { label: 'SANIERUNG', value: 'sanierung' },
  { label: 'MFH', value: 'mfh' }
]

export default defineStory({
  slug: 'teaser',
  title: 'Teaser',
  description: 'Polymorphic record grid / slider. Each card is rendered via the record type\'s Factory<Type> wrapper.',

  component: Teaser,

  controls: {
    eyebrow: { type: 'string', label: 'Eyebrow', default: 'REFERENZEN' },
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
    eyebrowColor: { type: 'enum', label: 'Eyebrow color', options: SEMANTIC_COLORS, default: 'primary' },
    title: { type: 'string', label: 'Title', default: 'Unsere <strong>Projekte</strong>', multiline: true },
    description: {
      type: 'string',
      label: 'Description',
      default: 'Hier eine Übersicht unserer Projekte. Für ein individuelles Angebot stehen wir jederzeit zur Verfügung.',
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
    buttonCount: { type: 'number', label: 'Header button count', default: 1, min: 0, max: 3 },

    layout: {
      type: 'enum',
      label: 'Layout',
      options: [
        { label: 'Grid', value: 'grid' },
        { label: 'Slider', value: 'slider' }
      ],
      default: 'grid'
    },
    columns: {
      type: 'enum',
      label: 'Columns',
      options: [
        { label: '2', value: '2' },
        { label: '3', value: '3' },
        { label: '4', value: '4' }
      ],
      default: '3'
    },
    aspectRatio: {
      type: 'enum',
      label: 'Aspect ratio',
      options: [
        { label: '4:3', value: '4/3' },
        { label: '16:9', value: '16/9' },
        { label: '1:1', value: '1/1' }
      ],
      default: '4/3'
    },
    showArrows: { type: 'boolean', label: 'Arrows', default: true },
    showPagination: { type: 'boolean', label: 'Pagination dots', default: false },
    autoplay: { type: 'boolean', label: 'Autoplay', default: false },
    loop: { type: 'boolean', label: 'Loop', default: false },
    sliderOverflow: {
      type: 'enum',
      label: 'Slider overflow',
      options: [
        { label: 'Contained', value: 'contained' },
        { label: 'Breakout — right', value: 'breakout-right' },
        { label: 'Breakout — left', value: 'breakout-left' },
        { label: 'Breakout — both sides', value: 'breakout-both' }
      ],
      default: 'contained'
    },
    sliderShowOverflow: {
      type: 'boolean',
      label: 'Show opposite-side peek',
      default: false
    },

    records: {
      type: 'array',
      label: 'Records',
      itemLabel: 'Record',
      itemSchema: {
        recordType: { type: 'string', label: 'Type', default: 'property' },
        title: { type: 'string', label: 'Title', default: 'Property' },
        tag: { type: 'enum', label: 'Tag', options: TAG_OPTIONS, default: 'neubau' },
        tagCustom: { type: 'string', label: 'Tag Override', default: '' },
        listingType: {
          type: 'enum',
          label: 'Listing',
          options: [
            { label: 'Kauf', value: 'buy' },
            { label: 'Miete', value: 'rent' }
          ],
          default: 'buy'
        },
        city: { type: 'string', label: 'City', default: '' },
        areaM2: { type: 'number', label: 'Area (m²)', default: 0 },
        units: { type: 'number', label: 'Units', default: 1 },
        yearCompleted: { type: 'number', label: 'Year Completed', default: 2020 },
        seed: { type: 'string', label: 'Image seed', default: 'ref-1' }
      },
      default: [
        {
          recordType: 'property',
          title: 'Weingut zum Mehrfamilienhaus',
          tag: 'mfh',
          tagCustom: 'NEUBAU & UMBAU',
          listingType: 'buy',
          city: 'Ingelheim',
          areaM2: 640,
          units: 5,
          yearCompleted: 2018,
          seed: 'ref-weingut'
        },
        {
          recordType: 'property',
          title: 'Einfamilienhaus Bodenheim',
          tag: 'neubau',
          tagCustom: '',
          listingType: 'buy',
          city: 'Bodenheim',
          areaM2: 180,
          units: 1,
          yearCompleted: 2018,
          seed: 'ref-bodenheim'
        },
        {
          recordType: 'property',
          title: 'Doppelhaus Nackenheim',
          tag: 'neubau',
          tagCustom: '',
          listingType: 'buy',
          city: 'Nackenheim',
          areaM2: 180,
          units: 2,
          yearCompleted: 2018,
          seed: 'ref-nackenheim'
        }
      ]
    }
  },

  buildContent(values) {
    const records = (values.records || []).map((r: any, i: number) => ({
      _record_type: r.recordType || 'property',
      uid: i + 1,
      title: r.title || '',
      tag: select(r.tag),
      tag_custom: r.tagCustom || '',
      listing_type: select(r.listingType),
      status: select('available'),
      address_city: r.city || undefined,
      area_m2: r.areaM2 || undefined,
      units: r.units || undefined,
      year_completed: r.yearCompleted || undefined,
      hero_image: placeholderImage(r.seed || `ref-${i}`, 800, 600, r.title)
    }))

    return {
      content: {
        eyebrow: values.eyebrow || undefined,
        eyebrow_decoration: select(values.eyebrowDecoration),
        eyebrow_color: select(values.eyebrowColor),
        title: values.title || undefined,
        description: values.description || undefined,
        text_align: select(values.textAlign),
        buttons: sampleButtons(Number(values.buttonCount) || 0),
        layout: select(values.layout),
        columns: select(values.columns),
        aspect_ratio: select(values.aspectRatio),
        show_arrows: bool(values.showArrows),
        show_pagination: bool(values.showPagination),
        autoplay: bool(values.autoplay),
        loop: bool(values.loop),
        slider_overflow: select(values.sliderOverflow),
        slider_show_overflow: bool(values.sliderShowOverflow),
        records
      }
    }
  },

  presets: [
    {
      name: 'Grid · 3 columns · 3 properties (Figma)',
      values: {
        layout: 'grid',
        columns: '3',
        aspectRatio: '4/3',
        textAlign: 'left',
        buttonCount: 1
      }
    },
    {
      name: 'Slider · breakout right · 4 properties (Figma)',
      values: {
        layout: 'slider',
        columns: '3',
        sliderOverflow: 'breakout-right',
        showArrows: true,
        showPagination: false,
        autoplay: false,
        buttonCount: 1,
        records: [
          { recordType: 'property', title: 'Weingut zum Mehrfamilienhaus', tag: 'mfh', tagCustom: 'NEUBAU & UMBAU', listingType: 'buy', city: 'Ingelheim', areaM2: 640, units: 5, yearCompleted: 2018, seed: 'slider-weingut' },
          { recordType: 'property', title: 'Einfamilienhaus Bodenheim', tag: 'neubau', tagCustom: '', listingType: 'buy', city: 'Bodenheim', areaM2: 180, units: 1, yearCompleted: 2018, seed: 'slider-bodenheim' },
          { recordType: 'property', title: 'Doppelhaus Nackenheim', tag: 'neubau', tagCustom: '', listingType: 'buy', city: 'Nackenheim', areaM2: 180, units: 2, yearCompleted: 2018, seed: 'slider-nackenheim' },
          { recordType: 'property', title: 'Stadthaus Mainz', tag: 'sanierung', tagCustom: '', listingType: 'buy', city: 'Mainz', areaM2: 220, units: 1, yearCompleted: 2019, seed: 'slider-mainz' }
        ]
      }
    },
    {
      name: 'Slider · breakout left · 4 properties',
      values: {
        layout: 'slider',
        columns: '3',
        sliderOverflow: 'breakout-left',
        showArrows: true,
        showPagination: false,
        autoplay: false,
        buttonCount: 1,
        records: [
          { recordType: 'property', title: 'Weingut zum Mehrfamilienhaus', tag: 'mfh', tagCustom: 'NEUBAU & UMBAU', listingType: 'buy', city: 'Ingelheim', areaM2: 640, units: 5, yearCompleted: 2018, seed: 'left-weingut' },
          { recordType: 'property', title: 'Einfamilienhaus Bodenheim', tag: 'neubau', tagCustom: '', listingType: 'buy', city: 'Bodenheim', areaM2: 180, units: 1, yearCompleted: 2018, seed: 'left-bodenheim' },
          { recordType: 'property', title: 'Doppelhaus Nackenheim', tag: 'neubau', tagCustom: '', listingType: 'buy', city: 'Nackenheim', areaM2: 180, units: 2, yearCompleted: 2018, seed: 'left-nackenheim' },
          { recordType: 'property', title: 'Stadthaus Mainz', tag: 'sanierung', tagCustom: '', listingType: 'buy', city: 'Mainz', areaM2: 220, units: 1, yearCompleted: 2019, seed: 'left-mainz' }
        ]
      }
    },
    {
      name: 'Slider · breakout both · 4 properties',
      values: {
        layout: 'slider',
        columns: '3',
        sliderOverflow: 'breakout-both',
        showArrows: true,
        showPagination: false,
        autoplay: false,
        buttonCount: 1,
        records: [
          { recordType: 'property', title: 'Weingut zum Mehrfamilienhaus', tag: 'mfh', tagCustom: 'NEUBAU & UMBAU', listingType: 'buy', city: 'Ingelheim', areaM2: 640, units: 5, yearCompleted: 2018, seed: 'both-weingut' },
          { recordType: 'property', title: 'Einfamilienhaus Bodenheim', tag: 'neubau', tagCustom: '', listingType: 'buy', city: 'Bodenheim', areaM2: 180, units: 1, yearCompleted: 2018, seed: 'both-bodenheim' },
          { recordType: 'property', title: 'Doppelhaus Nackenheim', tag: 'neubau', tagCustom: '', listingType: 'buy', city: 'Nackenheim', areaM2: 180, units: 2, yearCompleted: 2018, seed: 'both-nackenheim' },
          { recordType: 'property', title: 'Stadthaus Mainz', tag: 'sanierung', tagCustom: '', listingType: 'buy', city: 'Mainz', areaM2: 220, units: 1, yearCompleted: 2019, seed: 'both-mainz' }
        ]
      }
    },
    {
      name: 'Slider · breakout right + show-overflow · 6 properties',
      values: {
        layout: 'slider',
        columns: '3',
        sliderOverflow: 'breakout-right',
        sliderShowOverflow: true,
        showArrows: true,
        showPagination: false,
        autoplay: false,
        buttonCount: 1,
        records: [
          { recordType: 'property', title: 'Weingut zum Mehrfamilienhaus', tag: 'mfh', tagCustom: 'NEUBAU & UMBAU', listingType: 'buy', city: 'Ingelheim', areaM2: 640, units: 5, yearCompleted: 2018, seed: 'so-weingut' },
          { recordType: 'property', title: 'Einfamilienhaus Bodenheim', tag: 'neubau', tagCustom: '', listingType: 'buy', city: 'Bodenheim', areaM2: 180, units: 1, yearCompleted: 2018, seed: 'so-bodenheim' },
          { recordType: 'property', title: 'Doppelhaus Nackenheim', tag: 'neubau', tagCustom: '', listingType: 'buy', city: 'Nackenheim', areaM2: 180, units: 2, yearCompleted: 2018, seed: 'so-nackenheim' },
          { recordType: 'property', title: 'Stadthaus Mainz', tag: 'sanierung', tagCustom: '', listingType: 'buy', city: 'Mainz', areaM2: 220, units: 1, yearCompleted: 2019, seed: 'so-mainz' },
          { recordType: 'property', title: 'Villa am See', tag: 'neubau', tagCustom: '', listingType: 'buy', city: 'Konstanz', areaM2: 420, units: 1, yearCompleted: 2020, seed: 'so-see' },
          { recordType: 'property', title: 'Altbau Worms', tag: 'sanierung', tagCustom: '', listingType: 'rent', city: 'Worms', areaM2: 120, units: 1, yearCompleted: 2021, seed: 'so-worms' }
        ]
      }
    }
  ]
})
