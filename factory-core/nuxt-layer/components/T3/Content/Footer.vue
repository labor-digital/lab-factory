<script setup lang="ts">
import BaseFooter from './BaseFooter.vue'
import Button from './Button.vue'

defineProps<{
  content: any
}>()
</script>

<template>
  <BaseFooter :content="content" v-slot="{ uiProps }">
    <footer
      class="factory-footer mod"
      :class="[`ft-${uiProps.variant}`, uiProps.variant === 'split' || uiProps.variant === 'maximal' ? 'is-dark' : '']"
    >
      <div class="ft-inner mod-inner">
        <!-- COLUMNS -->
        <template v-if="uiProps.variant === 'columns'">
          <div class="ft-top ft-grid-4">
            <div class="ft-brand">
              <div class="ft-logo">
                <NuxtImg v-if="uiProps.logoImage" :src="uiProps.logoImage.src" :alt="uiProps.logoImage.alt || uiProps.logoText" class="ft-logo-img" />
                <template v-else><span class="ft-logo-mark" /><span class="ft-logo-text">{{ uiProps.logoText || 'Logo' }}</span></template>
              </div>
              <p v-if="uiProps.tagline" class="ft-tagline">{{ uiProps.tagline }}</p>
              <div v-if="uiProps.socials.length" class="ft-socials">
                <a v-for="(s, i) in uiProps.socials" :key="i" :href="s.to" class="ft-social" :aria-label="s.label">{{ s.label }}</a>
              </div>
            </div>
            <div v-for="(c, i) in uiProps.cols" :key="i" class="ft-col">
              <div class="ft-col-title">{{ c.title }}</div>
              <ul class="ft-list">
                <li v-for="(l, j) in c.links" :key="j"><a :href="l.to">{{ l.label }}</a></li>
              </ul>
            </div>
          </div>
        </template>

        <!-- COMPACT -->
        <template v-else-if="uiProps.variant === 'compact'">
          <div class="ft-compact-row">
            <div class="ft-logo">
              <span class="ft-logo-mark" />
              <span class="ft-logo-text">{{ uiProps.logoText || 'Logo' }}</span>
            </div>
            <nav v-if="uiProps.cols[0]?.links" class="ft-compact-nav">
              <a v-for="(l, i) in uiProps.cols[0].links.slice(0, 4)" :key="i" :href="l.to">{{ l.label }}</a>
            </nav>
            <div v-if="uiProps.socials.length" class="ft-socials">
              <a v-for="(s, i) in uiProps.socials" :key="i" :href="s.to" class="ft-social">{{ s.label }}</a>
            </div>
          </div>
        </template>

        <!-- SPLIT -->
        <template v-else-if="uiProps.variant === 'split'">
          <div class="ft-split-grid">
            <div class="ft-split-left">
              <div class="ft-logo ft-logo-inv">
                <span class="ft-logo-mark" />
                <span class="ft-logo-text">{{ uiProps.logoText || 'Logo' }}</span>
              </div>
              <h3 v-if="uiProps.claim" class="ft-split-claim">{{ uiProps.claim }}</h3>
              <div class="ft-split-ctas">
                <Button v-if="uiProps.ctaPrimary" :label="uiProps.ctaPrimary" variant="white-solid" />
                <Button v-if="uiProps.ctaSecondary" :label="uiProps.ctaSecondary" variant="outline-white" />
              </div>
              <div v-if="uiProps.address.length" class="ft-address">
                <div v-for="(a, i) in uiProps.address" :key="i">{{ a }}</div>
              </div>
            </div>
            <div class="ft-split-right">
              <div v-for="(c, i) in uiProps.cols" :key="i" class="ft-col">
                <div class="ft-col-title">{{ c.title }}</div>
                <ul class="ft-list">
                  <li v-for="(l, j) in c.links" :key="j"><a :href="l.to">{{ l.label }}</a></li>
                </ul>
              </div>
            </div>
          </div>
        </template>

        <!-- MAXIMAL -->
        <template v-else-if="uiProps.variant === 'maximal'">
          <div class="ft-max-top">
            <span class="eyebrow no-bar on-dark">Kontakt</span>
            <h2 v-if="uiProps.claim" class="ft-max-claim">{{ uiProps.claim }}</h2>
            <div class="ft-max-contacts">
              <a v-for="(c, i) in uiProps.contacts" :key="i" :href="c.to" class="ft-max-contact">{{ c.label }}</a>
            </div>
          </div>
          <div class="ft-max-grid">
            <div v-if="uiProps.address.length" class="ft-col">
              <div class="ft-col-title">Adresse</div>
              <div class="ft-address">
                <div v-for="(a, i) in uiProps.address" :key="i">{{ a }}</div>
              </div>
            </div>
            <div v-for="(c, i) in uiProps.cols" :key="i" class="ft-col">
              <div class="ft-col-title">{{ c.title }}</div>
              <ul class="ft-list">
                <li v-for="(l, j) in c.links.slice(0, 4)" :key="j"><a :href="l.to">{{ l.label }}</a></li>
              </ul>
            </div>
          </div>
          <div class="ft-max-wordmark">
            <span class="ft-wordmark">{{ (uiProps.logoText || 'LOGO').toUpperCase() }}</span>
          </div>
        </template>

        <!-- Bottom bar (all variants) -->
        <div class="ft-bottom">
          <span class="ft-copy">{{ uiProps.copyright || `© ${new Date().getFullYear()} ${uiProps.logoText || 'Brand'}. Alle Rechte vorbehalten.` }}</span>
          <div class="ft-bottom-right">
            <div v-if="(uiProps.variant === 'split' || uiProps.variant === 'maximal') && uiProps.socials.length" class="ft-socials">
              <a v-for="(s, i) in uiProps.socials" :key="i" :href="s.to" class="ft-social">{{ s.label }}</a>
            </div>
            <ul v-if="uiProps.legal.length" class="ft-legal">
              <li v-for="(l, i) in uiProps.legal" :key="i"><a :href="l.to">{{ l.label }}</a></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  </BaseFooter>
