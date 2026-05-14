<script setup lang="ts">
import { computed } from 'vue'
import { parseFile } from '../../../utils/parseContent'
import { unwrapSelect } from '../../../utils/unwrapSelect'

const props = defineProps<{
  content: any
}>()

const parsedData = computed(() => {
  const data = props.content?.content || {}
  return {
    variant: unwrapSelect(data.variant, 'grid') as 'grid' | 'marquee' | 'compact' | 'slider',
    eyebrow: data.eyebrow || undefined,
    headline: data.headline || undefined,
    intro: data.intro || undefined,
    columns: Number(unwrapSelect(data.columns, '6')) || 6,
    perPage: Number(unwrapSelect(data.per_page, '6')) || 6,
    logos: ((data.logos || []) as any[]).map((logo: any) => {
      const l = logo.content || logo
      return {
        label: l.label || 'Logo',
        image: parseFile(l.image),
        url: l.url?.url || l.url || undefined
      }
    })
  }
})
</script>

<template>
  <slot :uiProps="parsedData" />
</template>
