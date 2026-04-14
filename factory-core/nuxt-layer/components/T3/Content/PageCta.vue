<script setup lang="ts">
import BasePageCta from './BasePageCta.vue'
import Button from './Button.vue'

defineProps<{
  content: any
}>()

function variantClasses(variant: string) {
  switch (variant) {
    case 'solid':
      return 'bg-(--ui-primary) text-white'
    case 'soft':
      return 'bg-elevated'
    case 'subtle':
      return 'bg-elevated/50'
    case 'naked':
      return ''
    case 'outline':
    default:
      return 'border border-default bg-default'
  }
}

function titleClasses(variant: string) {
  return variant === 'solid' ? 'text-white' : 'text-default'
}

function descriptionClasses(variant: string) {
  return variant === 'solid' ? 'text-white/80' : 'text-muted'
}
</script>

<template>
  <BasePageCta :content="content" v-slot="{ uiProps }">
    <section class="w-full py-16 sm:py-20">
      <UContainer>
        <div
          :class="[
            variantClasses(uiProps.variant),
            'rounded-(--ui-radius)',
            uiProps.variant === 'naked' ? '' : 'p-8 sm:p-12 lg:p-16',
            uiProps.orientation === 'horizontal'
              ? 'grid gap-10 lg:gap-16 items-center lg:grid-cols-2'
              : 'flex flex-col items-center text-center gap-6 max-w-3xl mx-auto'
          ]"
        >
          <!-- Text content -->
          <div
            :class="[
              uiProps.orientation === 'horizontal' && uiProps.reverse ? 'lg:order-2' : '',
              uiProps.orientation === 'horizontal' ? 'flex flex-col gap-4' : 'flex flex-col gap-4 items-center'
            ]"
          >
            <h2
              v-if="uiProps.title"
              :class="['text-3xl sm:text-4xl font-bold tracking-tight', titleClasses(uiProps.variant)]"
              v-html="uiProps.title"
            />
            <p
              v-if="uiProps.description"
              :class="['text-lg', descriptionClasses(uiProps.variant)]"
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
                <Button
                  v-for="(link, i) in uiProps.links"
                  :key="i"
                  v-bind="link"
                />
              </div>
            </slot>
          </div>

          <!-- Media -->
          <div
            v-if="uiProps.image || $slots.media"
            :class="[
              uiProps.orientation === 'horizontal' && uiProps.reverse ? 'lg:order-1' : ''
            ]"
          >
            <slot name="media" :image="uiProps.image">
              <NuxtImg
                v-if="uiProps.image"
                :src="uiProps.image.src"
                :alt="uiProps.image.alt"
                :width="uiProps.image.width"
                :height="uiProps.image.height"
                class="w-full h-auto rounded-(--ui-radius)"
              />
            </slot>
          </div>
        </div>
      </UContainer>
    </section>
  </BasePageCta>
</template>
