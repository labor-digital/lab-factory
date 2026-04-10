<script setup lang="ts">
import type { FactoryNavItem } from '../../composables/useFactoryNavigation'

const props = withDefaults(defineProps<{
  items?: FactoryNavItem[]
  title?: string
  to?: string
  sticky?: boolean
  transparent?: boolean
  layout?: 'default' | 'centered'
}>(), {
  items: () => [],
  title: 'Factory',
  to: '/',
  sticky: false,
  transparent: false,
  layout: 'default'
})

const open = ref(false)

function toggle() {
  open.value = !open.value
}

function close() {
  open.value = false
}
</script>

<template>
  <header
    :class="[
      'w-full z-40',
      sticky ? 'sticky top-0' : '',
      transparent ? 'bg-transparent' : 'bg-default border-b border-default'
    ]"
  >
    <UContainer>
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <NuxtLink :to="to" class="flex items-center gap-2">
          <slot name="logo">
            <span class="text-xl font-bold text-(--ui-primary)">{{ title }}</span>
          </slot>
        </NuxtLink>

        <!-- Desktop nav -->
        <nav
          :class="[
            'hidden lg:flex items-center gap-8',
            layout === 'centered' ? 'absolute left-1/2 -translate-x-1/2' : ''
          ]"
        >
          <NuxtLink
            v-for="item in items"
            :key="item.to"
            :to="item.to"
            class="text-sm font-medium text-default hover:text-(--ui-primary) transition uppercase tracking-wide"
          >
            {{ item.label }}
          </NuxtLink>
        </nav>

        <!-- Right actions -->
        <div class="hidden lg:flex items-center gap-3">
          <slot name="actions" />
        </div>

        <!-- Mobile toggle -->
        <button
          type="button"
          class="lg:hidden p-2 -mr-2"
          aria-label="Toggle menu"
          @click="toggle"
        >
          <UIcon :name="open ? 'i-heroicons-x-mark' : 'i-heroicons-bars-3'" class="size-6" />
        </button>
      </div>

      <!-- Mobile menu -->
      <div v-if="open" class="lg:hidden border-t border-default py-4">
        <nav class="flex flex-col gap-3">
          <NuxtLink
            v-for="item in items"
            :key="item.to"
            :to="item.to"
            class="text-sm font-medium text-default hover:text-(--ui-primary) transition uppercase tracking-wide"
            @click="close"
          >
            {{ item.label }}
          </NuxtLink>
        </nav>
        <div class="mt-4 flex flex-col gap-3">
          <slot name="actions" />
        </div>
      </div>
    </UContainer>
  </header>
</template>
