<script setup lang="ts">
import T3ContentCta from '../Content/Cta.vue'

defineOptions({ inheritAttrs: false })
const attrs = useAttrs()
const content = computed(() => ({ content: attrs }))
</script>

<template>
  <T3ContentCta :content="content" />
</template>