</template>

<style scoped>
.factory-footer { padding: var(--space-section-y) var(--space-section-x); background: var(--color-bg-cream); }
.factory-footer.is-dark { background: var(--color-bg-dark); color: rgba(255,255,255,0.8); }
.factory-footer.is-dark .ft-col-title { color: #fff; }
.factory-footer.is-dark .ft-list a, .factory-footer.is-dark .ft-bottom a, .factory-footer.is-dark .ft-address { color: rgba(255,255,255,0.65); }
.factory-footer.is-dark .ft-list a:hover, .factory-footer.is-dark .ft-bottom a:hover { color: #fff; }

.ft-inner { display: flex; flex-direction: column; gap: var(--space-gap-lg); }

.ft-grid-4 { display: grid; grid-template-columns: 1.4fr repeat(3, 1fr); gap: var(--space-gap-lg); }
.ft-brand { display: flex; flex-direction: column; gap: var(--space-gap-sm); }
.ft-logo { display: inline-flex; align-items: center; gap: 10px; }
.ft-logo-mark { width: 28px; height: 28px; background: var(--brand-primary); }
.ft-logo-inv .ft-logo-mark { background: #fff; }
.ft-logo-text { font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; font-size: var(--fs-body-s); }
.ft-logo-img { max-height: 32px; }
.ft-tagline { font-size: var(--fs-body-s); color: var(--color-text-mid); margin: 0; max-width: 280px; }
.factory-footer.is-dark .ft-tagline { color: rgba(255,255,255,0.65); }

.ft-col { display: flex; flex-direction: column; gap: 12px; }
.ft-col-title { font-size: var(--fs-tag); font-weight: 700; letter-spacing: var(--ls-tag); text-transform: uppercase; color: var(--color-text-strong); }
.ft-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.ft-list a { font-size: var(--fs-body-s); color: var(--color-text-mid); text-decoration: none; transition: color var(--t-fast); }
.ft-list a:hover { color: var(--brand-primary); }

.ft-socials { display: inline-flex; gap: 8px; }
.ft-social { display: inline-flex; width: 32px; height: 32px; align-items: center; justify-content: center; border: 1px solid var(--color-border); font-size: var(--fs-tag); font-weight: 700; color: var(--color-text-strong); text-decoration: none; transition: background var(--t-fast), color var(--t-fast); }
.ft-social:hover { background: var(--brand-primary); color: #fff; border-color: var(--brand-primary); }
.factory-footer.is-dark .ft-social { border-color: rgba(255,255,255,0.2); color: rgba(255,255,255,0.85); }

.ft-compact-row { display: flex; gap: var(--space-gap-md); align-items: center; justify-content: space-between; }
.ft-compact-nav { display: flex; gap: var(--space-gap-md); }
.ft-compact-nav a { font-size: var(--fs-body-s); color: var(--color-text-mid); text-decoration: none; }

.ft-split-grid { display: grid; grid-template-columns: 1fr 1.5fr; gap: var(--space-gap-xl); }
.ft-split-left { display: flex; flex-direction: column; gap: var(--space-gap-md); }
.ft-split-claim { font-size: var(--fs-h2); font-weight: 300; color: #fff; margin: 0; }
.ft-split-ctas { display: flex; gap: 12px; }
.ft-split-right { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-gap-md); }
.ft-address { font-size: var(--fs-body-s); line-height: 1.6; }

.ft-max-top { display: flex; flex-direction: column; gap: var(--space-gap-sm); }
.ft-max-claim { font-size: var(--fs-display); font-weight: 300; color: #fff; margin: 0; line-height: 1.1; }
.ft-max-contacts { display: flex; gap: var(--space-gap-md); margin-top: var(--space-gap-sm); flex-wrap: wrap; }
.ft-max-contact { font-size: var(--fs-h3); color: #fff; text-decoration: none; }
.ft-max-contact:hover { color: var(--brand-primary); }
.ft-max-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-gap-md); padding: var(--space-gap-xl) 0; border-top: 1px solid rgba(255,255,255,0.1); border-bottom: 1px solid rgba(255,255,255,0.1); }
.ft-max-wordmark { padding: var(--space-gap-lg) 0; display: flex; justify-content: center; }
.ft-wordmark { font-size: clamp(72px, 12vw, 200px); font-weight: 700; letter-spacing: -0.02em; color: rgba(255,255,255,0.1); line-height: 1; }

.ft-bottom { display: flex; justify-content: space-between; align-items: center; padding-top: var(--space-gap-md); border-top: 1px solid var(--color-divider); flex-wrap: wrap; gap: 12px; }
.factory-footer.is-dark .ft-bottom { border-top-color: rgba(255,255,255,0.1); }
.ft-copy { font-size: var(--fs-small); color: var(--color-text-soft); }
.ft-bottom-right { display: flex; gap: var(--space-gap-md); align-items: center; }
.ft-legal { list-style: none; margin: 0; padding: 0; display: flex; gap: var(--space-gap-sm); }
.ft-legal a { font-size: var(--fs-small); color: var(--color-text-soft); text-decoration: none; }
.ft-legal a:hover { color: var(--brand-primary); }

@media (max-width: 900px) {
  .ft-grid-4, .ft-split-grid, .ft-max-grid { grid-template-columns: 1fr; }
  .ft-split-right { grid-template-columns: 1fr 1fr; }
  .ft-compact-row { flex-direction: column; align-items: flex-start; gap: var(--space-gap-sm); }
}
</style>
