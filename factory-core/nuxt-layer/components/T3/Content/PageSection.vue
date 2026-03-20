<script setup lang="ts">
import BasePageSection from './BasePageSection.vue'

defineProps<{
  content: any
}>()
</script>

<template>
  <BasePageSection :content="content" v-slot="{ uiProps }">
    <UPageSection v-bind="uiProps">
      <template #default v-if="uiProps.image">
        <NuxtImg
          :src="uiProps.image.src"
          :alt="uiProps.image.alt"
          :width="uiProps.image.width"
          :height="uiProps.image.height"
          class="w-full rounded-md shadow-xl ring-1 ring-gray-300 dark:ring-gray-700"
        />
      </template>
    </UPageSection>
  </BasePageSection>
</template>
