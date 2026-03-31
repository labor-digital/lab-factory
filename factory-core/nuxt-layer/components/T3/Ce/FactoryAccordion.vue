<script setup lang="ts">
import T3ContentAccordion from '../Content/Accordion.vue'

defineOptions({ inheritAttrs: false })
const attrs = useAttrs()
const content = computed(() => ({ content: attrs }))
</script>

<template>
  <T3ContentAccordion :content="content" />
</template>
