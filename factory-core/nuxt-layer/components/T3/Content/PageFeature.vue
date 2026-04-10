<script setup lang="ts">
import BasePageFeature from './BasePageFeature.vue'

defineProps<{
  content: any
}>()
</script>

<template>
  <BasePageFeature :content="content" v-slot="{ uiProps }">
    <component
      :is="uiProps.to ? 'a' : 'div'"
      :href="uiProps.to"
      :target="uiProps.target"
      :class="[
        'flex gap-4',
        uiProps.orientation === 'vertical' ? 'flex-col items-center text-center' : 'flex-row items-start',
        uiProps.to ? 'transition hover:opacity-80' : ''
      ]"
    >
      <UIcon
        v-if="uiProps.icon"
        :name="uiProps.icon"
        class="size-8 text-(--ui-primary) shrink-0"
      />
      <div class="flex flex-col gap-1">
        <h3
          v-if="uiProps.title"
          class="font-semibold text-default"
        >
          {{ uiProps.title }}
        </h3>
        <p
          v-if="uiProps.description"
          class="text-sm text-muted"
        >
          {{ uiProps.description }}
        </p>
      </div>
    </component>
  </BasePageFeature>
</template>
