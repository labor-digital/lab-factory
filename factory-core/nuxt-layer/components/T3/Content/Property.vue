<script setup lang="ts">
import { computed, resolveDynamicComponent } from 'vue'
import BaseProperty from './BaseProperty.vue'
import { useFactoryPlaceholder } from '../../../composables/useFactoryPlaceholder'
import { semanticColor } from '../../../utils/semanticColor'

const props = defineProps<{
  content: any
  variant?: 'card' | 'detail'
}>()

const { getPlaceholderUrl } = useFactoryPlaceholder()

const variant = computed(() => props.variant ?? 'card')

// Card image: fall back to a seeded placeholder when the record has no hero.
function cardImage(ui: any, width = 347, height = 220) {
  if (ui.heroImage) return ui.heroImage
  const seed = ui.uid ? `property-${ui.uid}` : 'property'
  return { src: getPlaceholderUrl(width, height, seed), alt: ui.title || 'Property', width, height }
}

function addressLine(ui: any): string {
  const { street, zip, city } = ui.address
  const parts: string[] = []
  if (street) parts.push(street)
  if (zip && city) parts.push(`${zip} ${city}`)
  else if (city) parts.push(city)
  else if (zip) parts.push(zip)
  return parts.join(', ')
}

function formatPrice(ui: any): string | null {
  if (ui.price == null) return null
  const fmt = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 })
  const suffix = ui.priceType === 'monthly' ? ' €/Monat' : ' €'
  return fmt.format(ui.price) + suffix
}

// Render a content_elements[] child (a raw tt_content row) by resolving its
// T3Ce<Name> wrapper component, same dispatch path as the page renderer.
function resolveCe(ce: any) {
  const cType = (ce?.CType || ce?.cType || '').replace(/^factory_/, '')
  if (!cType) return null
  const pascal = cType.charAt(0).toUpperCase() + cType.slice(1).toLowerCase()
  return resolveDynamicComponent('T3CeFactory' + pascal) as any
}
</script>

