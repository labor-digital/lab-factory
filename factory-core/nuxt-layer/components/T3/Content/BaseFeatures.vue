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
    variant: unwrapSelect(data.variant, 'cards') as 'cards' | 'flat' | 'numbered' | 'media',
    eyebrow: data.eyebrow || undefined,
    headline: data.headline || undefined,
    intro: data.intro || undefined,
    items: ((data.items || []) as any[]).map((item: any, i: number) => {
      const it = item.content || item
      return {
        num: it.num || String(i + 1).padStart(2, '0'),
        title: it.title || '',
        text: it.text || '',
        linkLabel: it.link_label || undefined,
        linkTo: it.link_to?.url || it.link_to || undefined,
        icon: it.icon || undefined,
        image: parseFile(it.image)
      }
    })
  }
})
</script>

<template>
  <slot :uiProps="parsedData" />
</template>
