<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  content: any
}>()

const parsedData = computed(() => {
  const data = props.content?.content || {}

  return {
    text: data.text || '',
    level: data.level || 'h2',
    alignment: data.alignment || 'left',
    separator: data.separator === '1' || data.separator === true,
    separatorColor: data.separator_color || undefined,
    separatorType: data.separator_type || 'solid',
    separatorSize: data.separator_size || 'sm'
  }
})
</script>

<template>
  <slot :uiProps="parsedData" />
</template>
