import Property from '../../nuxt-layer/components/T3/Content/Property.vue'
import { defineStory } from './types'
import { select } from '../fixtures/toContent'
import { placeholderImage } from '../fixtures/images'

const TAG_OPTIONS = [
  { label: 'NEUBAU', value: 'neubau' },
  { label: 'UMBAU', value: 'umbau' },
  { label: 'SANIERUNG', value: 'sanierung' },
  { label: 'BESTAND', value: 'bestand' },
  { label: 'DENKMAL', value: 'denkmal' },
  { label: 'GEWERBE', value: 'gewerbe' },
  { label: 'MEHRFAMILIENHAUS', value: 'mfh' }
]

const STATUS_OPTIONS = [
  { label: 'Neu', value: 'new' },
  { label: 'Verfügbar', value: 'available' },
  { label: 'Reserviert', value: 'reserved' },
  { label: 'Verkauft / Vermietet', value: 'sold' }
]

export default defineStory({
  slug: 'property',
  title: 'Property',
  description: 'A real-estate record — card on the left, detail stack on the right (toggle variant).',

  component: Property,

  controls: {
    variant: {
      type: 'enum',
      label: 'Variant',
      options: [
        { label: 'Card (list view)', value: 'card' },
        { label: 'Detail (full page)', value: 'detail' }
      ],
      default: 'card'
    },
    title: { type: 'string', label: 'Title', default: 'Weingut zum Mehrfamilienhaus' },
    teaser: {
      type: 'string',
      label: 'Teaser',
      default: 'Sanierter Weingut-Hof mit fünf Wohneinheiten, zentral in Nackenheim.',
      multiline: true
    },
    tag: { type: 'enum', label: 'Tag', options: TAG_OPTIONS, default: 'mfh' },
    tagCustom: { type: 'string', label: 'Tag Override', default: 'NEUBAU & UMBAU' },
    listingType: {
      type: 'enum',
      label: 'Listing Type',
      options: [
        { label: 'Kauf', value: 'buy' },
        { label: 'Miete', value: 'rent' }
      ],
      default: 'buy'
    },
    status: { type: 'enum', label: 'Status', options: STATUS_OPTIONS, default: 'available' },
    street: { type: 'string', label: 'Street', default: 'Weingartenstraße 12' },
    zip: { type: 'string', label: 'ZIP', default: '55218' },
    city: { type: 'string', label: 'City', default: 'Ingelheim' },
    price: { type: 'number', label: 'Price (0 = on request)', default: 1200000, min: 0 },
    priceType: {
      type: 'enum',
      label: 'Price Type',
      options: [
        { label: 'Gesamt', value: 'total' },
        { label: 'Monatlich', value: 'monthly' }
      ],
      default: 'total'
    },
    areaM2: { type: 'number', label: 'Area (m²)', default: 640, min: 0 },
    rooms: { type: 'number', label: 'Rooms', default: 12, min: 0 },
    units: { type: 'number', label: 'Units (WE)', default: 5, min: 0 },
    yearCompleted: { type: 'number', label: 'Year Completed', default: 2018, min: 1800 },
    heroSeed: { type: 'string', label: 'Hero image seed', default: 'property-a' }
  },

  buildContent(values) {
    const price = Number(values.price) > 0 ? Number(values.price) : null
    return {
      content: {
        uid: 1,
        title: values.title,
        teaser: values.teaser || undefined,
        tag: select(values.tag),
        tag_custom: values.tagCustom || '',
        listing_type: select(values.listingType),
        status: select(values.status),
        address_street: values.street || undefined,
        address_zip: values.zip || undefined,
        address_city: values.city || undefined,
        address_country: 'Deutschland',
        price,
        price_type: select(values.priceType),
        area_m2: values.areaM2,
        rooms: values.rooms,
        units: values.units,
        year_completed: values.yearCompleted,
        hero_image: placeholderImage(values.heroSeed || 'property', 800, 600, values.title)
      },
      _variant: values.variant
    }
  },

  presets: [
    {
      name: 'Card · Weingut (MFH)',
      values: {
        variant: 'card',
        title: 'Weingut zum Mehrfamilienhaus',
        tag: 'mfh',
        tagCustom: 'NEUBAU & UMBAU',
        street: 'Weingartenstraße 12',
        zip: '55218',
        city: 'Ingelheim',
        areaM2: 640,
        units: 5,
        yearCompleted: 2018,
        heroSeed: 'weingut'
      }
    },
    {
      name: 'Card · Bodenheim (Neubau)',
      values: {
        variant: 'card',
        title: 'Einfamilienhaus Bodenheim',
        tag: 'neubau',
        tagCustom: '',
        street: 'Am Rheinblick 7',
        zip: '55294',
        city: 'Bodenheim',
        areaM2: 180,
        units: 1,
        yearCompleted: 2018,
        heroSeed: 'bodenheim'
      }
    },
    {
      name: 'Detail · price-on-request',
      values: {
        variant: 'detail',
        title: 'Doppelhaus Nackenheim',
        tag: 'neubau',
        tagCustom: '',
        street: '',
        zip: '',
        city: 'Nackenheim',
        price: 0,
        areaM2: 180,
        rooms: 4,
        units: 2,
        yearCompleted: 2018,
        heroSeed: 'nackenheim'
      }
    }
  ]
})
