<script setup lang="ts">
import BaseText from './BaseText.vue'
import ContentContainer from './ContentContainer.vue'

defineProps<{
  content: any
}>()
</script>

<template>
  <BaseText :content="content" v-slot="{ uiProps }">
    <ContentContainer>
      <div class="prose dark:prose-invert max-w-none" v-html="uiProps.bodytext" />
    </ContentContainer>
  </BaseText>
</template>
