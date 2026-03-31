<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  content: any
}>()

const parsedData = computed(() => {
  const data = props.content?.content || {}

  const items = (data.items || []).map((item: any) => {
    const itemData = item.content || item

    // Image takes priority over icon
    if (itemData.image && itemData.image.length > 0) {
      const imgData = itemData.image[0]
      return {
        src: imgData.publicUrl || imgData.url,
        alt: imgData.properties?.alternative || imgData.title || ''
      }
    }

    return itemData.icon
  }).filter(Boolean)

  return {
    title: data.title,
    marquee: data.marquee === '1' || data.marquee === true,
    items: items.length > 0 ? items : undefined
  }
})
</script>

<template>
  <slot :uiProps="parsedData" />
</template>
