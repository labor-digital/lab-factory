<script setup lang="ts">
import { ref, computed } from 'vue'
import BaseLogowall from './BaseLogowall.vue'

defineProps<{
  content: any
}>()

const page = ref(0)
function pages(logos: any[], perPage: number): any[][] {
  const out: any[][] = []
  for (let i = 0; i < logos.length; i += perPage) out.push(logos.slice(i, i + perPage))
  return out
}
function go(uiProps: any, delta: number) {
  const total = pages(uiProps.logos, uiProps.perPage).length || 1
  page.value = (page.value + delta + total) % total
}
</script>

<template>
  <BaseLogowall :content="content" v-slot="{ uiProps }">
    <section class="factory-logowall mod" :class="`lw-${uiProps.variant}`">
      <div class="lw-inner mod-inner">
        <header
          v-if="uiProps.variant !== 'compact' && (uiProps.eyebrow || uiProps.headline || uiProps.intro)"
          class="lw-head"
        >
          <span v-if="uiProps.eyebrow" class="eyebrow center">{{ uiProps.eyebrow }}</span>
          <h2 v-if="uiProps.headline" class="h-2">{{ uiProps.headline }}</h2>
          <p v-if="uiProps.intro" class="body-text lw-intro">{{ uiProps.intro }}</p>
        </header>

        <!-- Grid -->
        <div
          v-if="uiProps.variant === 'grid'"
          class="lw-grid"
          :style="{ '--lw-cols': uiProps.columns }"
        >
          <component
            :is="logo.url ? 'a' : 'div'"
            v-for="(logo, i) in uiProps.logos"
            :key="i"
            :href="logo.url"
            :target="logo.url ? '_blank' : undefined"
            :rel="logo.url ? 'noopener noreferrer' : undefined"
            class="lw-cell"
          >
            <NuxtImg
              v-if="logo.image"
              :src="logo.image.src"
              :alt="logo.image.alt || logo.label"
              class="lw-logo-img"
              loading="lazy"
            />
            <div v-else class="ph lw-logo">
              <span class="ph-label">{{ logo.label }}</span>
            </div>
          </component>
        </div>

        <!-- Compact: single row, no header (header skipped above) -->
        <div v-else-if="uiProps.variant === 'compact'" class="lw-compact-row">
          <component
            :is="logo.url ? 'a' : 'div'"
            v-for="(logo, i) in uiProps.logos.slice(0, 6)"
            :key="i"
            :href="logo.url"
            class="lw-cell"
          >
            <NuxtImg v-if="logo.image" :src="logo.image.src" :alt="logo.image.alt || logo.label" class="lw-logo-img" loading="lazy" />
            <div v-else class="ph lw-logo"><span class="ph-label">{{ logo.label }}</span></div>
          </component>
        </div>
      </div>

      <!-- Marquee (outside inner for full-bleed track) -->
      <div v-if="uiProps.variant === 'marquee'" class="lw-marquee-stage" role="region" aria-label="Logos">
        <div class="lw-marquee-track">
          <div v-for="(logo, i) in [...uiProps.logos, ...uiProps.logos]" :key="i" class="lw-marquee-item">
            <NuxtImg v-if="logo.image" :src="logo.image.src" :alt="logo.image.alt || logo.label" class="lw-logo-img" loading="lazy" />
            <div v-else class="ph lw-logo"><span class="ph-label">{{ logo.label }}</span></div>
          </div>
        </div>
      </div>

      <!-- Slider -->
      <div v-if="uiProps.variant === 'slider'" class="lw-inner mod-inner">
        <div class="lw-slider-stage">
          <button class="lw-slider-arrow" @click="go(uiProps, -1)" aria-label="Previous">‹</button>
          <div class="lw-slider-viewport">
            <div class="lw-slider-track" :style="{ transform: `translateX(-${page * 100}%)` }">
              <div v-for="(group, gi) in pages(uiProps.logos, uiProps.perPage)" :key="gi" class="lw-slider-page" :style="{ '--lw-cols': uiProps.perPage }">
                <div v-for="(logo, i) in group" :key="i" class="lw-cell">
                  <NuxtImg v-if="logo.image" :src="logo.image.src" :alt="logo.image.alt || logo.label" class="lw-logo-img" loading="lazy" />
                  <div v-else class="ph lw-logo"><span class="ph-label">{{ logo.label }}</span></div>
                </div>
              </div>
            </div>
          </div>
          <button class="lw-slider-arrow" @click="go(uiProps, 1)" aria-label="Next">›</button>
        </div>
        <div class="lw-slider-dots">
          <button
            v-for="(_, gi) in pages(uiProps.logos, uiProps.perPage)"
            :key="gi"
            class="lw-slider-dot"
            :class="{ active: gi === page }"
            @click="page = gi"
            :aria-label="`Page ${gi + 1}`"
          />
        </div>
      </div>
    </section>
  </BaseLogowall>
