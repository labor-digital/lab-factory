<script setup lang="ts">
import type { FactoryNavItem } from '../../composables/useFactoryNavigation'

withDefaults(defineProps<{
  items?: FactoryNavItem[]
  title?: string
  copyright?: string
}>(), {
  items: () => [],
  title: 'Factory',
  copyright: ''
})
</script>

<template>
  <footer class="w-full bg-neutral-900 text-white py-12 mt-16">
    <UContainer>
      <div class="flex flex-col gap-8">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div class="flex items-center gap-3">
            <slot name="logo">
              <span class="text-xl font-bold text-(--ui-primary)">{{ title }}</span>
            </slot>
          </div>

          <nav v-if="items?.length" class="flex flex-wrap items-center gap-6">
            <NuxtLink
              v-for="item in items"
              :key="item.to"
              :to="item.to"
              class="text-sm text-white/70 hover:text-white transition"
            >
              {{ item.label }}
            </NuxtLink>
          </nav>
        </div>

        <div class="border-t border-white/10 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-white/50">
          <span>
            &copy; {{ new Date().getFullYear() }} {{ copyright || title }}
          </span>
          <slot name="meta" />
        </div>
      </div>
    </UContainer>
  </footer>
</template>
