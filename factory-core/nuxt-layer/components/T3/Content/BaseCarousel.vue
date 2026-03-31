<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  content: any
}>()

const parsedData = computed(() => {
  const data = props.content?.content || {}

  const items = (data.items || []).map((item: any) => {
    const itemData = item.content || item
    let image = null
    if (itemData.image && itemData.image.length > 0) {
      const imgData = itemData.image[0]
      image = {
        src: imgData.publicUrl || imgData.url,
        alt: itemData.alt || imgData.properties?.alternative || imgData.title || '',
        width: imgData.properties?.width,
        height: imgData.properties?.height
      }
    }
    return image
  }).filter(Boolean)

  return {
    orientation: data.orientation || 'horizontal',
    arrows: data.arrows === '1' || data.arrows === true,
    dots: data.dots === '1' || data.dots === true,
    loop: data.loop === '1' || data.loop === true,
    autoplay: data.autoplay === '1' || data.autoplay === true,
    items
  }
})
</script>

<template>
  <slot :uiProps="parsedData" />
</template>
