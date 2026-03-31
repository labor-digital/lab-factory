<script setup lang="ts">
import T3ContentText from '../Content/Text.vue'

defineOptions({ inheritAttrs: false })
const attrs = useAttrs()
const content = computed(() => ({ content: attrs }))
</script>

<template>
  <T3ContentText :content="content" />
</template>
