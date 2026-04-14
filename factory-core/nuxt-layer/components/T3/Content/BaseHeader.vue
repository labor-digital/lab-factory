<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  content: any
}>()

const parsedData = computed(() => {
  const data = props.content?.content || {}

  return {
    text: data.text || '',
    level: unwrapSelect(data.level, 'h2'),
    alignment: unwrapSelect(data.alignment, 'left'),
    separator: data.separator === '1' || data.separator === 1 || data.separator === true,
    separatorColor: unwrapSelect(data.separator_color),
    separatorType: unwrapSelect(data.separator_type, 'solid'),
    separatorSize: unwrapSelect(data.separator_size, 'sm')
  }
})
</script>

<template>
  <slot :uiProps="parsedData" />
</template>
