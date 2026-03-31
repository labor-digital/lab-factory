<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  content: any
}>()

const parsedData = computed(() => {
  const data = props.content?.content || {}

  const cards = (data.cards || []).map((card: any) => {
    const cardData = card.content || card

    // Parse image
    let image = null
    if (cardData.image && cardData.image.length > 0) {
      const imgData = cardData.image[0]
      image = {
        src: imgData.publicUrl || imgData.url,
        alt: imgData.properties?.alternative || imgData.title || '',
        width: imgData.properties?.width,
        height: imgData.properties?.height
      }
    }

    return {
      icon: cardData.icon,
      title: cardData.title,
      description: cardData.description,
      orientation: cardData.orientation || 'vertical',
      reverse: cardData.reverse === '1' || cardData.reverse === true,
      variant: cardData.variant || 'outline',
      highlight: cardData.highlight === '1' || cardData.highlight === true,
      highlightColor: cardData.highlight_color || undefined,
      spotlight: cardData.spotlight === '1' || cardData.spotlight === true,
      spotlightColor: cardData.spotlight_color || undefined,
      to: cardData.to?.url || cardData.to || undefined,
      target: cardData.target || undefined,
      image,
      colSpan: cardData.col_span || '1'
    }
  })

  return { cards }
})
</script>

<template>
  <slot :uiProps="parsedData" />
</template>
