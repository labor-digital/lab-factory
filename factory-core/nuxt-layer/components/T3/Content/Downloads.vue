<script setup lang="ts">
import BaseDownloads from './BaseDownloads.vue'

defineProps<{
  content: any
}>()

const FORMATS: Record<string, { color: string; bg: string; label: string }> = {
  pdf: { color: '#D9374B', bg: '#FBEAEC', label: 'PDF' },
  doc: { color: '#2B6CB0', bg: '#E8F0FA', label: 'DOC' },
  docx: { color: '#2B6CB0', bg: '#E8F0FA', label: 'DOCX' },
  xls: { color: '#2F855A', bg: '#E8F4EC', label: 'XLS' },
  xlsx: { color: '#2F855A', bg: '#E8F4EC', label: 'XLSX' },
  ppt: { color: '#C05621', bg: '#FBEDE1', label: 'PPT' },
  pptx: { color: '#C05621', bg: '#FBEDE1', label: 'PPTX' },
  zip: { color: '#6B46C1', bg: '#EFE8FA', label: 'ZIP' },
  jpg: { color: '#0987A0', bg: '#E1F2F4', label: 'JPG' },
  png: { color: '#0987A0', bg: '#E1F2F4', label: 'PNG' },
  mp4: { color: '#805AD5', bg: '#EEE8F7', label: 'MP4' },
  dwg: { color: '#B7791F', bg: '#FAF0D9', label: 'DWG' },
  txt: { color: '#4A5568', bg: '#EDEFF2', label: 'TXT' }
}
const DEFAULT_FMT = { color: '#4A5568', bg: '#EDEFF2', label: 'FILE' }
function fmt(ext: string) { return FORMATS[ext] || DEFAULT_FMT }

function groupedItems(items: any[]) {
  const groups: { title: string; items: any[] }[] = []
  const map = new Map<string, number>()
  items.forEach((item) => {
    const title = item.group || 'Dateien'
    if (!map.has(title)) { map.set(title, groups.length); groups.push({ title, items: [] }) }
    groups[map.get(title)!].items.push(item)
  })
  return groups
}
</script>

