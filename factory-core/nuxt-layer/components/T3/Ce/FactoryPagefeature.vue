<script setup lang="ts">
import T3ContentPageFeature from '../Content/PageFeature.vue'

defineOptions({ inheritAttrs: false })
const attrs = useAttrs()
const content = computed(() => ({ content: attrs }))
</script>

<template>
  <T3ContentPageFeature :content="content" />
</template>
