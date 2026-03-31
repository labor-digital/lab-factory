<script setup lang="ts">
import T3ContentPageSection from '../Content/PageSection.vue'

defineOptions({ inheritAttrs: false })
const attrs = useAttrs()
const content = computed(() => ({ content: attrs }))
</script>

<template>
  <T3ContentPageSection :content="content" />
</template>
