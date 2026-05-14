<script setup lang="ts">
import { ref } from 'vue'
import BaseTestimonials from './BaseTestimonials.vue'

defineProps<{
  content: any
}>()

const idx = ref(0)
function go(uiProps: any, delta: number) {
  const total = uiProps.items.length || 1
  idx.value = (idx.value + delta + total) % total
}
</script>

<template>
  <BaseTestimonials :content="content" v-slot="{ uiProps }">
    <section class="factory-testimonials mod" :class="[`tm-${uiProps.variant}`, uiProps.variant === 'featured' ? 'is-dark' : '']">
      <!-- QUOTE-XL: centered XL serif -->
      <div v-if="uiProps.variant === 'quote-xl' && uiProps.items.length" class="tm-inner mod-inner tm-xl-inner">
        <div class="tm-mark">„</div>
        <blockquote class="tm-xl-quote">{{ uiProps.items[0].quote }}</blockquote>
        <div class="tm-author">
          <div class="tm-avatar">
            <NuxtImg v-if="uiProps.items[0].avatar" :src="uiProps.items[0].avatar.src" :alt="uiProps.items[0].name" />
            <div v-else class="ph"><span class="ph-label">Foto</span></div>
          </div>
          <div>
            <div class="tm-name">{{ uiProps.items[0].name }}</div>
            <div class="tm-role">{{ uiProps.items[0].role }}<span v-if="uiProps.items[0].company"> · {{ uiProps.items[0].company }}</span></div>
          </div>
        </div>
      </div>

      <!-- QUOTE-FLOW: long block of body text -->
      <div v-else-if="uiProps.variant === 'quote-flow' && uiProps.items.length" class="tm-inner mod-inner tm-flow-inner">
        <div class="tm-mark">„</div>
        <blockquote class="tm-flow-quote">{{ uiProps.longQuote || uiProps.items[0].quote }}</blockquote>
        <div class="tm-author">
          <div class="tm-avatar">
            <NuxtImg v-if="uiProps.items[0].avatar" :src="uiProps.items[0].avatar.src" :alt="uiProps.items[0].name" />
            <div v-else class="ph"><span class="ph-label">Foto</span></div>
          </div>
          <div>
            <div class="tm-name">{{ uiProps.items[0].name }}</div>
            <div class="tm-role">{{ uiProps.items[0].role }}<span v-if="uiProps.items[0].company"> · {{ uiProps.items[0].company }}</span></div>
          </div>
        </div>
      </div>

      <!-- CARDS: 3-col -->
      <div v-else-if="uiProps.variant === 'cards'" class="tm-inner mod-inner">
        <header v-if="uiProps.eyebrow || uiProps.headline || uiProps.intro" class="tm-head tm-head-center">
          <span v-if="uiProps.eyebrow" class="eyebrow center">{{ uiProps.eyebrow }}</span>
          <h2 v-if="uiProps.headline" class="h-2">{{ uiProps.headline }}</h2>
          <p v-if="uiProps.intro" class="body-text">{{ uiProps.intro }}</p>
        </header>
        <div class="tm-cards-grid">
          <article v-for="(t, i) in uiProps.items.slice(0, 3)" :key="i" class="tm-card">
            <div class="tm-stars">★ ★ ★ ★ ★</div>
            <p class="tm-card-quote">„{{ t.quote }}"</p>
            <div class="tm-author">
              <div class="tm-avatar tm-avatar-sm">
                <NuxtImg v-if="t.avatar" :src="t.avatar.src" :alt="t.name" />
                <div v-else class="ph"><span class="ph-label">{{ t.name.slice(0, 2) }}</span></div>
              </div>
              <div>
                <div class="tm-name">{{ t.name }}</div>
                <div class="tm-role">{{ t.role }}<span v-if="t.company">, {{ t.company }}</span></div>
              </div>
            </div>
          </article>
        </div>
      </div>

      <!-- SLIDER: image + quote -->
      <div v-else-if="uiProps.variant === 'slider'" class="tm-inner mod-inner">
        <header v-if="uiProps.eyebrow || uiProps.headline" class="tm-head tm-head-left">
          <span v-if="uiProps.eyebrow" class="eyebrow">{{ uiProps.eyebrow }}</span>
          <h2 v-if="uiProps.headline" class="h-2">{{ uiProps.headline }}</h2>
        </header>
        <div class="tm-slider-stage">
          <div class="tm-slider-media">
            <NuxtImg v-if="uiProps.items[idx]?.media" :src="uiProps.items[idx].media.src" :alt="uiProps.items[idx].name" />
            <div v-else class="ph"><span class="ph-label">Porträt {{ idx + 1 }}</span></div>
          </div>
          <div class="tm-slider-body">
            <div class="tm-mark">„</div>
            <blockquote class="tm-slider-quote">{{ uiProps.items[idx]?.quote }}</blockquote>
            <div class="tm-author tm-author-stacked">
              <div class="tm-name">{{ uiProps.items[idx]?.name }}</div>
              <div class="tm-role">{{ uiProps.items[idx]?.role }}<span v-if="uiProps.items[idx]?.company"> · {{ uiProps.items[idx].company }}</span></div>
            </div>
            <div class="tm-slider-controls">
              <div class="dots on-light">
                <button v-for="(_, i) in uiProps.items" :key="i" class="dot" :class="{ active: i === idx }" @click="idx = i" :aria-label="`Slide ${i + 1}`" />
              </div>
              <div class="arrows">
                <button class="arrow-btn" @click="go(uiProps, -1)" aria-label="Previous">‹</button>
                <button class="arrow-btn" @click="go(uiProps, 1)" aria-label="Next">›</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- FEATURED: image left, dark right -->
      <div v-else-if="uiProps.variant === 'featured' && uiProps.items.length" class="tm-feat-grid">
        <div class="tm-feat-media">
          <NuxtImg v-if="uiProps.items[0].media" :src="uiProps.items[0].media.src" :alt="uiProps.items[0].name" />
          <div v-else class="ph ph-dark"><span class="ph-label">Kunden-Porträt</span></div>
        </div>
        <div class="tm-feat-body">
          <span class="eyebrow on-dark">{{ uiProps.eyebrow || 'Kundenstimme' }}</span>
          <div class="tm-mark tm-feat-mark">„</div>
          <blockquote class="tm-feat-quote">{{ uiProps.items[0].quote }}</blockquote>
          <div class="tm-author tm-author-stacked">
            <div class="tm-name on-dark">{{ uiProps.items[0].name }}</div>
            <div class="tm-role on-dark">{{ uiProps.items[0].role }}<span v-if="uiProps.items[0].company">, {{ uiProps.items[0].company }}</span></div>
          </div>
        </div>
      </div>
    </section>
  </BaseTestimonials>
