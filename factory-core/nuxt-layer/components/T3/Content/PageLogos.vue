<script setup lang="ts">
import BasePageLogos from './BasePageLogos.vue'

defineProps<{
  content: any
}>()
</script>

<template>
  <BasePageLogos :content="content" v-slot="{ uiProps }">
    <UPageLogos v-bind="uiProps" />
  </BasePageLogos>
</template>
