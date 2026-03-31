<script setup lang="ts">
import BaseCarousel from './BaseCarousel.vue'

defineProps<{
  content: any
}>()
</script>

<template>
  <BaseCarousel :content="content" v-slot="{ uiProps }">
    <UCarousel
      :items="uiProps.items"
      :orientation="uiProps.orientation"
      :arrows="uiProps.arrows"
      :dots="uiProps.dots"
      :loop="uiProps.loop"
      :autoplay="uiProps.autoplay"
    >
      <template #default="{ item }">
        <NuxtImg
          :src="item.src"
          :alt="item.alt"
          :width="item.width"
          :height="item.height"
          class="w-full rounded-md"
        />
      </template>
    </UCarousel>
  </BaseCarousel>
</template>
