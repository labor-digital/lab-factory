<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  content: any
}>()

const parsedData = computed(() => {
  const data = props.content?.content || {}

  return {
    label: data.label || undefined,
    icon: data.icon || undefined,
    color: data.color || undefined,
    size: data.size || 'sm',
    type: data.type || 'solid',
    orientation: data.orientation || 'horizontal'
  }
})
</script>

<template>
  <slot :uiProps="parsedData" />
</template>
