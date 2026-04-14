<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { Icon } from '@iconify/vue'
import { Splide, SplideSlide } from '@splidejs/vue-splide'
import '@splidejs/vue-splide/css'
import BasePageSection from './BasePageSection.vue'
import Button from './Button.vue'
import { semanticColor } from '../../../utils/semanticColor'

defineProps<{
  content: any
}>()

// ---------------------------------------------------------------------------
// Text column max-width presets (applied when media is top/bottom or text-only)
// ---------------------------------------------------------------------------
const textMaxWidthClass: Record<string, string> = {
  narrow: 'max-w-2xl',
  normal: 'max-w-3xl',
  wide: 'max-w-5xl',
  full: 'w-full'
}

// ---------------------------------------------------------------------------
// Media/text relative widths (only for left/right positions)
// ---------------------------------------------------------------------------
function mediaColumnClass(position: string, width: string): string {
  if (position !== 'left' && position !== 'right') return 'w-full'
  if (width === 'narrow') return 'lg:w-1/3'
  if (width === 'wide') return 'lg:w-2/3'
  return 'lg:w-1/2'
}

function textColumnClass(position: string, width: string): string {
  if (position !== 'left' && position !== 'right') return 'w-full'
  if (width === 'narrow') return 'lg:w-2/3'
  if (width === 'wide') return 'lg:w-1/3'
  return 'lg:w-1/2'
}

function flexDirectionClass(position: string): string {
  switch (position) {
    case 'left': return 'flex flex-col-reverse lg:flex-row-reverse'
    case 'right': return 'flex flex-col lg:flex-row'
    case 'top': return 'flex flex-col-reverse'
    case 'bottom': return 'flex flex-col'
    default: return 'flex flex-col lg:flex-row'
  }
}

function contentAlignClass(align: string): string {
  if (align === 'center') return 'items-center text-center'
  if (align === 'right') return 'items-end text-right'
  return 'items-start text-left'
}

function buttonRowClass(align: string): string {
  if (align === 'center') return 'justify-center'
  if (align === 'right') return 'justify-end'
  return 'justify-start'
}

// ---------------------------------------------------------------------------
// Overlay
// ---------------------------------------------------------------------------
function overlayClass(overlay: string): string {
  if (overlay === 'dark') return 'bg-black/40'
  if (overlay === 'light') return 'bg-white/40'
  return ''
}

// ---------------------------------------------------------------------------
// Splide
// ---------------------------------------------------------------------------
const splideOptions = (ui: any) => ({
  type: ui.media.length > 1 ? 'loop' : 'slide',
  arrows: ui.showArrows && ui.media.length > 1,
  pagination: ui.showPagination && ui.media.length > 1,
  drag: ui.media.length > 1,
  speed: 500
})

// ---------------------------------------------------------------------------
// Lightbox
// ---------------------------------------------------------------------------
const lightboxOpen = ref(false)
const lightboxIndex = ref(0)
const lightboxSplideRef = ref<any>(null)

function openLightbox(index: number) {
  lightboxIndex.value = index
  lightboxOpen.value = true
}

function closeLightbox() {
  lightboxOpen.value = false
}

