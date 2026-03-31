<script setup lang="ts">
import T3ContentHeader from '../Content/Header.vue'

defineOptions({ inheritAttrs: false })
const attrs = useAttrs()
const content = computed(() => ({ content: attrs }))
</script>

<template>
  <T3ContentHeader :content="content" />
</template>
