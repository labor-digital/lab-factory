<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  content: any
}>()

const parsedData = computed(() => {
  const data = props.content?.content || {}

  return {
    bodytext: data.bodytext || ''
  }
})
</script>

<template>
  <slot :uiProps="parsedData" />
</template>
