<script setup lang="ts">
import BaseStats from './BaseStats.vue'

defineProps<{
  content: any
}>()
</script>

<template>
  <BaseStats :content="content" v-slot="{ uiProps }">
    <section
      class="factory-stats mod"
      :class="[`stats-${uiProps.variant}`, uiProps.variant === 'bigfour' ? 'is-dark' : '']"
    >
      <div class="stats-inner mod-inner">
        <!-- Header -->
        <header
          v-if="uiProps.eyebrow || uiProps.headline || uiProps.intro"
          class="stats-head"
          :class="[uiProps.variant === 'split' ? 'stats-head-left' : 'stats-head-center']"
        >
          <span v-if="uiProps.eyebrow" class="eyebrow" :class="{ 'on-dark': uiProps.variant === 'bigfour' }">{{ uiProps.eyebrow }}</span>
          <h2 v-if="uiProps.headline" class="h-2 stats-headline" :class="{ 'on-dark': uiProps.variant === 'bigfour' }">{{ uiProps.headline }}</h2>
          <p v-if="uiProps.intro && uiProps.variant !== 'bigfour'" class="body-text stats-intro">{{ uiProps.intro }}</p>
        </header>

        <!-- Variant: split — head on left, grid on right -->
        <div v-if="uiProps.variant === 'split'" class="stats-split-right">
          <div v-for="(it, i) in uiProps.items" :key="i" class="stats-split-item">
            <div class="stats-value">{{ it.value }}</div>
            <div class="stats-label">{{ it.label }}</div>
            <div v-if="it.sub" class="stats-sub">{{ it.sub }}</div>
          </div>
        </div>

        <!-- Variant: inline — flat row with dividers -->
        <div v-else-if="uiProps.variant === 'inline'" class="stats-inline-row">
          <div v-for="(it, i) in uiProps.items" :key="i" class="stats-inline-item">
            <div class="stats-value">{{ it.value }}</div>
            <div class="stats-inline-label">{{ it.label }}</div>
          </div>
        </div>

        <!-- Variant: row / bigfour — grid -->
        <div v-else class="stats-grid" :class="`stats-grid-${uiProps.variant === 'bigfour' ? '2' : '4'}`">
          <div v-for="(it, i) in uiProps.items" :key="i" class="stats-item" :class="`stats-item-${uiProps.variant === 'bigfour' ? 'xl' : 'md'}`">
            <div class="stats-value" :class="{ 'on-dark': uiProps.variant === 'bigfour' }">{{ it.value }}</div>
            <div class="stats-label" :class="{ 'on-dark': uiProps.variant === 'bigfour' }">{{ it.label }}</div>
            <div v-if="it.sub" class="stats-sub" :class="{ 'on-dark': uiProps.variant === 'bigfour' }">{{ it.sub }}</div>
          </div>
        </div>

        <!-- Callout (bigfour) -->
        <blockquote v-if="uiProps.variant === 'bigfour' && uiProps.callout" class="stats-callout">
          <span class="stats-callout-mark">„</span>
          <p>{{ uiProps.callout }}</p>
        </blockquote>
      </div>
    </section>
  </BaseStats>
</template>

<style scoped>
.factory-stats { padding: var(--space-section-y) var(--space-section-x); }
.factory-stats.is-dark { background: var(--color-bg-dark); }

.stats-inner { display: flex; flex-direction: column; gap: var(--space-gap-lg); }

.stats-head { display: flex; flex-direction: column; gap: var(--space-gap-xs); }
.stats-head-center { align-items: center; text-align: center; }
.stats-head-left { align-items: flex-start; text-align: left; }
.stats-intro { max-width: 640px; }
.stats-head-center .stats-intro { margin: 0 auto; }

.stats-grid { display: grid; gap: var(--space-gap-lg); }
.stats-grid-4 { grid-template-columns: repeat(4, 1fr); }
.stats-grid-2 { grid-template-columns: repeat(2, 1fr); }
.stats-item { display: flex; flex-direction: column; gap: 8px; }

.stats-value { font-size: var(--fs-display); font-weight: 300; line-height: 1; color: var(--brand-primary); letter-spacing: -0.01em; }
.stats-item-xl .stats-value { font-size: 96px; }
.stats-value.on-dark { color: #fff; }
.stats-label { font-size: var(--fs-body-s); color: var(--color-text-strong); font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; }
.stats-label.on-dark { color: #fff; }
.stats-sub { font-size: var(--fs-small); color: var(--color-text-soft); }
.stats-sub.on-dark { color: rgba(255,255,255,0.7); }

/* split */
.stats-split { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-gap-xl); align-items: start; }
.factory-stats.stats-split .stats-inner { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-gap-xl); align-items: start; }
.stats-split-right { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-gap-lg); }
.stats-split-item { display: flex; flex-direction: column; gap: 8px; }

/* inline */
.stats-inline-row { display: flex; gap: 0; align-items: stretch; justify-content: space-between; }
.stats-inline-item { padding: 0 var(--space-gap-md); border-left: 1px solid var(--color-divider); flex: 1; display: flex; flex-direction: column; gap: 4px; }
.stats-inline-item:first-child { border-left: none; padding-left: 0; }
.stats-inline-label { font-size: var(--fs-body-s); color: var(--color-text-mid); }

/* bigfour callout */
.stats-callout { margin: 0; padding: var(--space-gap-lg) 0 0; position: relative; color: rgba(255,255,255,0.85); font-size: var(--fs-h3); font-weight: 300; max-width: 720px; }
.stats-callout-mark { display: inline-block; font-size: 64px; line-height: 0.6; color: var(--brand-primary); margin-right: 6px; vertical-align: -10px; }

@media (max-width: 900px) {
  .stats-grid-4 { grid-template-columns: repeat(2, 1fr); }
  .factory-stats.stats-split .stats-inner { grid-template-columns: 1fr; }
  .stats-split-right { grid-template-columns: 1fr 1fr; }
  .stats-inline-row { flex-direction: column; }
  .stats-inline-item { border-left: none; border-top: 1px solid var(--color-divider); padding: var(--space-gap-sm) 0; }
  .stats-inline-item:first-child { border-top: none; }
  .stats-item-xl .stats-value { font-size: 64px; }
}
</style>
