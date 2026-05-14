<script setup lang="ts">
import T3ContentFooter from '../Content/Footer.vue'

defineOptions({ inheritAttrs: false })
const attrs = useAttrs()
const content = computed(() => ({ content: attrs }))
</script>

<template>
  <T3ContentFooter :content="content" />
</template>
