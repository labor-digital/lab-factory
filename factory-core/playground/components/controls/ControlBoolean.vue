<script setup lang="ts">
defineProps<{
  label: string
  modelValue: boolean
}>()
defineEmits<{ 'update:modelValue': [v: boolean] }>()
</script>

<template>
  <div class="flex items-center justify-between gap-3 py-1">
    <label class="text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">{{ label }}</label>
    <USwitch
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
    />
  </div>
</template>
