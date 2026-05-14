<script setup lang="ts">
import T3ContentTeaser from '../Content/Teaser.vue'

defineOptions({ inheritAttrs: false })
const attrs = useAttrs()
const content = computed(() => ({ content: attrs }))
</script>

<template>
  <T3ContentTeaser :content="content" />
</template>
