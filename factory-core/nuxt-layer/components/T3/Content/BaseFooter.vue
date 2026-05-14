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
    variant: unwrapSelect(data.variant, 'columns') as 'columns' | 'compact' | 'split' | 'maximal',
    logoText: data.logo_text || undefined,
    logoImage: parseFile(data.logo_image),
    tagline: data.tagline || undefined,
    claim: data.claim || undefined,
    address: (data.address || '').split('\n').filter(Boolean),
    cols: ((data.cols || []) as any[]).map((col: any) => {
      const c = col.content || col
      return {
        title: c.title || '',
        links: ((c.links || []) as any[]).map((l: any) => {
          const ll = l.content || l
          return { label: ll.label || '', to: ll.to?.url || ll.to || '#' }
        })
      }
    }),
    contacts: ((data.contacts || []) as any[]).map((c: any) => {
      const cc = c.content || c
      return { label: cc.label || '', to: cc.to?.url || cc.to || '#' }
    }),
    socials: ((data.socials || []) as any[]).map((s: any) => {
      const ss = s.content || s
      return { label: ss.label || '', to: ss.to?.url || ss.to || '#' }
    }),
    legal: ((data.legal || []) as any[]).map((l: any) => {
      const ll = l.content || l
      return { label: ll.label || '', to: ll.to?.url || ll.to || '#' }
    }),
    copyright: data.copyright || undefined,
    ctaPrimary: data.cta_primary || undefined,
    ctaSecondary: data.cta_secondary || undefined
  }
})
</script>

<template>
  <slot :uiProps="parsedData" />
</template>
