<script setup lang="ts">
import { usePlaygroundStories } from '~/composables/usePlaygroundStories'
import PlaygroundStory from '~/components/PlaygroundStory.vue'

const route = useRoute()
const { getStory } = usePlaygroundStories()

const slug = computed(() => String(route.params.slug))
const story = computed(() => getStory(slug.value))
</script>

<template>
  <div v-if="story" :key="story.slug">
    <PlaygroundStory :story="story" />
  </div>
  <div v-else class="flex h-screen items-center justify-center text-neutral-500">
    <div class="text-center">
      <div class="text-sm uppercase tracking-wider">Not found</div>
      <div class="mt-2 text-lg">No story for “{{ slug }}”.</div>
      <NuxtLink to="/" class="mt-4 inline-block text-sm text-primary-600 underline">Back to index</NuxtLink>
    </div>
  </div>
</template>