</template>

<style scoped>
.factory-logowall { padding: var(--space-section-y) var(--space-section-x); background: var(--color-bg-cream); }
.factory-logowall.lw-marquee { padding-bottom: var(--space-gap-lg); }
.lw-inner { display: flex; flex-direction: column; gap: var(--space-gap-lg); }
.lw-head { display: flex; flex-direction: column; gap: var(--space-gap-xs); text-align: center; align-items: center; }
.lw-intro { max-width: 640px; }

.lw-cell { display: flex; align-items: center; justify-content: center; padding: 24px; background: var(--color-bg); aspect-ratio: 3/2; min-height: 80px; }
.lw-logo-img { max-width: 100%; max-height: 60px; object-fit: contain; filter: grayscale(1); opacity: 0.7; transition: filter var(--t-fast), opacity var(--t-fast); }
.lw-cell:hover .lw-logo-img { filter: grayscale(0); opacity: 1; }

.lw-grid { display: grid; grid-template-columns: repeat(var(--lw-cols, 6), 1fr); gap: 1px; background: var(--color-divider); }
.lw-grid .lw-cell { background: var(--color-bg); }

.lw-compact-row { display: flex; gap: var(--space-gap-md); justify-content: center; align-items: center; flex-wrap: wrap; }
.lw-compact-row .lw-cell { background: transparent; padding: 0; min-height: 60px; aspect-ratio: unset; }

.lw-marquee-stage { overflow: hidden; mask-image: linear-gradient(90deg, transparent 0, #000 8%, #000 92%, transparent 100%); margin-top: var(--space-gap-lg); }
.lw-marquee-track { display: flex; gap: var(--space-gap-lg); animation: lw-scroll 40s linear infinite; width: max-content; }
.lw-marquee-item { flex: 0 0 auto; }
.lw-marquee-item .ph, .lw-marquee-item .lw-logo-img { width: 140px; }
@keyframes lw-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }

.lw-slider-stage { display: flex; gap: 16px; align-items: center; }
.lw-slider-viewport { flex: 1; overflow: hidden; }
.lw-slider-track { display: flex; transition: transform 400ms ease; }
.lw-slider-page { flex: 0 0 100%; display: grid; grid-template-columns: repeat(var(--lw-cols, 6), 1fr); gap: 1px; background: var(--color-divider); }
.lw-slider-page .lw-cell { background: var(--color-bg); }
.lw-slider-arrow { width: 40px; height: 40px; border: 1px solid var(--color-border); display: inline-flex; align-items: center; justify-content: center; background: var(--color-bg); font-size: 20px; cursor: pointer; transition: background var(--t-fast); }
.lw-slider-arrow:hover { background: var(--brand-primary); color: #fff; border-color: var(--brand-primary); }
.lw-slider-dots { display: flex; gap: 8px; justify-content: center; margin-top: var(--space-gap-sm); }
.lw-slider-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--color-border); border: none; cursor: pointer; padding: 0; transition: background var(--t-fast); }
.lw-slider-dot.active { background: var(--brand-primary); }

@media (max-width: 900px) {
  .lw-grid { grid-template-columns: repeat(2, 1fr) !important; }
  .lw-slider-page { grid-template-columns: repeat(2, 1fr) !important; }
}
</style>
