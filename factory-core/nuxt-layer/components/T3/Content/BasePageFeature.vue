<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  content: any
}>()

const parsedData = computed(() => {
  const data = props.content?.content || {}

  return {
    icon: data.icon,
    title: data.title,
    description: data.description,
    orientation: unwrapSelect(data.orientation, 'horizontal'),
    to: data.to?.url || data.to || undefined,
    target: data.target || undefined
  }
})
</script>

<template>
  <slot :uiProps="parsedData" />
</template>
