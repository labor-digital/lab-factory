<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount, resolveDynamicComponent } from 'vue'
import { Splide, SplideSlide } from '@splidejs/vue-splide'
import '@splidejs/vue-splide/css'
import BaseReferenceList from './BaseReferenceList.vue'
import Button from './Button.vue'
import { semanticColor } from '../../../utils/semanticColor'

defineProps<{
  content: any
}>()

// Breakout mode measures the distance from the parent container's content
// edge(s) to the viewport edge(s) and exposes them as CSS variables. This
// makes the breakout work whether the component is centered in the viewport
// (typical production) or inside a sidebar-offset layout (the playground).
const breakoutRef = ref<HTMLElement | null>(null)
const breakoutExtLeft = ref<string>('1.5rem')
const breakoutExtRight = ref<string>('1.5rem')
let breakoutObserver: ResizeObserver | null = null

function measureBreakout() {
  const el = breakoutRef.value
  if (!el || !el.parentElement) return
  const rect = el.parentElement.getBoundingClientRect()
  const style = getComputedStyle(el.parentElement)
  const paddingLeft = parseFloat(style.paddingLeft) || 0
  const paddingRight = parseFloat(style.paddingRight) || 0
  const contentLeft = rect.left + paddingLeft
  const contentRight = rect.right - paddingRight
  breakoutExtLeft.value = `${Math.max(24, contentLeft)}px`
  breakoutExtRight.value = `${Math.max(24, window.innerWidth - contentRight)}px`
}

// `breakoutRef` only populates once the user switches to slider layout,
// so we watch it and attach a ResizeObserver when it appears.
watch(breakoutRef, (el) => {
  breakoutObserver?.disconnect()
  breakoutObserver = null
  if (!el) return
  measureBreakout()
  if (typeof ResizeObserver !== 'undefined' && el.parentElement) {
    breakoutObserver = new ResizeObserver(() => measureBreakout())
    breakoutObserver.observe(el.parentElement)
  }
}, { flush: 'post' })

if (typeof window !== 'undefined') {
  window.addEventListener('resize', measureBreakout)
}
onBeforeUnmount(() => {
  breakoutObserver?.disconnect()
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', measureBreakout)
  }
})

// Arrow-disabled sync. Splide's built-in `disabled` attribute is unreliable
// with `autoWidth: true` — it doesn't flip when the track reaches its
// clamped end. We bind a ref on the Splide wrapper and, once its internal
// splide instance is live, listen to `mounted` / `moved` / `resize` events
// to toggle the arrows' `disabled` attribute ourselves.
const splideRef = ref<any>(null)

function getSplideInstance(): any {
  // The Splide Vue wrapper exposes `splide` on setupState (not via
  // defineExpose), so we dig through the internal proxy to reach it.
  const ref: any = splideRef.value
  if (!ref) return null
  return ref.splide || ref.$?.setupState?.splide || ref.$?.ctx?.splide || null
}

function syncArrowDisabled() {
  const splide = getSplideInstance()
  if (!splide) return
  const idx = splide.index
  const length = splide.length
  // Splide's Controller.getEnd() returns `length - 1` under autoWidth, but the
  // track visually stops moving once the last `perPage` slides are in view.
  // Compute our own end from length and perPage so arrows disable at the
  // visual end (= length - perPage), not at the last slide index.
  const perPage = Number(splide.options.perPage) || 1
  const end = Math.max(0, length - perPage)
  const atStart = idx <= 0
  const atEnd = idx >= end
  const root = splide.root as HTMLElement
  const prev = root.querySelector('.splide__arrow--prev') as HTMLButtonElement | null
  const next = root.querySelector('.splide__arrow--next') as HTMLButtonElement | null
  const loop = splide.options.type === 'loop'
  if (prev) prev.disabled = !loop && atStart
  if (next) next.disabled = !loop && atEnd
}

// The Splide Vue wrapper mounts its internal Splide AFTER the Vue ref is set.
// A function template ref runs on mount/unmount; we poll briefly inside it
// until the internal Splide instance is live, then attach native Splide
// events (Vue-level @splide:mounted does not fire reliably in this version).
function handleSplideRef(el: any) {
  splideRef.value = el
  if (!el || typeof window === 'undefined') return
  let attempts = 0
  const attach = () => {
    const splide = getSplideInstance()
    if (splide && typeof splide.on === 'function') {
      splide.on('mounted move moved resize', syncArrowDisabled)
      syncArrowDisabled()
      return true
    }
    return false
  }
  if (attach()) return
  const id = setInterval(() => {
    if (attach() || ++attempts > 30) clearInterval(id)
  }, 50)
}

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

