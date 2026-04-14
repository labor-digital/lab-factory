<script setup lang="ts">
import T3ContentReferenceList from '../Content/ReferenceList.vue'

defineOptions({ inheritAttrs: false })
const attrs = useAttrs()
const content = computed(() => ({ content: attrs }))
</script>

<template>
  <T3ContentReferenceList :content="content" />
</template>