</template>

<style scoped>
.factory-testimonials { padding: var(--space-section-y) var(--space-section-x); }
.factory-testimonials.is-dark { background: var(--color-bg-dark); padding: 0; }
.tm-inner { display: flex; flex-direction: column; gap: var(--space-gap-lg); }

.tm-head { display: flex; flex-direction: column; gap: var(--space-gap-xs); max-width: 720px; }
.tm-head-center { align-items: center; text-align: center; margin: 0 auto; }

.tm-mark { font-family: var(--font-serif, Georgia, serif); font-size: 96px; line-height: 0.7; color: var(--brand-primary); height: 56px; }
.tm-xl-inner { align-items: center; text-align: center; }
.tm-xl-quote { font-family: var(--font-serif, Georgia, serif); font-size: clamp(28px, 4vw, 44px); line-height: 1.3; max-width: 880px; margin: 0; color: var(--color-text-strong); font-weight: 300; }
.tm-flow-quote { font-size: var(--fs-body-l); line-height: 1.8; max-width: 720px; color: var(--color-text-mid); margin: 0; }
.tm-flow-inner { align-items: center; text-align: left; }

.tm-author { display: flex; gap: 16px; align-items: center; }
.tm-author-stacked { flex-direction: column; align-items: flex-start; gap: 4px; }
.tm-avatar { width: 56px; height: 56px; border-radius: 50%; overflow: hidden; flex: 0 0 auto; }
.tm-avatar-sm { width: 44px; height: 44px; }
.tm-avatar img, .tm-avatar .ph { width: 100%; height: 100%; object-fit: cover; }
.tm-name { font-weight: 700; color: var(--color-text-strong); }
.tm-name.on-dark { color: #fff; }
.tm-role { font-size: var(--fs-body-s); color: var(--color-text-mid); }
.tm-role.on-dark { color: rgba(255,255,255,0.65); }

.tm-cards-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-gap-md); }
.tm-card { padding: var(--space-gap-md); background: var(--color-bg); border: 1px solid var(--color-divider); display: flex; flex-direction: column; gap: var(--space-gap-sm); }
.tm-stars { color: var(--brand-primary); letter-spacing: 4px; }
.tm-card-quote { font-size: var(--fs-body); line-height: 1.7; color: var(--color-text-mid); margin: 0; }

.tm-slider-stage { display: grid; grid-template-columns: 1fr 1.2fr; gap: var(--space-gap-lg); align-items: stretch; }
.tm-slider-media { aspect-ratio: 4/5; background: var(--color-divider); overflow: hidden; }
.tm-slider-media img, .tm-slider-media .ph { width: 100%; height: 100%; object-fit: cover; }
.tm-slider-body { display: flex; flex-direction: column; gap: var(--space-gap-sm); padding: var(--space-gap-md) 0; justify-content: center; }
.tm-slider-quote { font-family: var(--font-serif, Georgia, serif); font-size: var(--fs-h2); line-height: 1.4; font-weight: 300; margin: 0; }
.tm-slider-controls { display: flex; justify-content: space-between; align-items: center; margin-top: var(--space-gap-md); }

.tm-feat-grid { display: grid; grid-template-columns: 1fr 1fr; min-height: 600px; }
.tm-feat-media { background: var(--color-divider); overflow: hidden; }
.tm-feat-media img, .tm-feat-media .ph { width: 100%; height: 100%; object-fit: cover; }
.tm-feat-body { padding: var(--space-section-y) var(--space-gap-xl); display: flex; flex-direction: column; gap: var(--space-gap-sm); justify-content: center; }
.tm-feat-quote { font-family: var(--font-serif, Georgia, serif); font-size: clamp(28px, 3vw, 38px); line-height: 1.3; font-weight: 300; margin: 0; color: #fff; }
.tm-feat-mark { color: var(--brand-primary); margin-bottom: -8px; }

@media (max-width: 900px) {
  .tm-cards-grid { grid-template-columns: 1fr; }
  .tm-slider-stage, .tm-feat-grid { grid-template-columns: 1fr; }
  .tm-feat-body { padding: var(--space-section-y) var(--space-section-x); }
}
</style>
