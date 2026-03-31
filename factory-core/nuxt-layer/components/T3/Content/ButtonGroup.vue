<script setup lang="ts">
import BaseButtonGroup from './BaseButtonGroup.vue'

defineProps<{
  content: any
}>()

const alignmentClass: Record<string, string> = {
  left: 'justify-start',
  center: 'justify-center',
  right: 'justify-end'
}
</script>

<template>
  <BaseButtonGroup :content="content" v-slot="{ uiProps }">
    <div :class="['flex flex-wrap gap-3', alignmentClass[uiProps.alignment]]">
      <UButton
        v-for="(button, index) in uiProps.buttons"
        :key="index"
        :label="button.label"
        :to="button.to"
        :target="button.target"
        :color="button.color"
        :variant="button.variant"
        :size="button.size"
        :icon="button.icon"
        :leading="button.leading"
        :trailing="button.trailing"
        :block="button.block"
      />
    </div>
  </BaseButtonGroup>
</template>
