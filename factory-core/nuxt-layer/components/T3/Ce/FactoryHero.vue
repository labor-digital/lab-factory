<script setup lang="ts">
import T3ContentHero from '../Content/Hero.vue'

defineOptions({ inheritAttrs: false })
const attrs = useAttrs()
const content = computed(() => ({ content: attrs }))
</script>

<template>
  <T3ContentHero :content="content" />
</template>
