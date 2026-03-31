<script setup lang="ts">
import T3ContentCarousel from '../Content/Carousel.vue'

defineOptions({ inheritAttrs: false })
const attrs = useAttrs()
const content = computed(() => ({ content: attrs }))
</script>

<template>
  <T3ContentCarousel :content="content" />
</template>
