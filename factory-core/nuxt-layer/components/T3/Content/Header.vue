<script setup lang="ts">
import BaseHeader from './BaseHeader.vue'
import ContentContainer from './ContentContainer.vue'

defineProps<{
  content: any
}>()

const alignmentClass: Record<string, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right'
}
</script>

<template>
  <BaseHeader :content="content" v-slot="{ uiProps }">
    <ContentContainer>
      <div :class="alignmentClass[uiProps.alignment]">
        <component :is="uiProps.level" class="font-bold tracking-tight text-highlighted">
          {{ uiProps.text }}
        </component>
        <USeparator
          v-if="uiProps.separator"
          :color="uiProps.separatorColor"
          :type="uiProps.separatorType"
          :size="uiProps.separatorSize"
          class="mt-4"
        />
      </div>
    </ContentContainer>
  </BaseHeader>
</template>
