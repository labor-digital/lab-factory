<script setup lang="ts">
import BaseSeparator from './BaseSeparator.vue'
import ContentContainer from './ContentContainer.vue'

defineProps<{
  content: any
}>()
</script>

<template>
  <BaseSeparator :content="content" v-slot="{ uiProps }">
    <ContentContainer>
      <USeparator v-bind="uiProps" />
    </ContentContainer>
  </BaseSeparator>
</template>
