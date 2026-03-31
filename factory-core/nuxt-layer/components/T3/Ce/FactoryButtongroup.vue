<script setup lang="ts">
import T3ContentButtonGroup from '../Content/ButtonGroup.vue'

defineOptions({ inheritAttrs: false })
const attrs = useAttrs()
const content = computed(() => ({ content: attrs }))
</script>

<template>
  <T3ContentButtonGroup :content="content" />
</template>
