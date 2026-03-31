<script setup lang="ts">
import T3ContentTable from '../Content/Table.vue'

defineOptions({ inheritAttrs: false })
const attrs = useAttrs()
const content = computed(() => ({ content: attrs }))
</script>

<template>
  <T3ContentTable :content="content" />
</template>
