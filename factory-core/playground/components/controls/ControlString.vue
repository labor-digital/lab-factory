<script setup lang="ts">
defineProps<{
  label: string
  modelValue: string
  multiline?: boolean
}>()
defineEmits<{ 'update:modelValue': [v: string] }>()
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label class="text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">{{ label }}</label>
    <UTextarea
      v-if="multiline"
      :model-value="modelValue"
      :rows="3"
      autoresize
      @update:model-value="$emit('update:modelValue', String($event ?? ''))"
    />
    <UInput
      v-else
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', String($event ?? ''))"
    />
  </div>
</template>
