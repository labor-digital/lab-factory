<script setup lang="ts">
import BasePageGrid from './BasePageGrid.vue'
import ContentContainer from './ContentContainer.vue'

defineProps<{
  content: any
}>()

const colSpanClass: Record<string, string> = {
  '1': 'lg:col-span-1',
  '2': 'lg:col-span-2',
  '3': 'lg:col-span-3'
}

function cardVariantClasses(variant: string) {
  switch (variant) {
    case 'solid':
      return 'bg-(--ui-primary) text-white'
    case 'soft':
      return 'bg-elevated'
    case 'subtle':
      return 'bg-elevated/50'
    case 'ghost':
      return 'bg-transparent'
    case 'naked':
      return 'bg-transparent p-0'
    case 'outline':
    default:
      return 'bg-default border border-default'
  }
}

function highlightColorVar(color: string | undefined) {
  if (!color) return undefined
  return `var(--ui-color-${color}-500, var(--ui-${color}))`
}
</script>

<template>
  <BasePageGrid :content="content" v-slot="{ uiProps }">
    <ContentContainer>
      <div class="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <component
          :is="card.to ? 'a' : 'article'"
          v-for="(card, index) in uiProps.cards"
          :key="index"
          :href="card.to"
          :target="card.target"
          :class="[
            colSpanClass[card.colSpan],
            cardVariantClasses(card.variant),
            'rounded-(--ui-radius) p-6 flex gap-4 transition',
            card.orientation === 'horizontal' ? 'flex-row items-start' : 'flex-col',
            card.orientation === 'horizontal' && card.reverse ? 'flex-row-reverse' : '',
            card.orientation === 'vertical' && card.reverse ? 'flex-col-reverse' : '',
            card.highlight ? 'ring-2' : '',
            card.to ? 'hover:shadow-lg hover:-translate-y-0.5' : '',
            card.spotlight ? 'relative overflow-hidden' : ''
          ]"
          :style="card.highlight && card.highlightColor ? { '--tw-ring-color': highlightColorVar(card.highlightColor) } : undefined"
        >
          <NuxtImg
            v-if="card.image"
            :src="card.image.src"
            :alt="card.image.alt"
            :width="card.image.width"
            :height="card.image.height"
            class="w-full h-auto rounded-(--ui-radius)"
          />

          <div
            v-else-if="card.icon"
            :class="[
              'flex items-center justify-center size-14 rounded-full shrink-0',
              card.variant === 'solid' ? 'bg-white/15' : 'bg-(--ui-primary)/10',
              card.orientation === 'vertical' ? 'mx-auto' : ''
            ]"
          >
            <UIcon
              :name="card.icon"
              :class="['size-6', card.variant === 'solid' ? 'text-white' : 'text-(--ui-primary)']"
            />
          </div>

          <div
            :class="[
              'flex flex-col gap-2',
              card.orientation === 'vertical' ? 'text-center' : ''
            ]"
          >
            <h3
              v-if="card.title"
              :class="['font-semibold text-lg', card.variant === 'solid' ? 'text-white' : 'text-default']"
            >
              {{ card.title }}
            </h3>
            <p
              v-if="card.description"
              :class="['text-sm', card.variant === 'solid' ? 'text-white/80' : 'text-muted']"
            >
              {{ card.description }}
            </p>
          </div>
        </component>
      </div>
    </ContentContainer>
  </BasePageGrid>
</template>
