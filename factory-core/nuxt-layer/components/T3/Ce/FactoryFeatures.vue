<script setup lang="ts">
import T3ContentFeatures from '../Content/Features.vue'

defineOptions({ inheritAttrs: false })
const attrs = useAttrs()
const content = computed(() => ({ content: attrs }))
</script>

<template>
  <T3ContentFeatures :content="content" />
</template>
