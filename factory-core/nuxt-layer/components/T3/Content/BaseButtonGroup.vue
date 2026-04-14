<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  content: any
}>()

const parsedData = computed(() => {
  const data = props.content?.content || {}

  const buttons = (data.buttons || []).map((button: any) => {
    const btnData = button.content || button
    return {
      label: btnData.label,
      to: btnData.to?.url || btnData.to || undefined,
      target: btnData.target || undefined,
      color: unwrapSelect(btnData.color, 'primary'),
      variant: unwrapSelect(btnData.variant, 'solid'),
      size: unwrapSelect(btnData.size, 'md'),
      icon: btnData.icon || undefined,
      leading: btnData.leading === '1' || btnData.leading === true,
      trailing: btnData.trailing === '1' || btnData.trailing === true,
      block: btnData.block === '1' || btnData.block === true
    }
  })

  return {
    alignment: unwrapSelect(data.alignment, 'left'),
    buttons
  }
})
</script>

<template>
  <slot :uiProps="parsedData" />
</template>
