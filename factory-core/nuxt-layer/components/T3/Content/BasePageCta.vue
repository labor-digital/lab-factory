<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  content: any
}>()

const parsedData = computed(() => {
  const data = props.content?.content || {}

  // Parse links
  const links = (data.links || []).map((link: any) => {
    const linkData = link.content || link
    return {
      label: linkData.label,
      to: linkData.to?.url || linkData.to,
      color: linkData.color || 'primary',
      variant: linkData.variant || 'solid',
      size: linkData.size || 'lg',
      icon: linkData.icon,
      trailing: linkData.trailing === '1' || linkData.trailing === true
    }
  })

  // Parse image
  let image = null
  if (data.image && data.image.length > 0) {
    const imgData = data.image[0]
    image = {
      src: imgData.publicUrl || imgData.url,
      alt: imgData.properties?.alternative || imgData.title || '',
      width: imgData.properties?.width,
      height: imgData.properties?.height
    }
  }

  return {
    title: data.title,
    description: data.description,
    variant: data.variant || 'outline',
    links: links.length > 0 ? links : undefined,
    orientation: data.orientation || 'vertical',
    reverse: data.reverse === '1' || data.reverse === true,
    image
  }
})
</script>

<template>
  <slot :uiProps="parsedData" />
</template>
