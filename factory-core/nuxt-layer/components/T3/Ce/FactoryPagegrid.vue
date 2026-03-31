<script setup lang="ts">
import T3ContentPageGrid from '../Content/PageGrid.vue'

defineOptions({ inheritAttrs: false })
const attrs = useAttrs()
const content = computed(() => ({ content: attrs }))
</script>

<template>
  <T3ContentPageGrid :content="content" />
</template>
