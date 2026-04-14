<script setup lang="ts">
import { computed } from 'vue'
import { useFactoryPlaceholder } from '../../../composables/useFactoryPlaceholder'

const props = defineProps<{
  content: any
}>()

const { getPlaceholderUrl } = useFactoryPlaceholder()

const parsedData = computed(() => {
  const data = props.content?.content || {}

  const items = (data.items || []).map((item: any, index: number) => {
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

    // Placeholder fallback for seeded items without real images
    if (!image && itemData.alt) {
      const seed = (props.content?.id || props.content?.uid || 'carousel') + '-' + index
      image = {
        src: getPlaceholderUrl(1200, 600, seed),
        alt: itemData.alt,
        width: 1200,
        height: 600
      }
    }

    return image
  }).filter(Boolean)

  return {
    orientation: unwrapSelect(data.orientation, 'horizontal'),
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
