<script setup lang="ts">
import BasePageHero from './BasePageHero.vue'

defineProps<{
  content: any
}>()
</script>

<template>
  <BasePageHero :content="content" v-slot="{ uiProps }">
    <UPageHero v-bind="uiProps">
      <template #default v-if="uiProps.image">
        <NuxtImg
          :src="uiProps.image.src"
          :alt="uiProps.image.alt"
          :width="uiProps.image.width"
          :height="uiProps.image.height"
          class="w-full rounded-md shadow-xl ring-1 ring-gray-300 dark:ring-gray-700"
        />
      </template>
    </UPageHero>
  </BasePageHero>
</template>
