<script setup lang="ts">
import T3ContentDownloads from '../Content/Downloads.vue'

defineOptions({ inheritAttrs: false })
const attrs = useAttrs()
const content = computed(() => ({ content: attrs }))
</script>

<template>
  <T3ContentDownloads :content="content" />
</template>