function headerRowClass(align: string): string {
  if (align === 'left') return 'lg:flex-row lg:items-end lg:justify-between lg:gap-10'
  if (align === 'right') return 'lg:flex-row-reverse lg:items-end lg:justify-between lg:gap-10'
  return ''
}

function gridClass(columns: string): string {
  if (columns === '2') return 'md:grid-cols-2'
  if (columns === '4') return 'md:grid-cols-2 lg:grid-cols-4'
  return 'md:grid-cols-2 lg:grid-cols-3'
}

const perPageForColumns = (columns: string): number => {
  if (columns === '2') return 2
  if (columns === '4') return 4
  return 3
}

function pascal(slug: string): string {
  if (!slug) return ''
  return slug.charAt(0).toUpperCase() + slug.slice(1).toLowerCase()
}

function recordComponent(recordType: string) {
  return resolveDynamicComponent('T3RecordFactory' + pascal(recordType)) as any
}

const splideOptions = (ui: any, extLeft: string, extRight: string) => {
  const perPage = perPageForColumns(ui.columns)
  const mode: string = ui.sliderOverflow || 'contained'
  const breakout = mode.startsWith('breakout')
  const breakoutLeft = mode === 'breakout-left'
  const breakoutBoth = mode === 'breakout-both'
  const showOverflow = !!ui.sliderShowOverflow
  // In breakout mode each slide is sized from a CSS variable pinned to the
  // original container width, so the track can extend past the container
  // edge(s) without resizing the slides. `autoWidth` tells Splide to read
  // the slide's CSS width instead of computing it from the track. We
  // explicitly set `drag: true` because Splide defaults autoWidth to
  // free-drag, which feels wrong when slides are uniform cards.
  //
  // `padding` matches the breakout extension so Splide's navigation ends
  // when the last slide snaps into the container's edge (not the viewport
  // edge). Without this, Splide would clamp at the breakout-wrapper's
  // edge, leaving the last slide half-in / half-out of the container.
  //
  // Per-mode overrides:
  //   - breakout-left mirrors breakout-right by setting `direction: 'rtl'`
  //     so the first slide anchors at the container right and subsequent
  //     slides build toward the viewport left.
  //   - breakout-both forces loop + center focus so the active card sits
  //     centered in the viewport-wide track with peek on both sides.
  // Splide's track padding maps to where slides are "officially" positioned.
  // For show-overflow modes we set padding on BOTH sides so slides start at
  // container-left AND navigation end clamps at container-right (even though
  // the wrapper visually extends to both viewport edges).
  const padding = breakoutBoth || (breakout && showOverflow)
    ? { left: extLeft, right: extRight }
    : breakoutLeft
      ? { left: extLeft, right: '0px' }
      : mode === 'breakout-right'
        ? { left: '0px', right: extRight }
        : undefined
  return {
    type: (breakoutBoth || ui.loop) && ui.records.length > perPage ? 'loop' : 'slide',
    perPage: perPage,
    autoWidth: breakout,
    perMove: 1,
    gap: '1.5rem',
    padding,
    arrows: ui.showArrows && ui.records.length > perPage,
    pagination: ui.showPagination && ui.records.length > perPage,
    autoplay: ui.autoplay,
    interval: 6000,
    pauseOnHover: true,
    drag: ui.records.length > 1 ? true : false,
    direction: breakoutLeft ? 'rtl' : 'ltr',
    focus: breakoutBoth ? 'center' : 0,
    speed: 600,
    rewind: !ui.loop && !breakoutBoth,
    breakpoints: breakout
      ? {}
      : {
          1024: { perPage: Math.min(perPage, 2) },
          640: { perPage: 1 }
        }
  }
}
</script>

