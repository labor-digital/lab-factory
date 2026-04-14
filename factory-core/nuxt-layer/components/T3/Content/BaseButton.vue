<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label?: string
  to?: any
  target?: string
  color?: string
  variant?: string
  size?: string
  icon?: string
  leading?: boolean
  trailing?: boolean
  block?: boolean
  disabled?: boolean
}>()

const parsedData = computed(() => ({
  label: props.label,
  to: (props.to && typeof props.to === 'object' ? props.to.url : props.to) || undefined,
  target: props.target || undefined,
  color: unwrapSelect(props.color, 'primary'),
  variant: unwrapSelect(props.variant, 'solid'),
  size: unwrapSelect(props.size, 'md'),
  icon: props.icon || undefined,
  leading: props.leading === true || (props.leading as any) === '1',
  trailing: props.trailing === true || (props.trailing as any) === '1',
  block: props.block === true || (props.block as any) === '1',
  disabled: props.disabled === true
}))
</script>

<template>
  <slot :uiProps="parsedData" />
</template>
