<script setup lang="ts">
import T3ContentFaq from '../Content/Faq.vue'

defineOptions({ inheritAttrs: false })
const attrs = useAttrs()
const content = computed(() => ({ content: attrs }))
</script>

<template>
  <T3ContentFaq :content="content" />
</template>
