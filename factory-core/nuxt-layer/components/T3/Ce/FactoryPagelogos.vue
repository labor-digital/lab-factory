<script setup lang="ts">
import T3ContentPageLogos from '../Content/PageLogos.vue'

defineOptions({ inheritAttrs: false })
const attrs = useAttrs()
const content = computed(() => ({ content: attrs }))
</script>

<template>
  <T3ContentPageLogos :content="content" />
</template>
