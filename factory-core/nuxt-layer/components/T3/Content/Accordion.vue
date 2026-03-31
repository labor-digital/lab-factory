<script setup lang="ts">
import BaseAccordion from './BaseAccordion.vue'

defineProps<{
  content: any
}>()
</script>

<template>
  <BaseAccordion :content="content" v-slot="{ uiProps }">
    <UAccordion
      :type="uiProps.type"
      :collapsible="uiProps.collapsible"
      :items="uiProps.items"
    />
  </BaseAccordion>
</template>
