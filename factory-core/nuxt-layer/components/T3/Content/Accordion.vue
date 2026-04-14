<script setup lang="ts">
import BaseAccordion from './BaseAccordion.vue'
import ContentContainer from './ContentContainer.vue'

defineProps<{
  content: any
}>()
</script>

<template>
  <BaseAccordion :content="content" v-slot="{ uiProps }">
    <ContentContainer>
      <UAccordion
        :type="uiProps.type"
        :collapsible="uiProps.collapsible"
        :items="uiProps.items"
      />
    </ContentContainer>
  </BaseAccordion>
</template>