<template>
  <BaseDownloads :content="content" v-slot="{ uiProps }">
    <section class="factory-downloads mod" :class="`dl-${uiProps.variant}`">
      <div class="dl-inner mod-inner">
        <header v-if="uiProps.eyebrow || uiProps.headline || uiProps.intro" class="dl-head" :class="uiProps.variant === 'icons' ? 'dl-head-center' : 'dl-head-left'">
          <span v-if="uiProps.eyebrow" class="eyebrow" :class="{ center: uiProps.variant === 'icons' }">{{ uiProps.eyebrow }}</span>
          <h2 v-if="uiProps.headline" class="h-2">{{ uiProps.headline }}</h2>
          <p v-if="uiProps.intro" class="body-text">{{ uiProps.intro }}</p>
        </header>

        <!-- LIST -->
        <div v-if="uiProps.variant === 'list'" class="dl-list-wrap">
          <a v-for="(it, i) in uiProps.items" :key="i" :href="it.url" class="dl-row" :download="it.url !== '#' ? '' : undefined">
            <div class="dl-row-icon" :style="{ background: fmt(it.ext).bg, color: fmt(it.ext).color }">{{ fmt(it.ext).label.slice(0, 3) }}</div>
            <div class="dl-row-body">
              <div class="dl-row-title">{{ it.title }}</div>
              <div class="dl-row-meta">
                <span class="dl-badge" :style="{ background: fmt(it.ext).bg, color: fmt(it.ext).color }">{{ fmt(it.ext).label }}</span>
                <span v-if="it.size" class="dl-size">{{ it.size }}</span>
              </div>
            </div>
            <div class="dl-row-action" aria-label="Download">↓</div>
          </a>
        </div>

        <!-- ICONS -->
        <div v-else-if="uiProps.variant === 'icons'" class="dl-icons-grid">
          <a v-for="(it, i) in uiProps.items" :key="i" :href="it.url" class="dl-card">
            <div class="dl-card-icon" :style="{ background: fmt(it.ext).bg, color: fmt(it.ext).color }">{{ fmt(it.ext).label }}</div>
            <div class="dl-card-body">
              <div class="dl-card-title">{{ it.title }}</div>
              <p v-if="it.desc" class="dl-card-desc">{{ it.desc }}</p>
              <div class="dl-card-meta">
                <span class="dl-badge" :style="{ background: fmt(it.ext).bg, color: fmt(it.ext).color }">{{ fmt(it.ext).label }}</span>
                <span v-if="it.size" class="dl-size">{{ it.size }}</span>
              </div>
            </div>
          </a>
        </div>

        <!-- FEATURED -->
        <div v-else-if="uiProps.variant === 'featured' && uiProps.items.length" class="dl-feat-wrap">
          <a :href="uiProps.items[0].url" class="dl-feat-card" :style="{ borderColor: fmt(uiProps.items[0].ext).color }">
            <div class="dl-feat-icon" :style="{ background: fmt(uiProps.items[0].ext).bg, color: fmt(uiProps.items[0].ext).color }">{{ fmt(uiProps.items[0].ext).label }}</div>
            <div class="dl-feat-body">
              <span class="eyebrow" :style="{ color: fmt(uiProps.items[0].ext).color }">Highlight · {{ fmt(uiProps.items[0].ext).label }}</span>
              <div class="dl-feat-title">{{ uiProps.items[0].title }}</div>
              <p v-if="uiProps.items[0].desc" class="dl-feat-desc">{{ uiProps.items[0].desc }}</p>
              <div class="dl-feat-cta">
                <span class="btn btn-solid" :style="{ background: fmt(uiProps.items[0].ext).color, borderColor: fmt(uiProps.items[0].ext).color }">Jetzt herunterladen ↓</span>
                <span v-if="uiProps.items[0].size" class="dl-feat-size">{{ uiProps.items[0].size }}</span>
              </div>
            </div>
          </a>
          <div class="dl-feat-list">
            <a v-for="(it, i) in uiProps.items.slice(1)" :key="i" :href="it.url" class="dl-row">
              <div class="dl-row-icon" :style="{ background: fmt(it.ext).bg, color: fmt(it.ext).color }">{{ fmt(it.ext).label.slice(0, 3) }}</div>
              <div class="dl-row-body">
                <div class="dl-row-title">{{ it.title }}</div>
                <div class="dl-row-meta">
                  <span class="dl-badge" :style="{ background: fmt(it.ext).bg, color: fmt(it.ext).color }">{{ fmt(it.ext).label }}</span>
                  <span v-if="it.size" class="dl-size">{{ it.size }}</span>
                </div>
              </div>
              <div class="dl-row-action">↓</div>
            </a>
          </div>
        </div>

        <!-- GROUPED -->
        <div v-else-if="uiProps.variant === 'grouped'" class="dl-groups">
          <div v-for="(g, gi) in groupedItems(uiProps.items)" :key="gi" class="dl-group">
            <div class="dl-group-head">
              <h3 class="dl-group-title">{{ g.title }}</h3>
              <span class="dl-group-count">{{ g.items.length }} {{ g.items.length === 1 ? 'Datei' : 'Dateien' }}</span>
            </div>
            <div class="dl-group-items">
              <a v-for="(it, i) in g.items" :key="i" :href="it.url" class="dl-row">
                <div class="dl-row-icon" :style="{ background: fmt(it.ext).bg, color: fmt(it.ext).color }">{{ fmt(it.ext).label.slice(0, 3) }}</div>
                <div class="dl-row-body">
                  <div class="dl-row-title">{{ it.title }}</div>
                  <div class="dl-row-meta">
                    <span class="dl-badge" :style="{ background: fmt(it.ext).bg, color: fmt(it.ext).color }">{{ fmt(it.ext).label }}</span>
                    <span v-if="it.size" class="dl-size">{{ it.size }}</span>
                  </div>
                </div>
                <div class="dl-row-action">↓</div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  </BaseDownloads>
</template>

