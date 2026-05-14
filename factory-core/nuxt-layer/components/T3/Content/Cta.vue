<script setup lang="ts">
import BaseCta from './BaseCta.vue'
import Button from './Button.vue'

defineProps<{
  content: any
}>()
</script>

<template>
  <BaseCta :content="content" v-slot="{ uiProps }">
    <section
      class="factory-cta mod"
      :class="[`cta-${uiProps.variant}`, uiProps.variant === 'center-dark' ? 'is-dark' : '']"
    >
      <!-- Full-bleed background image -->
      <template v-if="uiProps.variant === 'fullbleed-image'">
        <NuxtImg
          v-if="uiProps.backgroundImage"
          :src="uiProps.backgroundImage.src"
          :alt="uiProps.backgroundImage.alt"
          class="cta-bg-image"
        />
        <div v-else class="ph ph-dark cta-bg-image">
          <span class="ph-label">Full-bleed Foto</span>
        </div>
        <div class="cta-overlay" />
      </template>

      <div class="cta-inner mod-inner">
        <div class="cta-text">
          <span v-if="uiProps.eyebrow" class="eyebrow" :class="{ 'on-dark': uiProps.variant !== 'split' && uiProps.variant !== 'inline-form' }">
            {{ uiProps.eyebrow }}
          </span>
          <h2 v-if="uiProps.titleLight || uiProps.titleBold" class="h-1 cta-title" :class="{ 'on-dark': uiProps.variant !== 'split' && uiProps.variant !== 'inline-form' }">
            <span class="cta-title-light">{{ uiProps.titleLight }}</span>
            <template v-if="uiProps.titleLight && uiProps.titleBold"><br /></template>
            <span class="cta-title-bold">{{ uiProps.titleBold }}</span>
          </h2>
          <p v-if="uiProps.body" class="body-text" :class="{ 'on-dark': uiProps.variant !== 'split' && uiProps.variant !== 'inline-form' }">
            {{ uiProps.body }}
          </p>
        </div>

        <!-- Buttons or inline form -->
        <form v-if="uiProps.variant === 'inline-form' && uiProps.form.enabled" class="cta-form" @submit.prevent>
          <label class="field">
            <span>{{ uiProps.form.nameLabel }}</span>
            <input type="text" :placeholder="uiProps.form.nameLabel" />
          </label>
          <label class="field">
            <span>{{ uiProps.form.mailLabel }}</span>
            <input type="email" :placeholder="uiProps.form.mailLabel" required />
          </label>
          <Button :label="uiProps.form.submitLabel" variant="solid" type="submit" />
          <div v-if="uiProps.form.note" class="cta-form-note">{{ uiProps.form.note }}</div>
        </form>
        <div v-else-if="uiProps.buttons.length" class="cta-actions">
          <Button v-for="(btn, i) in uiProps.buttons" :key="i" v-bind="btn" />
        </div>
      </div>
    </section>
  </BaseCta>
</template>

<style scoped>
.factory-cta { padding: var(--space-section-y) var(--space-section-x); }
.factory-cta.is-dark { background: var(--color-bg-dark); }
.factory-cta.cta-split { background: var(--brand-primary-soft); }

.cta-inner { display: flex; flex-direction: column; gap: var(--space-gap-md); }

.cta-split .cta-inner {
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-gap-xl);
}

.cta-center-dark .cta-inner { align-items: center; text-align: center; }
.cta-center-dark .body-text { max-width: 640px; margin: 0 auto; }

.cta-fullbleed { padding: 0; min-height: 480px; display: flex; align-items: center; position: relative; }
.cta-fullbleed .cta-bg-image { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.cta-fullbleed .cta-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.45); }
.cta-fullbleed .cta-inner { position: relative; padding: var(--space-section-y) var(--space-section-x); }
.cta-fullbleed .body-text { max-width: 560px; }

.cta-inline-form .cta-inner { flex-direction: row; gap: var(--space-gap-xl); align-items: flex-start; }
.cta-inline-form .cta-text { flex: 1; }
.cta-form { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-gap-xs); width: 360px; }
.cta-form .field { display: flex; flex-direction: column; font-size: var(--fs-body-s); gap: 4px; }
.cta-form .field input { padding: 10px 12px; border: 1px solid var(--color-border); background: var(--color-bg); font: inherit; }
.cta-form .field:nth-child(2) { grid-column: 1 / -1; }
.cta-form .factory-btn { grid-column: 1 / -1; }
.cta-form-note { grid-column: 1 / -1; font-size: var(--fs-small); color: var(--color-text-soft); }

.cta-title-light { font-weight: 300; }
.cta-title-bold { font-weight: 700; }
.cta-actions { display: flex; gap: 12px; flex-wrap: wrap; }
.cta-center-dark .cta-actions { justify-content: center; }

@media (max-width: 900px) {
  .cta-split .cta-inner,
  .cta-inline-form .cta-inner { flex-direction: column; align-items: flex-start; }
  .cta-form { width: 100%; }
}
</style>
