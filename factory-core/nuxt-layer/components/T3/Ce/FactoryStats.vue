<script setup lang="ts">
import T3ContentStats from '../Content/Stats.vue'

defineOptions({ inheritAttrs: false })
const attrs = useAttrs()
const content = computed(() => ({ content: attrs }))
</script>

<template>
  <T3ContentStats :content="content" />
</template>
