<script setup lang="ts">
import { computed } from 'vue'
import { parseFile } from '../../../utils/parseContent'
import { unwrapSelect } from '../../../utils/unwrapSelect'

const props = defineProps<{
  content: any
}>()

const parsedData = computed(() => {
  const data = props.content?.content || {}
  return {
    variant: unwrapSelect(data.variant, 'classic') as 'classic' | 'transparent' | 'minimal' | 'mega',
    logoText: data.logo_text || undefined,
    logoImage: parseFile(data.logo_image),
    ctaLabel: data.cta_label || undefined,
    ctaTo: data.cta_to?.url || data.cta_to || undefined,
    links: ((data.links || []) as any[]).map((link: any) => {
      const l = link.content || link
      return {
        label: l.label || '',
        to: l.to?.url || l.to || '#',
        active: l.active === '1' || l.active === true,
        children: ((l.children || []) as any[]).map((c: any) => {
          const cc = c.content || c
          return {
            group: cc.group || undefined,
            label: cc.label || '',
            to: cc.to?.url || cc.to || '#'
          }
        })
      }
    })
  }
})
</script>

<template>
  <slot :uiProps="parsedData" />
</template>
