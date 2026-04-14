<script setup lang="ts">
defineProps<{
  label: string
  options: { label: string; value: any }[]
  modelValue: any
}>()
defineEmits<{ 'update:modelValue': [v: any] }>()
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label class="text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">{{ label }}</label>
    <USelectMenu
      :model-value="modelValue"
      :items="options"
      value-key="value"
      label-key="label"
      class="w-full"
      @update:model-value="$emit('update:modelValue', $event)"
    />
  </div>
</template>
