<script setup lang="ts">
import { ref, computed } from 'vue'
import BaseFaq from './BaseFaq.vue'
import Button from './Button.vue'

defineProps<{
  content: any
}>()

const openKey = ref<string | null>('0')
function toggle(key: string) {
  openKey.value = openKey.value === key ? null : key
}

function groupedItems(items: any[]) {
  const groups: { title: string; items: { item: any; idx: number }[] }[] = []
  const map = new Map<string, number>()
  items.forEach((item, idx) => {
    const title = item.group || 'Allgemein'
    if (!map.has(title)) {
      map.set(title, groups.length)
      groups.push({ title, items: [] })
    }
    groups[map.get(title)!].items.push({ item, idx })
  })
  return groups
}
</script>

<template>
  <BaseFaq :content="content" v-slot="{ uiProps }">
    <section class="factory-faq mod" :class="`faq-${uiProps.variant}`">
      <div class="faq-inner mod-inner">
        <!-- Single col -->
        <template v-if="uiProps.variant === 'single' || uiProps.variant === 'bordered'">
          <header v-if="uiProps.eyebrow || uiProps.headline || uiProps.intro" class="faq-head" :class="uiProps.variant === 'single' ? 'faq-head-center' : 'faq-head-left'">
            <span v-if="uiProps.eyebrow" class="eyebrow">{{ uiProps.eyebrow }}</span>
            <h2 v-if="uiProps.headline" class="h-2 faq-headline">{{ uiProps.headline }}</h2>
            <p v-if="uiProps.intro" class="body-text faq-intro">{{ uiProps.intro }}</p>
          </header>
          <div class="faq-body">
            <div v-for="(it, i) in uiProps.items" :key="i" class="acc-item" :class="[{ open: openKey === String(i) }, `acc-${uiProps.variant}`]">
              <button class="acc-trigger" @click="toggle(String(i))" :aria-expanded="openKey === String(i)">
                <span class="acc-q">{{ it.q }}</span>
                <span class="acc-icon" aria-hidden="true">{{ openKey === String(i) ? '−' : '+' }}</span>
              </button>
              <div class="acc-body-wrap" :style="{ maxHeight: openKey === String(i) ? '600px' : '0' }">
                <div class="acc-body"><p>{{ it.a }}</p></div>
              </div>
            </div>
          </div>
        </template>

        <!-- Two col -->
        <template v-else-if="uiProps.variant === 'two-col'">
          <div class="faq-twocol-grid">
            <div class="faq-twocol-left">
              <header class="faq-head faq-head-left">
                <span v-if="uiProps.eyebrow" class="eyebrow">{{ uiProps.eyebrow }}</span>
                <h2 v-if="uiProps.headline" class="h-2 faq-headline">{{ uiProps.headline }}</h2>
                <p v-if="uiProps.intro" class="body-text faq-intro">{{ uiProps.intro }}</p>
              </header>
              <div v-if="uiProps.contactLabel || uiProps.contactMail" class="faq-contact-card">
                <div v-if="uiProps.contactLabel" class="faq-contact-label">{{ uiProps.contactLabel }}</div>
                <div v-if="uiProps.contactMail" class="faq-contact-mail">{{ uiProps.contactMail }}</div>
                <Button v-if="uiProps.contactButton" :label="uiProps.contactButton" variant="outline" :to="uiProps.contactMail ? `mailto:${uiProps.contactMail}` : '#'" />
              </div>
            </div>
            <div class="faq-twocol-right">
              <div v-for="(it, i) in uiProps.items" :key="i" class="acc-item" :class="[{ open: openKey === String(i) }, 'acc-two-col']">
                <button class="acc-trigger" @click="toggle(String(i))" :aria-expanded="openKey === String(i)">
                  <span class="acc-q">{{ it.q }}</span>
                  <span class="acc-icon" aria-hidden="true">{{ openKey === String(i) ? '−' : '+' }}</span>
                </button>
                <div class="acc-body-wrap" :style="{ maxHeight: openKey === String(i) ? '600px' : '0' }">
                  <div class="acc-body"><p>{{ it.a }}</p></div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Grouped -->
        <template v-else-if="uiProps.variant === 'grouped'">
          <header v-if="uiProps.eyebrow || uiProps.headline || uiProps.intro" class="faq-head faq-head-left">
            <span v-if="uiProps.eyebrow" class="eyebrow">{{ uiProps.eyebrow }}</span>
            <h2 v-if="uiProps.headline" class="h-2 faq-headline">{{ uiProps.headline }}</h2>
            <p v-if="uiProps.intro" class="body-text faq-intro">{{ uiProps.intro }}</p>
          </header>
          <div class="faq-grouped-list">
            <div v-for="(g, gi) in groupedItems(uiProps.items)" :key="gi" class="faq-group">
              <div class="faq-group-title">
                <span class="faq-group-num">{{ String(gi + 1).padStart(2, '0') }}</span>
                <span>{{ g.title }}</span>
              </div>
              <div v-for="(entry) in g.items" :key="entry.idx" class="acc-item" :class="[{ open: openKey === `${gi}-${entry.idx}` }, 'acc-grouped']">
                <button class="acc-trigger" @click="toggle(`${gi}-${entry.idx}`)" :aria-expanded="openKey === `${gi}-${entry.idx}`">
                  <span class="acc-q">{{ entry.item.q }}</span>
                  <span class="acc-icon" aria-hidden="true">{{ openKey === `${gi}-${entry.idx}` ? '−' : '+' }}</span>
                </button>
                <div class="acc-body-wrap" :style="{ maxHeight: openKey === `${gi}-${entry.idx}` ? '600px' : '0' }">
                  <div class="acc-body"><p>{{ entry.item.a }}</p></div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </section>
  </BaseFaq>
