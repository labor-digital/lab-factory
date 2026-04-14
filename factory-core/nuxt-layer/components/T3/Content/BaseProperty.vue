<script setup lang="ts">
import { computed } from 'vue'
import { parseFile } from '../../../utils/parseContent'
import { unwrapSelect } from '../../../utils/unwrapSelect'

const props = defineProps<{
  content: any
}>()

const parsedData = computed(() => {
  const d = props.content?.content || {}

  const tag = (d.tag_custom && String(d.tag_custom).trim() !== '')
    ? String(d.tag_custom).trim()
    : String(unwrapSelect(d.tag, '') ?? '').toUpperCase()

  const gallery = Array.isArray(d.gallery)
    ? d.gallery
        .map((entry: any) => parseFile([entry]))
        .filter(Boolean) as ReturnType<typeof parseFile>[]
    : []

  return {
    uid: d.uid,
    title: d.title,
    teaser: d.teaser || undefined,
    tag,
    listingType: unwrapSelect(d.listing_type, 'buy') as 'buy' | 'rent',
    status: unwrapSelect(d.status, 'available') as 'new' | 'available' | 'reserved' | 'sold',
    address: {
      street: d.address_street || undefined,
      zip: d.address_zip || undefined,
      city: d.address_city || undefined,
      country: d.address_country || undefined
    },
    price: d.price !== undefined && d.price !== null && d.price !== '' ? Number(d.price) : null,
    priceType: unwrapSelect(d.price_type, 'total') as 'total' | 'monthly',
    areaM2: d.area_m2 !== undefined && d.area_m2 !== null && d.area_m2 !== '' ? Number(d.area_m2) : null,
    rooms: d.rooms !== undefined && d.rooms !== null && d.rooms !== '' ? Number(d.rooms) : null,
    units: d.units !== undefined && d.units !== null && d.units !== '' ? Number(d.units) : null,
    yearBuilt: d.year_built ?? null,
    yearCompleted: d.year_completed ?? null,
    heroImage: parseFile(d.hero_image),
    gallery,
    contentElements: Array.isArray(d.content_elements) ? d.content_elements : []
  }
})
</script>

<template>
  <slot :uiProps="parsedData" />
</template>
