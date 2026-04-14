<script setup lang="ts">
import { usePlaygroundStories } from '~/composables/usePlaygroundStories'

const { stories } = usePlaygroundStories()
</script>

<template>
  <div class="p-10">
    <h1 class="mb-2 text-3xl font-semibold">Factory Playground</h1>
    <p class="mb-8 max-w-2xl text-sm text-neutral-600 dark:text-neutral-400">
      Interactive previews of components shipped by
      <code class="rounded bg-neutral-200 px-1.5 py-0.5 text-xs dark:bg-neutral-800">factory-core/nuxt-layer</code>.
      Pick a component from the sidebar; tweak controls on the left, watch the preview update live,
      and copy the generated TYPO3-shape <code>content</code> JSON from the bottom panel.
    </p>

    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <NuxtLink
        v-for="story in stories"
        :key="story.slug"
        :to="`/components/${story.slug}`"
        class="block rounded-lg border border-neutral-200 bg-white p-5 transition hover:border-neutral-400 hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-600"
      >
        <div class="text-base font-semibold">{{ story.title }}</div>
        <p v-if="story.description" class="mt-1 text-sm text-neutral-500">{{ story.description }}</p>
      </NuxtLink>
    </div>
  </div>
</template>
