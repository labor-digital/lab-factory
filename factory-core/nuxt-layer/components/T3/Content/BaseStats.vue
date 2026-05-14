<script setup lang="ts">
import { computed } from 'vue'
import { unwrapSelect } from '../../../utils/unwrapSelect'

const props = defineProps<{
  content: any
}>()

const parsedData = computed(() => {
  const data = props.content?.content || {}
  return {
    variant: unwrapSelect(data.variant, 'row') as 'row' | 'bigfour' | 'inline' | 'split',
    eyebrow: data.eyebrow || undefined,
    headline: data.headline || undefined,
    intro: data.intro || undefined,
    callout: data.callout || undefined,
    items: ((data.items || []) as any[]).map((item: any) => {
      const i = item.content || item
      return {
        value: i.value || '',
        label: i.label || '',
        sub: i.sub || undefined
      }
    })
  }
})
</script>

<template>
  <slot :uiProps="parsedData" />
</template>
