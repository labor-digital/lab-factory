<script setup lang="ts">
import T3ContentTestimonials from '../Content/Testimonials.vue'

defineOptions({ inheritAttrs: false })
const attrs = useAttrs()
const content = computed(() => ({ content: attrs }))
</script>

<template>
  <T3ContentTestimonials :content="content" />
</template>
