<script setup lang="ts">
import BaseSeparator from './BaseSeparator.vue'

defineProps<{
  content: any
}>()
</script>

<template>
  <BaseSeparator :content="content" v-slot="{ uiProps }">
    <USeparator v-bind="uiProps" />
  </BaseSeparator>
</template>
