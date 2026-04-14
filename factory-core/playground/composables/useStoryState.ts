import { reactive, computed, watch } from 'vue'
import type { ControlSchema, ControlDef, StoryDefinition } from '~/stories/types'

function defaultFor(ctrl: ControlDef): any {
  if (ctrl.type === 'array') {
    // Deep-ish clone so editing the state doesn't mutate the schema default.
    return JSON.parse(JSON.stringify(ctrl.default ?? []))
  }
  return ctrl.default
}

function defaultsFromSchema(schema: ControlSchema): Record<string, any> {
  const out: Record<string, any> = {}
  for (const [key, ctrl] of Object.entries(schema)) {
    out[key] = defaultFor(ctrl)
  }
  return out
}

export function useStoryState(story: StoryDefinition) {
  const values = reactive<Record<string, any>>(defaultsFromSchema(story.controls))

  function reset() {
    const fresh = defaultsFromSchema(story.controls)
    for (const k of Object.keys(values)) delete values[k]
    Object.assign(values, fresh)
  }

  function applyPreset(preset: Record<string, any>) {
    // Start from defaults so presets don't inherit stale fields.
    const fresh = defaultsFromSchema(story.controls)
    for (const k of Object.keys(values)) delete values[k]
    Object.assign(values, fresh, JSON.parse(JSON.stringify(preset)))
  }

  // Rehydrate when navigating between stories (the composable is re-created,
  // but a story swap on the same page should also work cleanly).
  watch(
    () => story.slug,
    () => reset()
  )

  const content = computed(() => story.buildContent(values as any))

  return { values, content, reset, applyPreset }
}
