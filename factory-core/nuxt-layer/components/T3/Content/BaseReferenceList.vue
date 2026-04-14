<script setup lang="ts">
import { computed } from 'vue'
import { parseButtons, asBool } from '../../../utils/parseContent'
import { unwrapSelect } from '../../../utils/unwrapSelect'

const props = defineProps<{
  content: any
}>()

const parsedData = computed(() => {
  const data = props.content?.content || {}

  const records = (data.records || []).map((r: any, i: number) => ({
    _record_type: r._record_type || 'property',
    _key: `${r._record_type || 'property'}-${r.uid ?? i}`,
    ...r
  }))

  return {
    // Header
    eyebrow: data.eyebrow || undefined,
    eyebrowDecoration: unwrapSelect(data.eyebrow_decoration, 'bar'),
    eyebrowColor: unwrapSelect(data.eyebrow_color, 'primary'),
    title: data.title || undefined,
    description: data.description || undefined,
    textAlign: unwrapSelect(data.text_align, 'left'),
    buttons: parseButtons(data.buttons),

    // Layout
    layout: unwrapSelect(data.layout, 'grid') as 'grid' | 'slider',
    columns: unwrapSelect(data.columns, '3') as '2' | '3' | '4',
    aspectRatio: unwrapSelect(data.aspect_ratio, '4/3') as string,
    showArrows: asBool(data.show_arrows),
    showPagination: asBool(data.show_pagination),
    autoplay: asBool(data.autoplay),
    loop: asBool(data.loop),
    sliderOverflow: unwrapSelect(data.slider_overflow, 'contained') as
      'contained' | 'breakout-right' | 'breakout-left' | 'breakout-both',
    sliderShowOverflow: asBool(data.slider_show_overflow),

    records
  }
})
</script>

<template>
  <slot :uiProps="parsedData" />
</template>