<template>
  <BaseReferenceList :content="content" v-slot="{ uiProps }">
    <section class="factory-reference-list relative w-full py-16 sm:py-20 lg:py-24">
      <div class="mx-auto max-w-7xl px-6">
        <!-- Header row (same layout grammar as TextSlider) -->
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
              >{{ uiProps.eyebrow }}</span>
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

        <!-- Record grid / slider -->
        <div v-if="uiProps.records.length" class="mt-10 lg:mt-12">
          <div
            v-if="uiProps.layout === 'grid'"
            :class="['grid gap-6', gridClass(uiProps.columns)]"
          >
            <template v-for="record in uiProps.records" :key="record._key">
              <component
                v-if="recordComponent(record._record_type)"
                :is="recordComponent(record._record_type)"
                :record="record"
                variant="card"
              />
            </template>
          </div>

          <div
            v-else
            ref="breakoutRef"
            :class="[
              'relative',
              uiProps.sliderOverflow.startsWith('breakout') ? 'factory-rl-breakout' : '',
              uiProps.sliderOverflow.startsWith('breakout') ? `factory-rl-${uiProps.sliderOverflow}` : '',
              uiProps.sliderOverflow.startsWith('breakout') ? `factory-rl-perpage-${uiProps.columns}` : ''
            ]"
            :style="
              uiProps.sliderOverflow.startsWith('breakout')
                ? {
                    '--rl-breakout-ext-left':
                      uiProps.sliderOverflow === 'breakout-right' && !uiProps.sliderShowOverflow
                        ? '0px'
                        : breakoutExtLeft,
                    '--rl-breakout-ext-right':
                      uiProps.sliderOverflow === 'breakout-left' && !uiProps.sliderShowOverflow
                        ? '0px'
                        : breakoutExtRight
                  }
                : {}
            "
          >
            <Splide
              :ref="handleSplideRef"
              :options="splideOptions(uiProps, breakoutExtLeft, breakoutExtRight)"
              :aria-label="uiProps.title || 'Records'"
            >
              <SplideSlide v-for="record in uiProps.records" :key="record._key">
                <component
                  v-if="recordComponent(record._record_type)"
                  :is="recordComponent(record._record_type)"
                  :record="record"
                  variant="card"
                />
              </SplideSlide>
            </Splide>
          </div>
        </div>

        <p v-else class="mt-10 text-sm italic opacity-60">No records to display.</p>
      </div>
    </section>
  </BaseReferenceList>
</template>

<style scoped>
.factory-section-title :deep(strong) {
  font-weight: 700;
  color: var(--accent-color);
}

/* Slider arrows — 32px white circular pills positioned bottom-right,
   matching Figma node 47:1182. */
.factory-reference-list :deep(.splide__arrows) {
  position: absolute;
  right: 0;
  bottom: -3rem;
  display: flex;
  gap: 0.5rem;
}
.factory-reference-list :deep(.splide__arrow) {
  position: static;
  transform: none;
  width: 2rem;
  height: 2rem;
  background: #fff;
  color: #333;
  opacity: 1;
  box-shadow: 0 1px 6px 0 rgba(0, 0, 0, 0.12);
  border-radius: 9999px;
}
.factory-reference-list :deep(.splide__arrow:hover) {
  background: #f5f5f5;
}
.factory-reference-list :deep(.splide__arrow:disabled) {
  opacity: 0.3;
  cursor: not-allowed;
  pointer-events: none;
}
.factory-reference-list :deep(.splide__arrow svg) {
  fill: currentColor;
  width: 1rem;
  height: 1rem;
}

/* Breakout mode — the slider's track extends past the container's left
   edge, right edge, or both to the viewport edge(s). Slides keep the size
   they would have in the contained layout so extra slides peek in from the
   extended side. `--rl-breakout-ext-left` and `--rl-breakout-ext-right`
   are written from the JS measurement; the unused side is zeroed out
   inline per mode (right-only → left=0, left-only → right=0). */
.factory-rl-breakout {
  --rl-gap: 1.5rem;
  --rl-breakout-ext-left: 0px;
  --rl-breakout-ext-right: 0px;
  width: calc(100% + var(--rl-breakout-ext-left) + var(--rl-breakout-ext-right));
  margin-left: calc(-1 * var(--rl-breakout-ext-left));
  /* No overflow:hidden here — the arrows are absolutely positioned with
     `bottom: -3rem` and would get clipped. Splide's own .splide__track
     overflow:hidden handles slide-clipping within the wrapper bounds. */
}
.factory-rl-perpage-2 { --rl-per-page: 2; }
.factory-rl-perpage-3 { --rl-per-page: 3; }
.factory-rl-perpage-4 { --rl-per-page: 4; }
/* Slide width — 100% of the splide__list's containing block, which is
   the track's content-box. Splide's `padding` option applies CSS padding
   to the track equal to the breakout extension, so the content-box shrinks
   back to the original container's width automatically. Cards stay the
   same size whether in contained, left, right, or both-sides breakout. */
.factory-rl-breakout :deep(.splide__slide) {
  width: calc(
    (100% - (var(--rl-per-page) - 1) * var(--rl-gap)) / var(--rl-per-page)
  );
}
@media (max-width: 1024px) {
  .factory-rl-breakout :deep(.splide__slide) {
    width: calc((100% - var(--rl-gap)) / 2);
  }
}
@media (max-width: 640px) {
  .factory-rl-breakout :deep(.splide__slide) {
    width: calc(100% - 2 * var(--rl-gap));
  }
}

/* Arrows snap back to the original container's right content-edge in
   all breakout modes — offset from the wrapper's right by the right
   extension (which is 0 in left-only breakout). */
.factory-rl-breakout :deep(.splide__arrows) {
  right: var(--rl-breakout-ext-right);
}
</style>
