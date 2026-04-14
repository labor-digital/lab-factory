<script setup lang="ts">
import T3ContentTextSlider from '../Content/TextSlider.vue'

defineOptions({ inheritAttrs: false })
const attrs = useAttrs()
const content = computed(() => ({ content: attrs }))
</script>

<template>
  <T3ContentTextSlider :content="content" />
</template>
