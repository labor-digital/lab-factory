<script setup lang="ts">
defineProps<{
  label: string
  modelValue: number
  min?: number
  max?: number
  step?: number
}>()
defineEmits<{ 'update:modelValue': [v: number] }>()
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label class="text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">{{ label }}</label>
    <UInput
      type="number"
      :model-value="modelValue"
      :min="min"
      :max="max"
      :step="step ?? 1"
      @update:model-value="$emit('update:modelValue', Number($event))"
    />
  </div>
</template>
