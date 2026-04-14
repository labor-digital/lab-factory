<script setup lang="ts">
import { computed } from 'vue'
import { parseButtons, parseFile, asBool } from '../../../utils/parseContent'
import { useFactoryPlaceholder } from '../../../composables/useFactoryPlaceholder'

const props = defineProps<{
  content: any
}>()

const { getPlaceholderUrl } = useFactoryPlaceholder()

function aspectDimensions(ratio: string): { w: number; h: number } {
  if (!ratio || ratio === 'auto') return { w: 800, h: 600 }
  const [w, h] = ratio.split('/').map(n => parseInt(n, 10))
  if (!w || !h) return { w: 800, h: 600 }
  const base = 800
  return { w: base, h: Math.round((base * h) / w) }
}

const parsedData = computed(() => {
  const data = props.content?.content || {}

  const aspectRatio = unwrapSelect(data.aspect_ratio, '1/1')
  const { w: pw, h: ph } = aspectDimensions(aspectRatio)

  const media = (data.media || []).map((item: any, idx: number) => {
    const m = item.content || item
    const type = unwrapSelect(m.type, 'image')
    const image = parseFile(m.image)
    const video = parseFile(m.video)
    const poster = parseFile(m.poster)

    return {
      type,
      image,
      video,
      videoUrl: m.video_url || undefined,
      poster,
      alt: m.alt || image?.alt || '',
      caption: m.caption || undefined,
      // Stable key for v-for / lightbox indexing
      _key: `${type}-${idx}`
    }
  })

  // Placeholder fallback: if media collection is empty OR the only item is an
  // image without a file, supply a placeholder so seeded/empty content renders.
  if (media.length === 0 || (media.length === 1 && media[0].type === 'image' && !media[0].image)) {
    const seed = props.content?.id || props.content?.uid || 'section'
    media.length = 0
    media.push({
      type: 'image',
      image: {
        src: getPlaceholderUrl(pw, ph, seed),
        alt: 'Placeholder',
        width: pw,
        height: ph
      },
      video: null,
      videoUrl: undefined,
      poster: null,
      alt: 'Placeholder',
      caption: undefined,
      _key: 'placeholder'
    })
  }

  return {
    icon: data.icon || undefined,
    eyebrow: data.eyebrow || undefined,
    eyebrowDecoration: unwrapSelect(data.eyebrow_decoration, 'bar'),
    eyebrowColor: unwrapSelect(data.eyebrow_color, 'primary'),
    title: data.title || undefined,
    description: data.description || undefined,
    buttons: parseButtons(data.buttons),

    mediaPosition: unwrapSelect(data.media_position, 'right'),
    mediaWidth: unwrapSelect(data.media_width, 'normal'),
    contentAlign: unwrapSelect(data.content_align, 'left'),
    textMaxWidth: unwrapSelect(data.text_max_width, 'normal'),

    backgroundType: unwrapSelect(data.background_type, 'none'),
    backgroundColor: unwrapSelect(data.background_color, 'neutral'),
    backgroundImage: parseFile(data.background_image),
    backgroundOverlay: unwrapSelect(data.background_overlay, 'none'),

    media,
    aspectRatio,
    captionPosition: unwrapSelect(data.caption_position, 'below'),
    showArrows: asBool(data.show_arrows),
    showPagination: asBool(data.show_pagination),
    enableLightbox: asBool(data.enable_lightbox)
  }
})
</script>

<template>
  <slot :uiProps="parsedData" />
</template>
