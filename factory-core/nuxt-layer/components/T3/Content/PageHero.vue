<script setup lang="ts">
import BasePageHero from './BasePageHero.vue'

defineProps<{
  content: any
}>()

function variantClasses(variant: string) {
  switch (variant) {
    case 'solid':
      return 'bg-(--ui-secondary) text-white'
    case 'soft':
      return 'bg-elevated'
    case 'subtle':
      return 'bg-elevated/50'
    case 'naked':
      return ''
    default:
      return ''
  }
}

function headlineClasses(variant: string) {
  return variant === 'solid'
    ? 'text-white/80 tracking-[0.3em]'
    : 'text-(--ui-primary) tracking-[0.2em]'
}

function titleClasses(variant: string) {
  return variant === 'solid'
    ? 'text-white font-light'
    : 'text-default'
}

function descriptionClasses(variant: string) {
  return variant === 'solid'
    ? 'text-white/80 uppercase tracking-[0.2em] text-sm'
    : 'text-muted'
}
</script>

<template>
  <BasePageHero :content="content" v-slot="{ uiProps }">
    <section :class="['w-full', variantClasses(uiProps.variant), uiProps.variant === 'naked' ? '' : 'py-16 sm:py-20 lg:py-24']">
      <UContainer>
        <div
          :class="[
            uiProps.orientation === 'horizontal'
              ? 'grid gap-10 lg:gap-16 items-center lg:grid-cols-2'
              : 'flex flex-col items-center text-center max-w-3xl mx-auto gap-6'
          ]"
        >
          <!-- Text content -->
          <div
            :class="[
              uiProps.orientation === 'horizontal' && uiProps.reverse ? 'lg:order-2' : '',
              uiProps.orientation === 'horizontal' ? 'flex flex-col gap-6' : 'flex flex-col gap-6 items-center'
            ]"
          >
            <span
              v-if="uiProps.headline"
              :class="['text-sm font-semibold uppercase', headlineClasses(uiProps.variant)]"
            >
              {{ uiProps.headline }}
            </span>

            <h1
              v-if="uiProps.title"
              :class="['text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight', titleClasses(uiProps.variant)]"
              v-html="uiProps.title"
            />

            <p
              v-if="uiProps.description"
              :class="['text-lg max-w-2xl', descriptionClasses(uiProps.variant)]"
            >
              {{ uiProps.description }}
            </p>

            <slot name="actions" :links="uiProps.links">
              <div
                v-if="uiProps.links?.length"
                :class="[
                  'flex flex-wrap gap-3 mt-2',
                  uiProps.orientation === 'vertical' ? 'justify-center' : ''
                ]"
              >
                <UButton
                  v-for="(link, i) in uiProps.links"
                  :key="i"
                  :label="link.label"
                  :to="link.to"
                  :color="link.color"
                  :variant="link.variant"
                  :size="link.size"
                  :icon="link.icon"
                  :trailing="link.trailing"
                />
              </div>
            </slot>
          </div>

          <!-- Media -->
          <div
            v-if="uiProps.image || $slots.media"
            :class="[
              uiProps.orientation === 'horizontal' && uiProps.reverse ? 'lg:order-1' : '',
              uiProps.orientation === 'vertical' ? 'w-full max-w-2xl' : ''
            ]"
          >
            <slot name="media" :image="uiProps.image">
              <NuxtImg
                v-if="uiProps.image"
                :src="uiProps.image.src"
                :alt="uiProps.image.alt"
                :width="uiProps.image.width"
                :height="uiProps.image.height"
                class="w-full h-auto rounded-(--ui-radius) shadow-xl ring-1 ring-default/10"
              />
            </slot>
          </div>
        </div>
      </UContainer>
    </section>
  </BasePageHero>
</template>
