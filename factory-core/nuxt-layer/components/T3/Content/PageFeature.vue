<script setup lang="ts">
import BasePageFeature from './BasePageFeature.vue'

defineProps<{
  content: any
}>()
</script>

<template>
  <BasePageFeature :content="content" v-slot="{ uiProps }">
    <UPageFeature v-bind="uiProps" />
  </BasePageFeature>
</template>
