<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Splide, SplideSlide } from '@splidejs/vue-splide'
import '@splidejs/vue-splide/css'
import BaseTextSlider from './BaseTextSlider.vue'
import Button from './Button.vue'
import { asBool } from '../../../utils/parseContent'
import { semanticColor } from '../../../utils/semanticColor'

const props = defineProps<{
  content: any
}>()

const AUTOPLAY_INTERVAL_MS = 6000

// Reactive mirror of the raw TYPO3 autoplay flag. BaseTextSlider parses this
// same value for rendering; we also read it here so we can drive Splide's
// Autoplay component imperatively (the Vue wrapper does not re-init when the
// options prop changes, so toggling autoplay live in the playground needs a
// manual play()/pause() call on the instance).
const autoplayOn = computed(() => asBool(props.content?.content?.autoplay))

// Autoplay pause state — toggled by Splide's autoplay events so the
// progress-fill animation on the active pagination pill pauses on hover.
const splideRef = ref<any>(null)
const isPaused = ref(false)

onMounted(() => {
  const s = splideRef.value?.splide
  if (!s?.on) return
  s.on('autoplay:pause', () => { isPaused.value = true })
  s.on('autoplay:play', () => { isPaused.value = false })
})

watch(autoplayOn, (on) => {
  const splide = splideRef.value?.splide
  const ap = splide?.Components?.Autoplay
  if (!ap) return
  if (on) ap.play()
  else ap.pause()
})

// ---------------------------------------------------------------------------
// Header alignment
// ---------------------------------------------------------------------------
function textAlignClass(align: string): string {
  if (align === 'center') return 'items-center text-center'
  if (align === 'right') return 'items-end text-right'
  return 'items-start text-left'
}

function eyebrowRowJustify(align: string): string {
  if (align === 'center') return 'justify-center'
  if (align === 'right') return 'justify-end'
  return 'justify-start'
}

function buttonRowClass(align: string): string {
  if (align === 'center') return 'justify-center'
  if (align === 'right') return 'justify-end'
  return 'justify-start'
}

// Header row layout:
//   left  → text on the left, buttons pinned top-right (row)
//   right → mirror of left — text on the right, buttons pinned top-left (row-reverse)
//   center → stacked; buttons wrap under the centered text block
function headerRowClass(align: string): string {
  if (align === 'left') return 'lg:flex-row lg:items-end lg:justify-between lg:gap-10'
  if (align === 'right') return 'lg:flex-row-reverse lg:items-end lg:justify-between lg:gap-10'
  return ''
}

// ---------------------------------------------------------------------------
// Splide options
// ---------------------------------------------------------------------------
const splideOptions = (ui: any) => ({
  type: ui.loop && ui.slides.length > 1 ? 'loop' : 'slide',
  arrows: ui.showArrows && ui.slides.length > 1,
  pagination: ui.showPagination && ui.slides.length > 1,
  autoplay: ui.autoplay,
  interval: 6000,
  pauseOnHover: true,
  drag: ui.slides.length > 1,
  speed: 600,
  rewind: !ui.loop
})
</script>

