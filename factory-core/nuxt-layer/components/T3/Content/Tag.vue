<script setup lang="ts">
defineProps<{
  label?: string
}>()
</script>

<template>
  <span v-if="label" class="tag">{{ label }}</span>
</template>
