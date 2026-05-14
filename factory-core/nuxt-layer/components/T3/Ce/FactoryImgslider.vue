<script setup lang="ts">
import T3ContentImgSlider from '../Content/ImgSlider.vue'

defineOptions({ inheritAttrs: false })
const attrs = useAttrs()
const content = computed(() => ({ content: attrs }))
</script>

<template>
  <T3ContentImgSlider :content="content" />
</template>
