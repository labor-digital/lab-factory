<script setup lang="ts">
import { ref, computed } from 'vue'
import BaseHeader from './BaseHeader.vue'
import Button from './Button.vue'

defineProps<{
  content: any
}>()

const openIdx = ref<number | null>(null)
function groupedChildren(children: any[]) {
  const groups: { title: string; items: any[] }[] = []
  const map = new Map<string, number>()
  children.forEach((c) => {
    const t = c.group || 'Mehr'
    if (!map.has(t)) { map.set(t, groups.length); groups.push({ title: t, items: [] }) }
    groups[map.get(t)!].items.push(c)
  })
  return groups
}
</script>

<template>
  <BaseHeader :content="content" v-slot="{ uiProps }">
    <header
      class="factory-header"
      :class="[`hdr-${uiProps.variant}`, uiProps.variant === 'transparent' ? 'on-dark' : '']"
    >
      <div class="hdr-inner">
        <!-- Logo on the left (except minimal centers it) -->
        <a v-if="uiProps.variant !== 'minimal'" class="hdr-logo" href="/">
          <NuxtImg
            v-if="uiProps.logoImage"
            :src="uiProps.logoImage.src"
            :alt="uiProps.logoImage.alt || uiProps.logoText || 'Logo'"
            class="hdr-logo-img"
          />
          <template v-else>
            <span class="hdr-logo-mark" />
            <span class="hdr-logo-text">{{ uiProps.logoText || 'Logo' }}</span>
          </template>
        </a>

        <!-- Minimal: burger left, logo center, CTA right -->
        <template v-if="uiProps.variant === 'minimal'">
          <button class="hdr-burger" aria-label="Menü"><span /><span /><span /></button>
          <a class="hdr-logo hdr-logo-center" href="/">
            <span class="hdr-logo-mark" />
            <span class="hdr-logo-text">{{ uiProps.logoText || 'Logo' }}</span>
          </a>
          <div class="hdr-side-r">
            <Button v-if="uiProps.ctaLabel" :label="uiProps.ctaLabel" variant="ghost" :to="uiProps.ctaTo" />
          </div>
        </template>

        <!-- Nav (classic / transparent / mega) -->
        <nav v-else class="hdr-nav">
          <template v-for="(l, i) in uiProps.links" :key="i">
            <a
              :href="l.to"
              class="hdr-link"
              :class="{ active: l.active || openIdx === i }"
              @mouseenter="uiProps.variant === 'mega' && l.children.length ? openIdx = i : null"
              @mouseleave="uiProps.variant === 'mega' && l.children.length ? openIdx = null : null"
            >
              {{ l.label }}<span v-if="uiProps.variant === 'mega' && l.children.length" class="hdr-caret">▾</span>
            </a>
          </template>
        </nav>

        <!-- CTA on the right (mega / classic with cta) -->
        <div v-if="uiProps.variant === 'mega' && uiProps.ctaLabel" class="hdr-side-r">
          <Button :label="uiProps.ctaLabel" variant="solid" :to="uiProps.ctaTo" />
        </div>
      </div>

      <!-- Mega-menu panel -->
      <div
        v-if="uiProps.variant === 'mega' && openIdx !== null && uiProps.links[openIdx]?.children?.length"
        class="hdr-mega-panel"
        @mouseenter="openIdx = openIdx"
        @mouseleave="openIdx = null"
      >
        <div class="hdr-mega-inner">
          <div v-for="(g, gi) in groupedChildren(uiProps.links[openIdx].children)" :key="gi" class="hdr-mega-col">
            <span class="eyebrow no-bar">{{ g.title }}</span>
            <a v-for="(c, ci) in g.items" :key="ci" :href="c.to" class="hdr-mega-link">{{ c.label }}</a>
          </div>
        </div>
      </div>
    </header>
  </BaseHeader>
</template>

<style scoped>
.factory-header { background: var(--color-bg); border-bottom: 1px solid var(--color-divider); position: relative; }
.factory-header.hdr-transparent { background: transparent; border-bottom-color: rgba(255,255,255,0.15); }
.factory-header.hdr-mega { background: var(--color-bg); }

.hdr-inner { display: flex; align-items: center; justify-content: space-between; gap: var(--space-gap-md); padding: 0 var(--space-section-x); height: 72px; }
.hdr-minimal .hdr-inner { display: grid; grid-template-columns: 1fr auto 1fr; }

.hdr-logo { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; color: var(--color-text-strong); }
.hdr-transparent .hdr-logo { color: #fff; }
.hdr-logo-center { justify-self: center; }
.hdr-logo-mark { width: 32px; height: 32px; background: var(--brand-primary); display: inline-block; }
.hdr-logo-text { font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; font-size: var(--fs-body-s); }
.hdr-logo-img { max-height: 40px; width: auto; }

.hdr-nav { display: flex; gap: var(--space-gap-md); align-items: center; }
.hdr-link { font-size: var(--fs-body-s); font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--color-text-strong); text-decoration: none; padding: 8px 0; transition: color var(--t-fast); position: relative; }
.hdr-transparent .hdr-link { color: #fff; }
.hdr-link:hover, .hdr-link.active { color: var(--brand-primary); }
.hdr-transparent .hdr-link:hover, .hdr-transparent .hdr-link.active { color: var(--brand-primary-soft); }
.hdr-caret { margin-left: 4px; font-size: 10px; }

.hdr-burger { display: inline-flex; flex-direction: column; gap: 4px; width: 32px; justify-self: start; background: none; border: none; padding: 8px 0; cursor: pointer; }
.hdr-burger span { display: block; height: 2px; background: currentColor; width: 100%; }

.hdr-side-r { justify-self: end; display: inline-flex; gap: 12px; align-items: center; }

/* Mega panel */
.hdr-mega-panel { position: absolute; top: 100%; left: 0; right: 0; background: var(--color-bg); border-top: 1px solid var(--color-divider); box-shadow: 0 12px 24px rgba(0,0,0,0.04); z-index: 50; }
.hdr-mega-inner { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-gap-md); padding: var(--space-gap-lg) var(--space-section-x); }
.hdr-mega-col { display: flex; flex-direction: column; gap: 8px; }
.hdr-mega-link { color: var(--color-text-strong); text-decoration: none; font-size: var(--fs-body); transition: color var(--t-fast); }
.hdr-mega-link:hover { color: var(--brand-primary); }

@media (max-width: 900px) {
  .hdr-inner { padding: 0 var(--space-section-x); }
  .hdr-nav { display: none; }
}
</style>