<template>
  <BaseTextSlider :content="content" v-slot="{ uiProps }">
    <section
      :class="[
        'factory-text-slider relative w-full py-16 sm:py-20 lg:py-24',
        { 'is-autoplay': uiProps.autoplay, 'is-paused': isPaused }
      ]"
      :style="{ '--slider-interval': `${AUTOPLAY_INTERVAL_MS}ms` }"
    >
      <div class="mx-auto max-w-7xl px-6">
        <!-- Header row -->
        <div :class="['flex flex-col gap-6', headerRowClass(uiProps.textAlign)]">
          <div
            :class="[
              'flex flex-col gap-3',
              textAlignClass(uiProps.textAlign),
              uiProps.textAlign === 'center' ? 'mx-auto max-w-3xl' : 'max-w-2xl'
            ]"
          >
            <div
              v-if="uiProps.eyebrow"
              class="flex items-center gap-3"
              :class="eyebrowRowJustify(uiProps.textAlign)"
            >
              <span
                v-if="uiProps.eyebrowDecoration === 'bar'"
                class="h-0.5 w-6"
                :style="{ background: semanticColor(uiProps.eyebrowColor) }"
              />
              <span
                v-else-if="uiProps.eyebrowDecoration === 'dot'"
                class="size-1.5 rounded-full"
                :style="{ background: semanticColor(uiProps.eyebrowColor) }"
              />
              <span
                class="text-xs font-bold uppercase tracking-[0.2em]"
                :style="{ color: semanticColor(uiProps.eyebrowColor) }"
              >
                {{ uiProps.eyebrow }}
              </span>
            </div>

            <h2
              v-if="uiProps.title"
              class="factory-section-title text-3xl sm:text-4xl lg:text-5xl font-light leading-tight tracking-tight"
              :style="{ '--accent-color': semanticColor(uiProps.eyebrowColor) }"
              v-html="uiProps.title"
            />

            <p
              v-if="uiProps.description"
              class="text-base sm:text-lg leading-relaxed opacity-80"
              :style="{ whiteSpace: 'pre-line' }"
            >{{ uiProps.description }}</p>
          </div>

          <div
            v-if="uiProps.buttons.length"
            :class="[
              'flex flex-wrap gap-3',
              uiProps.textAlign === 'center' ? buttonRowClass(uiProps.textAlign) : 'lg:shrink-0'
            ]"
          >
            <Button v-for="(btn, bi) in uiProps.buttons" :key="bi" v-bind="btn" />
          </div>
        </div>

        <!-- Slider -->
        <div class="mt-10 lg:mt-12">
          <Splide ref="splideRef" :options="splideOptions(uiProps)" :aria-label="uiProps.title || 'Slider'">
            <SplideSlide v-for="(slide, i) in uiProps.slides" :key="slide._key">
              <figure class="factory-text-slider-slide">
                <div
                  class="relative w-full overflow-hidden bg-neutral-200"
                  :style="uiProps.aspectRatio === 'auto' ? {} : { aspectRatio: uiProps.aspectRatio.replace('/', ' / ') }"
                >
                  <NuxtImg
                    v-if="slide.type === 'image' && slide.image"
                    :src="slide.image.src"
                    :alt="slide.alt"
                    class="size-full object-cover"
                    :loading="i === 0 ? 'eager' : 'lazy'"
                  />
                  <video
                    v-else-if="slide.type === 'video' && slide.video"
                    class="size-full object-cover"
                    :poster="slide.poster?.src"
                    :src="slide.video.src"
                    controls
                    playsinline
                  />
                  <video
                    v-else-if="slide.type === 'video_url' && slide.videoUrl"
                    class="size-full object-cover"
                    :poster="slide.poster?.src"
                    :src="slide.videoUrl"
                    controls
                    playsinline
                  />
                </div>
                <figcaption
                  v-if="slide.caption"
                  class="mt-3 text-sm opacity-70"
                  :class="textAlignClass(uiProps.textAlign).split(' ').pop()"
                >
                  {{ slide.caption }}
                </figcaption>
              </figure>
            </SplideSlide>
          </Splide>
        </div>
      </div>
    </section>
  </BaseTextSlider>
</template>

<style scoped>
.factory-section-title :deep(strong) {
  font-weight: 700;
  color: var(--accent-color);
}

/* Pagination — 6px dots; active morphs into a 30px pill.
   When autoplay is on, the active pill fills left→right over the interval
   via a pseudo-element scaleX animation. The animation pauses when Splide
   pauses (hover) because we toggle .is-paused from autoplay events. */
.factory-text-slider {
  --pagination-inactive: #b1b1b1;
  --pagination-track: #d4d4d4;
  --pagination-active: #000;
}
.factory-text-slider :deep(.splide__pagination) {
  position: static;
  padding: 0;
  margin-top: 1.5rem;
  gap: 0.5rem;
}
.factory-text-slider :deep(.splide__pagination__page) {
  position: relative;
  overflow: hidden;
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  background: var(--pagination-inactive);
  opacity: 1;
  transform: none;
  margin: 0;
  transition: width 400ms ease, background-color 400ms ease;
}
.factory-text-slider :deep(.splide__pagination__page.is-active) {
  width: 30px;
  background: var(--pagination-track);
}
.factory-text-slider :deep(.splide__pagination__page.is-active::after) {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--pagination-active);
  transform-origin: left center;
  transform: scaleX(1);
}
.factory-text-slider.is-autoplay :deep(.splide__pagination__page.is-active::after) {
  transform: scaleX(0);
  animation: factory-slider-progress var(--slider-interval, 6s) linear forwards;
}
.factory-text-slider.is-paused :deep(.splide__pagination__page.is-active::after) {
  animation-play-state: paused;
}

@keyframes factory-slider-progress {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

.factory-text-slider :deep(.splide__arrow) {
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  width: 2.5rem;
  height: 2.5rem;
  opacity: 1;
}
.factory-text-slider :deep(.splide__arrow:hover) {
  background: rgba(0, 0, 0, 0.7);
}
.factory-text-slider :deep(.splide__arrow svg) {
  fill: currentColor;
}
</style>
