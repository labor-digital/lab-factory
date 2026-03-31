<script setup lang="ts">
import T3ContentPageCta from '../Content/PageCta.vue'

defineOptions({ inheritAttrs: false })
const attrs = useAttrs()
const content = computed(() => ({ content: attrs }))
</script>

<template>
  <T3ContentPageCta :content="content" />
</template>
