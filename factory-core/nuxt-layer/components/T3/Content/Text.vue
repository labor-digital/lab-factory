<script setup lang="ts">
import BaseText from './BaseText.vue'

defineProps<{
  content: any
}>()
</script>

<template>
  <BaseText :content="content" v-slot="{ uiProps }">
    <div class="prose dark:prose-invert max-w-none" v-html="uiProps.bodytext" />
  </BaseText>
</template>
