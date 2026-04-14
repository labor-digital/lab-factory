<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { Splide, SplideSlide } from '@splidejs/vue-splide'
import '@splidejs/vue-splide/css'
import BasePageHero from './BasePageHero.vue'
import Button from './Button.vue'
import { asBool } from '../../../utils/parseContent'
import { semanticColor } from '../../../utils/semanticColor'

const props = defineProps<{
  content: any
}>()

const AUTOPLAY_INTERVAL_MS = 6000

// Reactive mirror of the raw TYPO3 autoplay flag. BasePageHero parses this
// same value; we also read it here so we can drive Splide's Autoplay
// component imperatively (@splidejs/vue-splide does not re-init when the
// options prop changes, so toggling autoplay live in the playground needs
// a manual play()/pause() call on the instance).
const autoplayOn = computed(() => asBool(props.content?.content?.autoplay))

// Autoplay pause state — drives the .is-paused class on the root so the
// pagination pill's fill animation halts when Splide pauses (hover).
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
// Height presets
// ---------------------------------------------------------------------------
const heightClass: Record<string, string> = {
  small: 'h-[360px] md:h-[420px]',
  medium: 'h-[480px] md:h-[600px]',
  large: 'h-[560px] md:h-[720px]',
  fullscreen: 'h-screen'
}

// ---------------------------------------------------------------------------
// Content positioning
// ---------------------------------------------------------------------------
function outerPositionClass(x: string, y: string): string {
  const justify =
    x === 'left' ? 'justify-start' : x === 'right' ? 'justify-end' : 'justify-center'
  const items =
    y === 'top' ? 'items-start' : y === 'bottom' ? 'items-end' : 'items-center'
  return `${justify} ${items}`
}

function contentAlignClass(x: string): string {
  if (x === 'left') return 'items-start text-left'
  if (x === 'right') return 'items-end text-right'
  return 'items-center text-center'
}

function buttonWrapClass(x: string): string {
  if (x === 'left') return 'justify-start'
  if (x === 'right') return 'justify-end'
  return 'justify-center'
}

// ---------------------------------------------------------------------------
// Background / text-color logic
// ---------------------------------------------------------------------------
// All supported semantic color backgrounds are dark enough for white text
// under the auto setting. Editors can override per-slide via text_color.
function resolvedTextColor(slide: any): 'light' | 'dark' {
  if (slide.textColor === 'light') return 'light'
  if (slide.textColor === 'dark') return 'dark'
  // auto
  if (slide.background.type === 'color') return 'light'
  // image / video default to light + expect an overlay for contrast
  return 'light'
}

function textClass(slide: any): string {
  return resolvedTextColor(slide) === 'light' ? 'text-white' : 'text-neutral-900'
}

function overlayClass(overlay: string): string {
  if (overlay === 'dark') return 'bg-black/40'
  if (overlay === 'light') return 'bg-white/40'
  return ''
}

// ---------------------------------------------------------------------------
// Splide
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
  <BasePageHero :content="content" v-slot="{ uiProps }">
    <section
      :class="[
        'factory-page-hero relative w-full',
        { 'is-autoplay': uiProps.autoplay, 'is-paused': isPaused }
      ]"
      :style="{ '--slider-interval': `${AUTOPLAY_INTERVAL_MS}ms` }"
    >
      <Splide ref="splideRef" :options="splideOptions(uiProps)" :aria-label="'Hero'">
        <SplideSlide v-for="(slide, i) in uiProps.slides" :key="i">
          <article
            :class="[
              'relative w-full overflow-hidden',
              heightClass[uiProps.height] || heightClass.medium,
              textClass(slide)
            ]"
          >
            <!-- Background layer -->
            <div
              v-if="slide.background.type === 'color'"
              class="absolute inset-0"
              :style="{ background: semanticColor(slide.background.color) }"
            />
            <NuxtImg
              v-else-if="slide.background.type === 'image' && slide.background.image"
              :src="slide.background.image.src"
              :alt="slide.background.image.alt"
              class="absolute inset-0 size-full object-cover"
              loading="eager"
              sizes="100vw"
            />
            <video
              v-else-if="slide.background.type === 'video' && (slide.background.video || slide.background.videoUrl)"
              class="absolute inset-0 size-full object-cover"
              autoplay
              muted
              loop
              playsinline
              :src="slide.background.video?.src || slide.background.videoUrl"
            />

            <!-- Overlay / scrim -->
            <div
              v-if="slide.overlay !== 'none'"
              class="absolute inset-0"
              :class="overlayClass(slide.overlay)"
            />

            <!-- Content layer -->
            <div
              :class="[
                'relative mx-auto flex size-full max-w-7xl px-6 py-16 sm:py-24',
                outerPositionClass(uiProps.contentPositionX, uiProps.contentPositionY)
              ]"
            >
              <div
                :class="[
                  'flex flex-col gap-5 max-w-3xl',
                  contentAlignClass(uiProps.contentPositionX)
                ]"
              >
                <p
                  v-if="slide.eyebrow"
                  class="text-xs sm:text-sm font-bold tracking-[0.2em] uppercase opacity-60"
                >
                  {{ slide.eyebrow }}
                </p>
                <h1
                  v-if="slide.headline"
                  class="text-4xl sm:text-5xl md:text-6xl font-light leading-tight tracking-tight"
                  v-html="slide.headline"
                />
                <p
                  v-if="slide.text"
                  class="text-base sm:text-lg opacity-80"
                >
                  {{ slide.text }}
                </p>
                <div
                  v-if="slide.buttons.length"
                  :class="['flex flex-wrap gap-3 pt-2', buttonWrapClass(uiProps.contentPositionX)]"
                >
                  <Button v-for="(btn, bi) in slide.buttons" :key="bi" v-bind="btn" />
                </div>
              </div>
            </div>
          </article>
        </SplideSlide>
      </Splide>
    </section>
  </BasePageHero>
</template>

<style scoped>
/* Pagination — 6px dots on dark bg; active morphs into a 30px pill.
   When autoplay is on, the active pill fills left→right over the interval
   via a pseudo-element scaleX animation. The animation pauses when Splide
   pauses (hover) because we toggle .is-paused from autoplay events. */
.factory-page-hero {
  --pagination-inactive: rgba(255, 255, 255, 0.4);
  --pagination-track: rgba(255, 255, 255, 0.3);
  --pagination-active: #ffffff;
}
.factory-page-hero :deep(.splide__pagination) {
  bottom: 1.25rem;
  gap: 0.5rem;
}
.factory-page-hero :deep(.splide__pagination__page) {
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
.factory-page-hero :deep(.splide__pagination__page.is-active) {
  width: 30px;
  background: var(--pagination-track);
}
.factory-page-hero :deep(.splide__pagination__page.is-active::after) {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--pagination-active);
  transform-origin: left center;
  transform: scaleX(1);
}
.factory-page-hero.is-autoplay :deep(.splide__pagination__page.is-active::after) {
  transform: scaleX(0);
  animation: factory-slider-progress var(--slider-interval, 6s) linear forwards;
}
.factory-page-hero.is-paused :deep(.splide__pagination__page.is-active::after) {
  animation-play-state: paused;
}

@keyframes factory-slider-progress {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

.factory-page-hero :deep(.splide__arrow) {
  background: rgba(0, 0, 0, 0.4);
  color: #fff;
  width: 2.5rem;
  height: 2.5rem;
  opacity: 1;
}
.factory-page-hero :deep(.splide__arrow:hover) {
  background: rgba(0, 0, 0, 0.6);
}
.factory-page-hero :deep(.splide__arrow svg) {
  fill: currentColor;
}
</style>
