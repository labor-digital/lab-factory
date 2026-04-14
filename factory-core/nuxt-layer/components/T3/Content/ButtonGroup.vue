<script setup lang="ts">
import BaseButtonGroup from './BaseButtonGroup.vue'
import ContentContainer from './ContentContainer.vue'
import Button from './Button.vue'

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
    <ContentContainer>
      <div :class="['flex flex-wrap gap-3', alignmentClass[uiProps.alignment]]">
        <Button
          v-for="(button, index) in uiProps.buttons"
          :key="index"
          v-bind="button"
        />
      </div>
    </ContentContainer>
  </BaseButtonGroup>
</template>
