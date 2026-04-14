import type { Component } from 'vue'

export type ControlDef =
  | {
      type: 'enum'
      label: string
      options: { label: string; value: any }[]
      default: any
    }
  | {
      type: 'boolean'
      label: string
      default: boolean
    }
  | {
      type: 'string'
      label: string
      default: string
      multiline?: boolean
    }
  | {
      type: 'number'
      label: string
      default: number
      min?: number
      max?: number
      step?: number
    }
  | {
      type: 'array'
      label: string
      itemLabel?: string
      itemSchema: Record<string, ControlDef>
      default: any[]
    }

export type ControlSchema = Record<string, ControlDef>

export type ControlValues<S extends ControlSchema> = {
  [K in keyof S]: any
}

export interface StoryPreset<T = Record<string, any>> {
  name: string
  values: Partial<T>
}

export interface StoryDefinition<T extends Record<string, any> = Record<string, any>> {
  slug: string
  title: string
  description?: string
  component: Component
  controls: ControlSchema
  buildContent: (values: T) => { content: Record<string, any> } & Record<string, any>
  presets?: StoryPreset<T>[]
}

export function defineStory<T extends Record<string, any>>(story: StoryDefinition<T>): StoryDefinition<T> {
  return story
}
