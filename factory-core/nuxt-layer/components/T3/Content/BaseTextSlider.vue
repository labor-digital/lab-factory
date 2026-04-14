<script setup lang="ts">
import { computed } from 'vue'
import { parseButtons, parseFile, asBool } from '../../../utils/parseContent'
import { useFactoryPlaceholder } from '../../../composables/useFactoryPlaceholder'

const props = defineProps<{
  content: any
}>()

const { getPlaceholderUrl } = useFactoryPlaceholder()

function aspectDimensions(ratio: string): { w: number; h: number } {
  if (!ratio || ratio === 'auto') return { w: 1600, h: 900 }
  const [w, h] = ratio.split('/').map(n => parseInt(n, 10))
  if (!w || !h) return { w: 1600, h: 900 }
  const base = 1600
  return { w: base, h: Math.round((base * h) / w) }
}

const parsedData = computed(() => {
  const data = props.content?.content || {}

  const aspectRatio = unwrapSelect(data.aspect_ratio, '16/9') as string
  const { w: pw, h: ph } = aspectDimensions(aspectRatio)

  const slides = (data.slides || []).map((slide: any, idx: number) => {
    const s = slide.content || slide
    const type = unwrapSelect(s.type, 'image') as string
    const image = parseFile(s.image)
    const video = parseFile(s.video)
    const poster = parseFile(s.poster)

    return {
      type,
      image,
      video,
      videoUrl: s.video_url || undefined,
      poster,
      alt: s.alt || image?.alt || '',
      caption: s.caption || undefined,
      _key: `${type}-${idx}`
    }
  })

  // Placeholder fallback when seed/demo has no file attached yet.
  const seed = props.content?.id || props.content?.uid || 'text-slider'
  if (slides.length === 0) {
    slides.push({
      type: 'image',
      image: { src: getPlaceholderUrl(pw, ph, `${seed}-0`), alt: 'Placeholder', width: pw, height: ph },
      video: null,
      videoUrl: undefined,
      poster: null,
      alt: 'Placeholder',
      caption: undefined,
      _key: 'placeholder-0'
    })
  } else {
    slides.forEach((slide, i) => {
      if (slide.type === 'image' && !slide.image) {
        slide.image = {
          src: getPlaceholderUrl(pw, ph, `${seed}-${i}`),
          alt: slide.alt || 'Placeholder',
          width: pw,
          height: ph
        }
      }
    })
  }

  return {
    // Header
    eyebrow: data.eyebrow || undefined,
    eyebrowDecoration: unwrapSelect(data.eyebrow_decoration, 'bar'),
    eyebrowColor: unwrapSelect(data.eyebrow_color, 'primary'),
    title: data.title || undefined,
    description: data.description || undefined,
    textAlign: unwrapSelect(data.text_align, 'left'),
    buttons: parseButtons(data.buttons),

    // Slider
    aspectRatio,
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
