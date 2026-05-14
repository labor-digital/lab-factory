<script setup lang="ts">
defineProps<{
  label?: string
  decoration?: 'bar' | 'none'
  align?: 'left' | 'center' | 'right'
  onDark?: boolean
}>()
</script>

<template>
  <span
    v-if="label"
    class="eyebrow"
    :class="[
      decoration === 'none' ? 'no-bar' : '',
      align === 'center' ? 'center' : '',
      onDark ? 'on-dark' : ''
    ]"
  >{{ label }}</span>
</template>
