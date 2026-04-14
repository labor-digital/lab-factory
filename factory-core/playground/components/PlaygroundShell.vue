<script setup lang="ts">
import { usePlaygroundStories } from '~/composables/usePlaygroundStories'

const { stories } = usePlaygroundStories()
const route = useRoute()
</script>

<template>
  <div class="flex min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
    <aside class="sticky top-0 h-screen w-60 shrink-0 overflow-y-auto border-r border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <NuxtLink to="/" class="mb-6 block">
        <div class="text-base font-semibold">Factory</div>
        <div class="text-xs uppercase tracking-widest text-neutral-500">Playground</div>
      </NuxtLink>

      <div class="mb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Components</div>
      <nav class="flex flex-col gap-0.5">
        <NuxtLink
          v-for="story in stories"
          :key="story.slug"
          :to="`/components/${story.slug}`"
          class="rounded-md px-3 py-1.5 text-sm transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
          :class="{
            'bg-neutral-100 font-medium dark:bg-neutral-800': route.path === `/components/${story.slug}`
          }"
        >
          {{ story.title }}
        </NuxtLink>
      </nav>
    </aside>

    <main class="flex-1 min-w-0">
      <slot />
    </main>
  </div>
</template>
