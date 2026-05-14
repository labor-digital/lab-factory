<script setup lang="ts">
import T3ContentSection from '../Content/Section.vue'

defineOptions({ inheritAttrs: false })
const attrs = useAttrs()
const content = computed(() => ({ content: attrs }))
</script>

<template>
  <T3ContentSection :content="content" />
</template>
