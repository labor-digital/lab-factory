<script setup lang="ts">
import BasePageGrid from './BasePageGrid.vue';

defineProps<{
  content: any
}>();

const colSpanClass: Record<string, string> = {
  '1': 'col-span-1',
  '2': 'col-span-2',
  '3': 'col-span-3'
};
</script>

<template>
  <BasePageGrid :content="content" v-slot="{ uiProps }">
    <UPageGrid>
      <UPageCard
          v-for="(card, index) in uiProps.cards"
          :key="index"
          :class="colSpanClass[card.colSpan]"
          :icon="card.icon"
          :title="card.title"
          :description="card.description"
          :orientation="card.orientation"
          :reverse="card.reverse"
          :variant="card.variant"
          :highlight="card.highlight"
          :highlight-color="card.highlightColor"
          :spotlight="card.spotlight"
          :spotlight-color="card.spotlightColor"
          :to="card.to"
          :target="card.target"
      >
        <template #default v-if="card.image">
          <NuxtImg
              :src="card.image.src"
              :alt="card.image.alt"
              :width="card.image.width"
              :height="card.image.height"
              class="w-full rounded-md"
          />
        </template>
      </UPageCard>
    </UPageGrid>
  </BasePageGrid>
</template>
