<script setup lang="ts">
import BasePageSection from './BasePageSection.vue'

defineProps<{
  content: any
}>()
</script>

<template>
  <BasePageSection :content="content" v-slot="{ uiProps }">
    <section class="w-full py-16 sm:py-20 lg:py-24">
      <UContainer>
        <div
          :class="[
            uiProps.orientation === 'horizontal'
              ? 'grid gap-12 lg:gap-16 items-center lg:grid-cols-2'
              : 'flex flex-col gap-10 max-w-3xl mx-auto text-center'
          ]"
        >
          <!-- Text content -->
          <div
            :class="[
              uiProps.orientation === 'horizontal' && uiProps.reverse ? 'lg:order-2' : '',
              'flex flex-col gap-6'
            ]"
          >
            <UIcon
              v-if="uiProps.icon"
              :name="uiProps.icon"
              class="size-10 text-(--ui-primary)"
              :class="uiProps.orientation === 'vertical' ? 'mx-auto' : ''"
            />

            <span
              v-if="uiProps.headline"
              class="text-sm font-semibold uppercase tracking-wider text-(--ui-primary)"
            >
              {{ uiProps.headline }}
            </span>

            <h2
              v-if="uiProps.title"
              class="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-default"
              v-html="uiProps.title"
            />

            <p
              v-if="uiProps.description"
              class="text-lg text-muted"
            >
              {{ uiProps.description }}
            </p>

            <!-- Features -->
            <slot name="features" :features="uiProps.features">
              <ul
                v-if="uiProps.features?.length"
                class="flex flex-col gap-6 mt-4"
              >
                <li
                  v-for="(feature, i) in uiProps.features"
                  :key="i"
                  :class="[
                    'flex gap-4',
                    feature.orientation === 'vertical' ? 'flex-col' : 'flex-row items-start'
                  ]"
                >
                  <UIcon
                    v-if="feature.icon"
                    :name="feature.icon"
                    class="size-6 text-(--ui-primary) shrink-0"
                  />
                  <div class="flex flex-col gap-1">
                    <h3
                      v-if="feature.title"
                      class="font-semibold text-default"
                    >
                      {{ feature.title }}
                    </h3>
                    <p
                      v-if="feature.description"
                      class="text-sm text-muted"
                    >
                      {{ feature.description }}
                    </p>
                  </div>
                </li>
              </ul>
            </slot>

            <!-- Links -->
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
                class="w-full h-auto rounded-(--ui-radius) shadow-xl ring-1 ring-default/10"
              />
            </slot>
          </div>
        </div>
      </UContainer>
    </section>
  </BasePageSection>
</template>