</template>

<style scoped>
.factory-faq { padding: var(--space-section-y) var(--space-section-x); }
.faq-inner { display: flex; flex-direction: column; gap: var(--space-gap-lg); }

.faq-head { display: flex; flex-direction: column; gap: var(--space-gap-xs); max-width: 720px; }
.faq-head-center { align-items: center; text-align: center; margin: 0 auto; }
.faq-headline { font-size: var(--fs-h2); font-weight: 300; }
.faq-intro { color: var(--color-text-mid); }

.faq-body { display: flex; flex-direction: column; }

.acc-item { border-bottom: 1px solid var(--color-divider); }
.acc-trigger { display: flex; width: 100%; padding: 20px 0; align-items: center; justify-content: space-between; cursor: pointer; background: none; border: none; font: inherit; text-align: left; color: var(--color-text-strong); transition: color var(--t-fast); }
.acc-trigger:hover { color: var(--brand-primary); }
.acc-q { font-size: var(--fs-h3); font-weight: 400; line-height: 1.3; }
.acc-icon { font-size: 24px; line-height: 1; color: var(--brand-primary); transition: transform var(--t-fast); }
.acc-body-wrap { overflow: hidden; transition: max-height var(--t-slow); }
.acc-body { padding-bottom: 20px; color: var(--color-text-mid); line-height: 1.7; max-width: 720px; }
.acc-body p { margin: 0; }

/* bordered: serif Q's */
.acc-bordered .acc-q { font-family: var(--font-serif, Georgia, serif); font-size: var(--fs-h2); font-weight: 300; }
.acc-bordered { border-bottom: 1px solid var(--color-border); }

/* two-col */
.faq-twocol-grid { display: grid; grid-template-columns: 360px 1fr; gap: var(--space-gap-xl); align-items: start; }
.faq-twocol-left { display: flex; flex-direction: column; gap: var(--space-gap-lg); position: sticky; top: var(--space-gap-md); }
.faq-contact-card { padding: var(--space-gap-md); background: var(--brand-primary-soft); display: flex; flex-direction: column; gap: var(--space-gap-xs); align-items: flex-start; }
.faq-contact-label { font-size: var(--fs-body-s); color: var(--color-text-strong); font-weight: 700; }
.faq-contact-mail { font-size: var(--fs-h3); color: var(--brand-primary); }

/* grouped */
.faq-grouped-list { display: flex; flex-direction: column; gap: var(--space-gap-lg); }
.faq-group { display: flex; flex-direction: column; }
.faq-group-title { display: flex; align-items: baseline; gap: 16px; padding-bottom: var(--space-gap-xs); border-bottom: 2px solid var(--brand-primary); font-size: var(--fs-h3); font-weight: 400; }
.faq-group-num { font-size: var(--fs-tag); font-weight: 700; letter-spacing: var(--ls-tag); color: var(--brand-primary); text-transform: uppercase; }

@media (max-width: 900px) {
  .faq-twocol-grid { grid-template-columns: 1fr; }
  .faq-twocol-left { position: static; }
}
</style>
