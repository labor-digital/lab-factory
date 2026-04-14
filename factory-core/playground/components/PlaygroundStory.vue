<script setup lang="ts">
import { ref } from 'vue'
import type { StoryDefinition } from '~/stories/types'
import { useStoryState } from '~/composables/useStoryState'
import ControlEnum from '~/components/controls/ControlEnum.vue'
import ControlBoolean from '~/components/controls/ControlBoolean.vue'
import ControlString from '~/components/controls/ControlString.vue'
import ControlNumber from '~/components/controls/ControlNumber.vue'
import ControlArray from '~/components/controls/ControlArray.vue'

const props = defineProps<{ story: StoryDefinition }>()

const { values, content, reset, applyPreset } = useStoryState(props.story)

const copied = ref(false)
async function copyJson() {
  try {
    await navigator.clipboard.writeText(JSON.stringify(content.value, null, 2))
    copied.value = true
    setTimeout(() => (copied.value = false), 1200)
  } catch {
    // ignore
  }
}
</script>

<template>
  <div class="flex h-screen flex-col">
    <!-- Header -->
    <header class="flex items-center justify-between gap-4 border-b border-neutral-200 bg-white px-6 py-3 dark:border-neutral-800 dark:bg-neutral-900">
      <div>
        <h1 class="text-lg font-semibold">{{ story.title }}</h1>
        <p v-if="story.description" class="text-xs text-neutral-500">{{ story.description }}</p>
      </div>
      <div class="flex items-center gap-2">
        <UButton
          v-for="preset in (story.presets || [])"
          :key="preset.name"
          size="xs"
          color="neutral"
          variant="soft"
          @click="applyPreset(preset.values)"
        >
          {{ preset.name }}
        </UButton>
        <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-rotate-ccw" @click="reset">
          Reset
        </UButton>
      </div>
    </header>

    <!-- Body: controls | preview+code -->
    <div class="flex min-h-0 flex-1">
      <!-- Controls -->
      <section class="w-80 shrink-0 overflow-y-auto border-r border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <div class="flex flex-col gap-4">
          <template v-for="(ctrl, key) in story.controls" :key="key">
            <ControlEnum
              v-if="ctrl.type === 'enum'"
              :label="ctrl.label"
              :options="ctrl.options"
              :model-value="values[key]"
              @update:model-value="values[key] = $event"
            />
            <ControlBoolean
              v-else-if="ctrl.type === 'boolean'"
              :label="ctrl.label"
              :model-value="values[key]"
              @update:model-value="values[key] = $event"
            />
            <ControlString
              v-else-if="ctrl.type === 'string'"
              :label="ctrl.label"
              :model-value="values[key]"
              :multiline="ctrl.multiline"
              @update:model-value="values[key] = $event"
            />
            <ControlNumber
              v-else-if="ctrl.type === 'number'"
              :label="ctrl.label"
              :model-value="values[key]"
              :min="ctrl.min"
              :max="ctrl.max"
              :step="ctrl.step"
              @update:model-value="values[key] = $event"
            />
            <ControlArray
              v-else-if="ctrl.type === 'array'"
              :label="ctrl.label"
              :item-label="ctrl.itemLabel"
              :item-schema="ctrl.itemSchema"
              :model-value="values[key]"
              @update:model-value="values[key] = $event"
            />
          </template>
        </div>
      </section>

      <!-- Preview + code -->
      <section class="flex min-w-0 flex-1 flex-col">
        <div class="flex-1 overflow-auto bg-white dark:bg-neutral-950">
          <component :is="story.component" :content="content" />
        </div>

        <div class="h-64 shrink-0 border-t border-neutral-200 bg-neutral-950 text-neutral-100 dark:border-neutral-800">
          <div class="flex items-center justify-between border-b border-neutral-800 px-4 py-1.5 text-xs">
            <span class="font-mono uppercase tracking-wider text-neutral-400">content prop</span>
            <UButton size="xs" color="neutral" variant="ghost" :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'" @click="copyJson">
              {{ copied ? 'Copied' : 'Copy' }}
            </UButton>
          </div>
          <pre class="h-[calc(100%-2rem)] overflow-auto p-4 text-xs leading-relaxed"><code>{{ JSON.stringify(content, null, 2) }}</code></pre>
        </div>
      </section>
    </div>
  </div>
</template>
