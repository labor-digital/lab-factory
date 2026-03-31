<script setup lang="ts">
import T3ContentSeparator from '../Content/Separator.vue'

defineOptions({ inheritAttrs: false })
const attrs = useAttrs()
const content = computed(() => ({ content: attrs }))
</script>

<template>
  <T3ContentSeparator :content="content" />
</template>
