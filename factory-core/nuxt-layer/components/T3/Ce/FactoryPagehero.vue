<script setup lang="ts">
import T3ContentPageHero from '../Content/PageHero.vue'

defineOptions({ inheritAttrs: false })
const attrs = useAttrs()
const content = computed(() => ({ content: attrs }))
</script>

<template>
  <T3ContentPageHero :content="content" />
</template>
