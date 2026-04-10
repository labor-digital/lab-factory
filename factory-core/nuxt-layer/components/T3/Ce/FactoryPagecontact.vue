<script setup lang="ts">
import T3ContentPageContact from '../Content/PageContact.vue'

defineOptions({ inheritAttrs: false })
const attrs = useAttrs()
const content = computed(() => ({ content: attrs }))
</script>

<template>
  <T3ContentPageContact :content="content" />
</template>
