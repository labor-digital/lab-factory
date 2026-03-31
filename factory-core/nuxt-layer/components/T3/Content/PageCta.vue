<script setup lang="ts">
import BasePageCta from './BasePageCta.vue'

defineProps<{
  content: any
}>()
</script>

<template>
  <BasePageCta :content="content" v-slot="{ uiProps }">
    <UPageCTA v-bind="uiProps">
      <template #default v-if="uiProps.image">
        <NuxtImg
          :src="uiProps.image.src"
          :alt="uiProps.image.alt"
          :width="uiProps.image.width"
          :height="uiProps.image.height"
          class="w-full rounded-lg"
        />
      </template>
    </UPageCTA>
  </BasePageCta>
</template>
