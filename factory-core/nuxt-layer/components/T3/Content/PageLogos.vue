<script setup lang="ts">
import BasePageLogos from './BasePageLogos.vue'

defineProps<{
  content: any
}>()

function isImage(item: any): item is { src: string; alt: string } {
  return typeof item === 'object' && item !== null && 'src' in item
}
</script>

<template>
  <BasePageLogos :content="content" v-slot="{ uiProps }">
    <section class="w-full py-12 sm:py-16">
      <UContainer>
        <h2
          v-if="uiProps.title"
          class="text-center text-sm font-semibold uppercase tracking-wider text-muted mb-8"
        >
          {{ uiProps.title }}
        </h2>

        <div
          v-if="uiProps.items?.length"
          :class="[
            uiProps.marquee
              ? 'flex gap-12 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]'
              : 'grid gap-8 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 items-center justify-items-center'
          ]"
        >
          <div
            :class="uiProps.marquee ? 'flex gap-12 shrink-0 animate-[marquee_30s_linear_infinite]' : 'contents'"
          >
            <template v-for="(item, index) in uiProps.items" :key="index">
              <NuxtImg
                v-if="isImage(item)"
                :src="item.src"
                :alt="item.alt"
                class="h-10 w-auto opacity-70 hover:opacity-100 transition"
              />
              <UIcon
                v-else
                :name="item"
                class="size-10 text-muted hover:text-default transition"
              />
            </template>
          </div>
        </div>
      </UContainer>
    </section>
  </BasePageLogos>
</template>

<style scoped>
@keyframes marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-100%); }
}
</style>