<template>
  <BaseProperty :content="content" v-slot="{ uiProps }">
    <!-- CARD variant — matches Figma node 47:800 -->
    <article
      v-if="variant === 'card'"
      class="factory-property-card bg-white border border-neutral-200 overflow-hidden flex flex-col"
    >
      <div class="relative h-[220px] overflow-hidden bg-neutral-100">
        <NuxtImg
          :src="cardImage(uiProps).src"
          :alt="uiProps.title || cardImage(uiProps).alt"
          class="absolute inset-0 size-full object-cover"
          loading="lazy"
        />
      </div>
      <div class="flex flex-col gap-2 px-5 pt-5 pb-6">
        <span
          v-if="uiProps.tag"
          class="self-start px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] uppercase"
          :style="{
            color: semanticColor('primary'),
            background: 'color-mix(in srgb, ' + semanticColor('primary') + ' 8%, white)'
          }"
        >
          {{ uiProps.tag }}
        </span>
        <h3 class="text-sm font-bold leading-tight text-neutral-800">
          {{ uiProps.title }}
        </h3>
        <p v-if="addressLine(uiProps)" class="text-xs tracking-wide text-neutral-400">
          {{ addressLine(uiProps) }}
        </p>
        <hr class="border-0 border-t border-neutral-200 my-1" />
        <dl class="flex gap-5 pt-1 text-xs">
          <div v-if="uiProps.yearCompleted" class="flex flex-col gap-0.5">
            <dt class="text-[10px] font-bold tracking-[0.1em] text-neutral-400">FERTIG</dt>
            <dd class="text-neutral-600">{{ uiProps.yearCompleted }}</dd>
          </div>
          <div v-if="uiProps.areaM2" class="flex flex-col gap-0.5">
            <dt class="text-[10px] font-bold tracking-[0.1em] text-neutral-400">FLÄCHE</dt>
            <dd class="text-neutral-600">ca. {{ uiProps.areaM2 }} m²</dd>
          </div>
          <div v-if="uiProps.units && uiProps.units > 1" class="flex flex-col gap-0.5">
            <dt class="text-[10px] font-bold tracking-[0.1em] text-neutral-400">EINH.</dt>
            <dd class="text-neutral-600">{{ uiProps.units }} WE</dd>
          </div>
        </dl>
      </div>
    </article>

    <!-- DETAIL variant — hero + gallery + teaser + free-placed content elements -->
    <article v-else class="factory-property-detail flex flex-col gap-10">
      <header class="flex flex-col gap-3">
        <span
          v-if="uiProps.tag"
          class="self-start px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] uppercase"
          :style="{
            color: semanticColor('primary'),
            background: 'color-mix(in srgb, ' + semanticColor('primary') + ' 8%, white)'
          }"
        >{{ uiProps.tag }}</span>
        <h1 class="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight">{{ uiProps.title }}</h1>
        <p v-if="addressLine(uiProps)" class="text-base text-neutral-500">{{ addressLine(uiProps) }}</p>
      </header>

      <figure v-if="uiProps.heroImage" class="relative w-full overflow-hidden bg-neutral-100" style="aspect-ratio: 16 / 9">
        <NuxtImg :src="uiProps.heroImage.src" :alt="uiProps.heroImage.alt || uiProps.title" class="absolute inset-0 size-full object-cover" />
      </figure>

      <dl class="grid grid-cols-2 md:grid-cols-4 gap-6 border-y border-neutral-200 py-6">
        <div v-if="formatPrice(uiProps)" class="flex flex-col gap-1">
          <dt class="text-xs font-bold tracking-[0.1em] text-neutral-400 uppercase">Preis</dt>
          <dd class="text-base text-neutral-800">{{ formatPrice(uiProps) }}</dd>
        </div>
        <div v-else class="flex flex-col gap-1">
          <dt class="text-xs font-bold tracking-[0.1em] text-neutral-400 uppercase">Preis</dt>
          <dd class="text-base text-neutral-800">Preis auf Anfrage</dd>
        </div>
        <div v-if="uiProps.areaM2" class="flex flex-col gap-1">
          <dt class="text-xs font-bold tracking-[0.1em] text-neutral-400 uppercase">Fläche</dt>
          <dd class="text-base text-neutral-800">ca. {{ uiProps.areaM2 }} m²</dd>
        </div>
        <div v-if="uiProps.rooms" class="flex flex-col gap-1">
          <dt class="text-xs font-bold tracking-[0.1em] text-neutral-400 uppercase">Zimmer</dt>
          <dd class="text-base text-neutral-800">{{ uiProps.rooms }}</dd>
        </div>
        <div v-if="uiProps.yearCompleted" class="flex flex-col gap-1">
          <dt class="text-xs font-bold tracking-[0.1em] text-neutral-400 uppercase">Fertig</dt>
          <dd class="text-base text-neutral-800">{{ uiProps.yearCompleted }}</dd>
        </div>
      </dl>

      <p v-if="uiProps.teaser" class="text-lg leading-relaxed text-neutral-700 max-w-prose">{{ uiProps.teaser }}</p>

      <div v-if="uiProps.gallery.length" class="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <figure
          v-for="(img, i) in uiProps.gallery"
          :key="i"
          class="relative overflow-hidden bg-neutral-100"
          style="aspect-ratio: 4 / 3"
        >
          <NuxtImg :src="img.src" :alt="img.alt || ''" class="absolute inset-0 size-full object-cover" loading="lazy" />
        </figure>
      </div>

      <section v-if="uiProps.contentElements.length" class="flex flex-col gap-16">
        <template v-for="(ce, i) in uiProps.contentElements" :key="ce.uid || i">
          <component
            v-if="resolveCe(ce)"
            :is="resolveCe(ce)"
            v-bind="ce"
          />
        </template>
      </section>
    </article>
  </BaseProperty>
</template>