function onKey(e: KeyboardEvent) {
  if (!lightboxOpen.value) return
  if (e.key === 'Escape') closeLightbox()
  if (e.key === 'ArrowRight') lightboxSplideRef.value?.go?.('+1')
  if (e.key === 'ArrowLeft') lightboxSplideRef.value?.go?.('-1')
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

// Lock body scroll while lightbox is open.
watch(lightboxOpen, async (open) => {
  if (typeof document === 'undefined') return
  document.body.style.overflow = open ? 'hidden' : ''
  if (open) {
    await nextTick()
    lightboxSplideRef.value?.go?.(lightboxIndex.value)
  }
})
</script>

<template>
  <BasePageSection :content="content" v-slot="{ uiProps }">
    <section
      class="factory-page-section relative w-full py-16 sm:py-20 lg:py-24"
      :class="[uiProps.backgroundType !== 'none' ? 'overflow-hidden' : '']"
    >
      <!-- Background layer -->
      <div
        v-if="uiProps.backgroundType === 'color'"
        class="absolute inset-0 -z-10"
        :style="{ background: semanticColor(uiProps.backgroundColor) }"
      />
      <NuxtImg
        v-else-if="uiProps.backgroundType === 'image' && uiProps.backgroundImage"
        :src="uiProps.backgroundImage.src"
        :alt="uiProps.backgroundImage.alt"
        class="absolute inset-0 -z-10 size-full object-cover"
      />
      <div
        v-if="uiProps.backgroundType !== 'none' && uiProps.backgroundOverlay !== 'none'"
        class="absolute inset-0 -z-10"
        :class="overlayClass(uiProps.backgroundOverlay)"
      />

      <!-- Content -->
      <div class="mx-auto max-w-7xl px-6">
        <div
          :class="[
            flexDirectionClass(uiProps.mediaPosition),
            'gap-10 lg:gap-20',
            uiProps.mediaPosition === 'left' || uiProps.mediaPosition === 'right' ? 'items-center' : ''
          ]"
        >
          <!-- Text column -->
          <div
            :class="[
              'flex flex-col gap-6',
              textColumnClass(uiProps.mediaPosition, uiProps.mediaWidth),
              contentAlignClass(uiProps.contentAlign),
              uiProps.mediaPosition === 'top' || uiProps.mediaPosition === 'bottom'
                ? `${textMaxWidthClass[uiProps.textMaxWidth] || textMaxWidthClass.normal} ${uiProps.contentAlign === 'center' ? 'mx-auto' : ''}`
                : ''
            ]"
          >
            <Icon
              v-if="uiProps.icon"
              :icon="uiProps.icon.startsWith('i-') ? uiProps.icon.slice(2).replace('-', ':') : uiProps.icon"
              class="size-10"
              :style="{ color: semanticColor(uiProps.eyebrowColor) }"
            />

            <div
              v-if="uiProps.eyebrow"
              class="flex items-center gap-3"
              :class="{ 'justify-center': uiProps.contentAlign === 'center', 'justify-end': uiProps.contentAlign === 'right' }"
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

            <div
              v-if="uiProps.buttons.length"
              :class="['flex flex-wrap gap-3 pt-2', buttonRowClass(uiProps.contentAlign)]"
            >
              <Button v-for="(btn, bi) in uiProps.buttons" :key="bi" v-bind="btn" />
            </div>
          </div>

          <!-- Media column -->
          <div
            v-if="uiProps.media.length"
            :class="[mediaColumnClass(uiProps.mediaPosition, uiProps.mediaWidth)]"
          >
            <!-- Single media: no slider init -->
            <template v-if="uiProps.media.length === 1">
              <figure class="factory-media relative">
                <button
                  type="button"
                  class="group relative block w-full overflow-hidden bg-neutral-200"
                  :style="uiProps.aspectRatio === 'auto' ? {} : { aspectRatio: uiProps.aspectRatio.replace('/', ' / ') }"
                  :disabled="!uiProps.enableLightbox"
                  @click="uiProps.enableLightbox && openLightbox(0)"
                >
                  <NuxtImg
                    v-if="uiProps.media[0].type === 'image' && uiProps.media[0].image"
                    :src="uiProps.media[0].image.src"
                    :alt="uiProps.media[0].alt"
                    class="size-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                  <video
                    v-else-if="uiProps.media[0].type === 'video' && (uiProps.media[0].video || uiProps.media[0].videoUrl)"
                    class="size-full object-cover"
                    :poster="uiProps.media[0].poster?.src"
                    :src="uiProps.media[0].video?.src || uiProps.media[0].videoUrl"
                    controls
                    playsinline
                  />
                  <figcaption
                    v-if="uiProps.media[0].caption && uiProps.captionPosition === 'overlay'"
                    class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3 text-sm text-white"
                  >
                    {{ uiProps.media[0].caption }}
                  </figcaption>
                </button>
                <figcaption
                  v-if="uiProps.media[0].caption && uiProps.captionPosition === 'below'"
                  class="mt-2 text-sm opacity-70"
                >
                  {{ uiProps.media[0].caption }}
                </figcaption>
              </figure>
            </template>

            <!-- Slider for multi-media -->
            <Splide v-else :options="splideOptions(uiProps)" :aria-label="'Gallery'">
              <SplideSlide v-for="(item, i) in uiProps.media" :key="item._key">
                <figure class="factory-media relative">
                  <button
                    type="button"
                    class="group relative block w-full overflow-hidden bg-neutral-200"
                    :style="uiProps.aspectRatio === 'auto' ? {} : { aspectRatio: uiProps.aspectRatio.replace('/', ' / ') }"
                    :disabled="!uiProps.enableLightbox"
                    @click="uiProps.enableLightbox && openLightbox(i)"
                  >
                    <NuxtImg
                      v-if="item.type === 'image' && item.image"
                      :src="item.image.src"
                      :alt="item.alt"
                      class="size-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                    <video
                      v-else-if="item.type === 'video' && (item.video || item.videoUrl)"
                      class="size-full object-cover"
                      :poster="item.poster?.src"
                      :src="item.video?.src || item.videoUrl"
                      controls
                      playsinline
                    />
                    <figcaption
                      v-if="item.caption && uiProps.captionPosition === 'overlay'"
                      class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3 text-sm text-white"
                    >
                      {{ item.caption }}
                    </figcaption>
                  </button>
                  <figcaption
                    v-if="item.caption && uiProps.captionPosition === 'below'"
                    class="mt-2 text-sm opacity-70"
                  >
                    {{ item.caption }}
                  </figcaption>
                </figure>
              </SplideSlide>
            </Splide>
          </div>
        </div>
      </div>
    </section>

    <!-- Lightbox modal -->
    <Teleport to="body">
      <div
        v-if="lightboxOpen"
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4"
        role="dialog"
        aria-modal="true"
        @click.self="closeLightbox"
      >
        <button
          type="button"
          class="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          aria-label="Close"
          @click="closeLightbox"
        >
          <Icon icon="lucide:x" class="size-5" />
        </button>

        <div class="relative w-full max-w-6xl">
          <Splide
            ref="lightboxSplideRef"
            :options="{ type: uiProps.media.length > 1 ? 'loop' : 'slide', arrows: uiProps.media.length > 1, pagination: false, drag: uiProps.media.length > 1, start: lightboxIndex }"
          >
            <SplideSlide v-for="item in uiProps.media" :key="`lb-${item._key}`">
              <div class="flex flex-col items-center gap-3">
                <div class="flex w-full items-center justify-center">
                  <NuxtImg
                    v-if="item.type === 'image' && item.image"
                    :src="item.image.src"
                    :alt="item.alt"
                    class="max-h-[80vh] w-auto object-contain"
                  />
                  <video
                    v-else-if="item.type === 'video' && (item.video || item.videoUrl)"
                    class="max-h-[80vh] w-auto"
                    :poster="item.poster?.src"
                    :src="item.video?.src || item.videoUrl"
                    controls
                    autoplay
                    playsinline
                  />
                </div>
                <p v-if="item.caption" class="text-sm text-white/80">{{ item.caption }}</p>
              </div>
            </SplideSlide>
          </Splide>
        </div>
      </div>
    </Teleport>
  </BasePageSection>
</template>

<style scoped>
.factory-section-title :deep(strong) {
  font-weight: 700;
  color: var(--accent-color);
}

.factory-page-section :deep(.splide__pagination__page) {
  width: 24px;
  height: 4px;
  border-radius: 9999px;
  background: currentColor;
  opacity: 0.4;
  transform: none;
  margin: 0 3px;
}
.factory-page-section :deep(.splide__pagination__page.is-active) {
  opacity: 1;
  transform: none;
}
.factory-page-section :deep(.splide__arrow) {
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  width: 2.5rem;
  height: 2.5rem;
  opacity: 1;
}
.factory-page-section :deep(.splide__arrow:hover) {
  background: rgba(0, 0, 0, 0.7);
}
</style>
