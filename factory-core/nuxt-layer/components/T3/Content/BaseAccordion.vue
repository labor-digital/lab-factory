<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  content: any
}>()

const parsedData = computed(() => {
  const data = props.content?.content || {}

  const items = (data.items || []).map((item: any) => {
    const itemData = item.content || item
    return {
      label: itemData.label,
      icon: itemData.icon || undefined,
      content: itemData.content,
      disabled: itemData.disabled === '1' || itemData.disabled === true
    }
  })

  return {
    type: unwrapSelect(data.type, 'single'),
    collapsible: data.collapsible === '1' || data.collapsible === true,
    items: items.length > 0 ? items : undefined
  }
})
</script>

<template>
  <slot :uiProps="parsedData" />
</template>
