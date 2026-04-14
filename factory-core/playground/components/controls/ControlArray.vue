<script setup lang="ts">
import { computed } from 'vue'
import type { ControlDef } from '~/stories/types'
import ControlEnum from './ControlEnum.vue'
import ControlBoolean from './ControlBoolean.vue'
import ControlString from './ControlString.vue'
import ControlNumber from './ControlNumber.vue'

const props = defineProps<{
  label: string
  itemLabel?: string
  itemSchema: Record<string, ControlDef>
  modelValue: any[]
}>()

const emit = defineEmits<{ 'update:modelValue': [v: any[]] }>()

function itemDefaults(): Record<string, any> {
  const out: Record<string, any> = {}
  for (const [k, ctrl] of Object.entries(props.itemSchema)) {
    out[k] = ctrl.type === 'array'
      ? JSON.parse(JSON.stringify(ctrl.default ?? []))
      : ctrl.default
  }
  return out
}

function addItem() {
  emit('update:modelValue', [...(props.modelValue || []), itemDefaults()])
}

function removeItem(idx: number) {
  const next = [...(props.modelValue || [])]
  next.splice(idx, 1)
  emit('update:modelValue', next)
}

function updateField(idx: number, key: string, value: any) {
  const next = [...(props.modelValue || [])]
  next[idx] = { ...next[idx], [key]: value }
  emit('update:modelValue', next)
}

const items = computed(() => props.modelValue || [])
</script>

<template>
  <div class="flex flex-col gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900">
    <div class="flex items-center justify-between">
      <span class="text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
        {{ label }} ({{ items.length }})
      </span>
      <UButton size="xs" color="neutral" variant="soft" icon="i-lucide-plus" @click="addItem">
        Add
      </UButton>
    </div>

    <div
      v-for="(item, idx) in items"
      :key="idx"
      class="flex flex-col gap-2 rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-950"
    >
      <div class="flex items-center justify-between">
        <span class="text-xs font-medium text-neutral-500">{{ itemLabel || 'Item' }} #{{ idx + 1 }}</span>
        <UButton size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" @click="removeItem(idx)" />
      </div>

      <template v-for="(ctrl, key) in itemSchema" :key="key">
        <ControlEnum
          v-if="ctrl.type === 'enum'"
          :label="ctrl.label"
          :options="ctrl.options"
          :model-value="item[key]"
          @update:model-value="updateField(idx, String(key), $event)"
        />
        <ControlBoolean
          v-else-if="ctrl.type === 'boolean'"
          :label="ctrl.label"
          :model-value="item[key]"
          @update:model-value="updateField(idx, String(key), $event)"
        />
        <ControlString
          v-else-if="ctrl.type === 'string'"
          :label="ctrl.label"
          :model-value="item[key]"
          :multiline="ctrl.multiline"
          @update:model-value="updateField(idx, String(key), $event)"
        />
        <ControlNumber
          v-else-if="ctrl.type === 'number'"
          :label="ctrl.label"
          :model-value="item[key]"
          :min="ctrl.min"
          :max="ctrl.max"
          :step="ctrl.step"
          @update:model-value="updateField(idx, String(key), $event)"
        />
      </template>
    </div>

    <div v-if="!items.length" class="rounded-md border border-dashed border-neutral-300 p-4 text-center text-xs text-neutral-500 dark:border-neutral-700">
      No items. Click "Add" above.
    </div>
  </div>
</template>
