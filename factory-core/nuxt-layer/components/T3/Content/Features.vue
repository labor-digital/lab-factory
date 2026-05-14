<script setup lang="ts">
import { Icon } from '@iconify/vue'
import BaseFeatures from './BaseFeatures.vue'

defineProps<{
  content: any
}>()

function iconName(raw: string): string {
  if (!raw) return raw
  if (raw.startsWith('i-')) {
    const rest = raw.slice(2)
    const dash = rest.indexOf('-')
    if (dash === -1) return rest
    return `${rest.slice(0, dash)}:${rest.slice(dash + 1)}`
  }
  return raw
}
</script>

<template>
  <BaseFeatures :content="content" v-slot="{ uiProps }">
    <section class="factory-features mod" :class="`fg-${uiProps.variant}`">
      <div class="fg-inner mod-inner">
        <header
          v-if="uiProps.eyebrow || uiProps.headline || uiProps.intro"
          class="fg-head"
          :class="uiProps.variant === 'flat' ? 'fg-head-center' : 'fg-head-left'"
        >
          <span v-if="uiProps.eyebrow" class="eyebrow">{{ uiProps.eyebrow }}</span>
          <h2 v-if="uiProps.headline" class="h-2 fg-headline">{{ uiProps.headline }}</h2>
          <p v-if="uiProps.intro" class="body-text fg-intro">{{ uiProps.intro }}</p>
        </header>

        <div class="fg-grid">
          <article
            v-for="(it, i) in uiProps.items"
            :key="i"
            class="fg-item"
            :class="`fg-item-${uiProps.variant}`"
          >
            <!-- numbered: big number -->
            <div v-if="uiProps.variant === 'numbered'" class="fg-num">{{ it.num }}</div>

            <!-- media: image -->
            <div v-else-if="uiProps.variant === 'media'" class="fg-media-img">
              <NuxtImg v-if="it.image" :src="it.image.src" :alt="it.image.alt || it.title" />
              <div v-else class="ph"><span class="ph-label">Bild {{ i + 1 }}</span></div>
            </div>

            <!-- cards / flat: icon -->
            <div v-else class="fg-icon">
              <Icon v-if="it.icon" :icon="iconName(it.icon)" />
              <div v-else class="ph fg-icon-ph"><span class="ph-label">Icon</span></div>
            </div>

            <div class="fg-body">
              <span v-if="uiProps.variant === 'media' && it.num" class="fg-num-small">{{ it.num }}</span>
              <h3 class="fg-card-title">{{ it.title }}</h3>
              <p v-if="it.text" class="fg-card-text">{{ it.text }}</p>
              <a
                v-if="it.linkLabel && (uiProps.variant === 'cards' || uiProps.variant === 'media')"
                :href="it.linkTo || '#'"
                class="fg-link"
              >{{ it.linkLabel }} →</a>
            </div>
          </article>
        </div>
      </div>
    </section>
  </BaseFeatures>
</template>

<style scoped>
.factory-features { padding: var(--space-section-y) var(--space-section-x); }
.fg-inner { display: flex; flex-direction: column; gap: var(--space-gap-lg); }
.fg-head { display: flex; flex-direction: column; gap: var(--space-gap-xs); max-width: 720px; }
.fg-head-center { align-items: center; text-align: center; margin: 0 auto; }
.fg-headline { font-size: var(--fs-h2); font-weight: 300; }
.fg-intro { color: var(--color-text-mid); }

.fg-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-gap-md); }
.fg-item { display: flex; flex-direction: column; gap: var(--space-gap-xs); }

/* cards */
.fg-item-cards { border: 1px solid var(--color-border); padding: var(--space-gap-md); background: var(--color-bg); transition: border-color var(--t-fast), transform var(--t-fast); }
.fg-item-cards:hover { border-color: var(--brand-primary); }
.fg-icon { width: 56px; height: 56px; display: inline-flex; align-items: center; justify-content: center; background: var(--brand-primary-soft); color: var(--brand-primary); font-size: 28px; }
.fg-icon-ph { width: 56px; height: 56px; }

/* flat */
.fg-item-flat { padding-top: var(--space-gap-sm); border-top: 1px solid var(--color-border); }
.fg-item-flat .fg-icon { background: transparent; }

/* numbered */
.fg-item-numbered { padding-top: var(--space-gap-sm); border-top: 1px solid var(--color-divider); }
.fg-num { font-size: 64px; font-weight: 300; line-height: 1; color: var(--brand-primary); letter-spacing: -0.02em; }
.fg-num-small { font-size: var(--fs-tag); font-weight: 700; letter-spacing: var(--ls-tag); color: var(--brand-primary); text-transform: uppercase; }

/* media */
.fg-item-media .fg-media-img { aspect-ratio: 4/3; overflow: hidden; background: var(--color-divider); }
.fg-item-media .fg-media-img img, .fg-item-media .fg-media-img .ph { width: 100%; height: 100%; object-fit: cover; }

.fg-body { display: flex; flex-direction: column; gap: 8px; }
.fg-card-title { font-size: var(--fs-h3); font-weight: 400; margin: 0; color: var(--color-text-strong); }
.fg-card-text { font-size: var(--fs-body); line-height: 1.6; color: var(--color-text-mid); margin: 0; }
.fg-link { display: inline-block; margin-top: 8px; font-size: var(--fs-button); font-weight: 700; letter-spacing: var(--ls-button); text-transform: uppercase; color: var(--brand-primary); text-decoration: none; transition: gap var(--t-fast); }
.fg-link:hover { text-decoration: underline; }

@media (max-width: 900px) { .fg-grid { grid-template-columns: 1fr; } }
@media (min-width: 901px) and (max-width: 1200px) { .fg-grid { grid-template-columns: repeat(2, 1fr); } }
</style>
