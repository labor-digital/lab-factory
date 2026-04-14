<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import BaseButton from './BaseButton.vue'
import { semanticColor } from '../../../utils/semanticColor'

// TYPO3/Nuxt UI convention uses names like "i-lucide-arrow-right".
// @iconify/vue expects "lucide:arrow-right". Normalize both formats.
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

const props = defineProps<{
  label?: string
  to?: any
  target?: string
  color?: string
  variant?: string
  size?: string
  icon?: string
  leading?: boolean
  trailing?: boolean
  block?: boolean
  disabled?: boolean
}>()

const sizeClasses: Record<string, string> = {
  xs: 'text-xs px-2.5 py-1 gap-1',
  sm: 'text-sm px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2 gap-2',
  lg: 'text-base px-6 py-3 gap-2',
  xl: 'text-lg px-8 py-3.5 gap-2.5'
}

const iconSizeClasses: Record<string, string> = {
  xs: 'size-3',
  sm: 'size-4',
  md: 'size-4',
  lg: 'size-5',
  xl: 'size-5'
}

const variantClass: Record<string, string> = {
  solid: 'btn-solid',
  outline: 'btn-outline',
  soft: 'btn-soft',
  subtle: 'btn-subtle',
  ghost: 'btn-ghost',
  link: 'btn-link'
}

const cssVars = computed(() => ({
  '--btn-color': semanticColor(unwrapSelect(props.color, 'primary')),
  '--btn-contrast': 'white'
}))
</script>

<template>
  <BaseButton v-bind="$props" v-slot="{ uiProps }">
    <component
      :is="uiProps.to ? 'a' : 'button'"
      :href="uiProps.to"
      :target="uiProps.target"
      :rel="uiProps.target === '_blank' ? 'noopener noreferrer' : undefined"
      :style="cssVars"
      :class="[
        'factory-btn inline-flex items-center justify-center font-semibold tracking-wide transition rounded-(--ui-radius) cursor-pointer whitespace-nowrap no-underline',
        sizeClasses[uiProps.size] || sizeClasses.md,
        variantClass[uiProps.variant] || variantClass.solid,
        uiProps.block ? 'w-full' : '',
        uiProps.disabled ? 'opacity-50 pointer-events-none' : ''
      ]"
    >
      <Icon
        v-if="uiProps.icon && (uiProps.leading || (!uiProps.leading && !uiProps.trailing))"
        :icon="iconName(uiProps.icon)"
        :class="iconSizeClasses[uiProps.size] || iconSizeClasses.md"
      />
      <span v-if="uiProps.label">{{ uiProps.label }}</span>
      <slot />
      <Icon
        v-if="uiProps.icon && uiProps.trailing"
        :icon="iconName(uiProps.icon)"
        :class="iconSizeClasses[uiProps.size] || iconSizeClasses.md"
      />
    </component>
  </BaseButton>
</template>

<style scoped>
.factory-btn { line-height: 1; }

.btn-solid {
  background: var(--btn-color);
  color: var(--btn-contrast);
}
.btn-solid:hover { filter: brightness(0.9); }

.btn-outline {
  background: transparent;
  color: var(--btn-color);
  border: 2px solid var(--btn-color);
}
.btn-outline:hover {
  background: var(--btn-color);
  color: var(--btn-contrast);
}

.btn-soft {
  background: color-mix(in oklch, var(--btn-color) 10%, transparent);
  color: var(--btn-color);
}
.btn-soft:hover {
  background: color-mix(in oklch, var(--btn-color) 20%, transparent);
}

.btn-subtle {
  background: color-mix(in oklch, var(--btn-color) 5%, transparent);
  color: var(--btn-color);
  border: 1px solid color-mix(in oklch, var(--btn-color) 20%, transparent);
}
.btn-subtle:hover {
  background: color-mix(in oklch, var(--btn-color) 12%, transparent);
}

.btn-ghost {
  background: transparent;
  color: var(--btn-color);
}
.btn-ghost:hover {
  background: color-mix(in oklch, var(--btn-color) 10%, transparent);
}

.btn-link {
  background: transparent;
  color: var(--btn-color);
  text-decoration: underline;
  text-underline-offset: 4px;
  padding: 0;
}
.btn-link:hover { opacity: 0.8; }
</style>
