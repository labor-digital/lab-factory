import type { StoryDefinition } from '~/stories/types'

// Eagerly import every story file. New story = drop a new file; no registry edits.
const modules = import.meta.glob<{ default: StoryDefinition }>('~/stories/*.story.ts', {
  eager: true
})

const stories: StoryDefinition[] = Object.values(modules)
  .map(m => m.default)
  .filter(Boolean)
  .sort((a, b) => a.title.localeCompare(b.title))

const bySlug = new Map<string, StoryDefinition>(stories.map(s => [s.slug, s]))

export function usePlaygroundStories() {
  return {
    stories,
    getStory: (slug: string) => bySlug.get(slug)
  }
}