<style scoped>
.factory-downloads { padding: var(--space-section-y) var(--space-section-x); }
.dl-inner { display: flex; flex-direction: column; gap: var(--space-gap-lg); }
.dl-head { display: flex; flex-direction: column; gap: var(--space-gap-xs); max-width: 720px; }
.dl-head-center { align-items: center; text-align: center; margin: 0 auto; }

.dl-row { display: flex; align-items: center; gap: var(--space-gap-sm); padding: 16px 20px; background: var(--color-bg); border: 1px solid var(--color-divider); text-decoration: none; color: inherit; transition: border-color var(--t-fast), background var(--t-fast); }
.dl-row + .dl-row { margin-top: -1px; }
.dl-row:hover { border-color: var(--brand-primary); }
.dl-row-icon { width: 40px; height: 48px; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; letter-spacing: 0.05em; }
.dl-row-body { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.dl-row-title { font-size: var(--fs-body); font-weight: 600; color: var(--color-text-strong); }
.dl-row-meta { display: flex; gap: 12px; align-items: center; }
.dl-badge { font-size: var(--fs-tag); font-weight: 700; letter-spacing: var(--ls-tag); padding: 2px 8px; text-transform: uppercase; }
.dl-size { font-size: var(--fs-small); color: var(--color-text-soft); }
.dl-row-action { font-size: 22px; color: var(--brand-primary); transition: transform var(--t-fast); }
.dl-row:hover .dl-row-action { transform: translateY(2px); }

.dl-icons-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-gap-sm); }
.dl-card { display: flex; gap: var(--space-gap-sm); padding: var(--space-gap-md); background: var(--color-bg); border: 1px solid var(--color-divider); text-decoration: none; color: inherit; transition: border-color var(--t-fast); }
.dl-card:hover { border-color: var(--brand-primary); }
.dl-card-icon { width: 56px; height: 70px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex: 0 0 auto; }
.dl-card-body { display: flex; flex-direction: column; gap: 6px; }
.dl-card-title { font-size: var(--fs-body); font-weight: 600; color: var(--color-text-strong); }
.dl-card-desc { font-size: var(--fs-body-s); color: var(--color-text-mid); margin: 0; }
.dl-card-meta { display: flex; gap: 8px; align-items: center; margin-top: 4px; }

.dl-feat-wrap { display: grid; grid-template-columns: 2fr 1fr; gap: var(--space-gap-md); align-items: start; }
.dl-feat-card { display: flex; gap: var(--space-gap-md); padding: var(--space-gap-md); border: 2px solid var(--color-border); text-decoration: none; color: inherit; transition: transform var(--t-fast); }
.dl-feat-card:hover { transform: translateY(-2px); }
.dl-feat-icon { width: 96px; height: 120px; display: inline-flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; flex: 0 0 auto; }
.dl-feat-body { display: flex; flex-direction: column; gap: var(--space-gap-xs); }
.dl-feat-title { font-size: var(--fs-h3); font-weight: 400; }
.dl-feat-desc { color: var(--color-text-mid); margin: 0; }
.dl-feat-cta { display: flex; gap: 16px; align-items: center; margin-top: var(--space-gap-xs); }
.dl-feat-size { font-size: var(--fs-small); color: var(--color-text-soft); }
.dl-feat-list { display: flex; flex-direction: column; }

.dl-groups { display: flex; flex-direction: column; gap: var(--space-gap-lg); }
.dl-group-head { display: flex; align-items: baseline; justify-content: space-between; padding-bottom: var(--space-gap-xs); margin-bottom: var(--space-gap-xs); border-bottom: 2px solid var(--brand-primary); }
.dl-group-title { font-size: var(--fs-h3); font-weight: 400; margin: 0; }
.dl-group-count { font-size: var(--fs-small); color: var(--color-text-soft); }
.dl-group-items { display: flex; flex-direction: column; }

@media (max-width: 900px) {
  .dl-icons-grid { grid-template-columns: 1fr; }
  .dl-feat-wrap { grid-template-columns: 1fr; }
}
</style>
