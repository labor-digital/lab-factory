<script setup lang="ts">
import { computed } from 'vue'
import { parseButtons, parseFile, asBool } from '../../../utils/parseContent'
import { unwrapSelect } from '../../../utils/unwrapSelect'

const props = defineProps<{
  content: any
}>()

const parsedData = computed(() => {
  const data = props.content?.content || {}

  const slides = (data.slides || []).map((slide: any) => {
    const s = slide.content || slide
    const backgroundType = unwrapSelect(s.background_type, 'color')

    return {
      eyebrow: s.eyebrow || undefined,
      headline: s.headline || undefined,
      text: s.text || undefined,
      textColor: unwrapSelect(s.text_color, 'auto'),
      overlay: unwrapSelect(s.overlay, 'none'),
      background: {
        type: backgroundType,
        color: unwrapSelect(s.background_color, 'primary'),
        image: parseFile(s.background_image),
        video: parseFile(s.background_video),
        videoUrl: s.background_video_url || undefined
      },
      buttons: parseButtons(s.buttons)
    }
  })

  // Ensure at least one slide renders even if seed data hasn't run yet.
  if (slides.length === 0) {
    slides.push({
      eyebrow: undefined,
      headline: data.title || 'Hero',
      text: data.description || undefined,
      textColor: 'auto',
      overlay: 'none',
      background: { type: 'color', color: 'primary', image: null, video: null, videoUrl: undefined },
      buttons: []
    })
  }

  return {
    contentPositionX: unwrapSelect(data.content_position_x, 'center'),
    contentPositionY: unwrapSelect(data.content_position_y, 'center'),
    height: unwrapSelect(data.height, 'medium'),
    showArrows: asBool(data.show_arrows),
    showPagination: asBool(data.show_pagination),
    autoplay: asBool(data.autoplay),
    loop: asBool(data.loop),
    slides
  }
})
</script>

<template>
  <slot :uiProps="parsedData" />
</template>
