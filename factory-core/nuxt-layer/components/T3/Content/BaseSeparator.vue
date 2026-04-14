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
    color: unwrapSelect(data.color),
    size: unwrapSelect(data.size, 'sm'),
    type: unwrapSelect(data.type, 'solid'),
    orientation: unwrapSelect(data.orientation, 'horizontal')
  }
})
</script>

<template>
  <slot :uiProps="parsedData" />
</template>
