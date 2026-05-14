<script setup lang="ts">
import { computed } from 'vue'
import { unwrapSelect } from '../../../utils/unwrapSelect'

const props = defineProps<{
  content: any
}>()

const parsedData = computed(() => {
  const data = props.content?.content || {}
  return {
    variant: unwrapSelect(data.variant, 'single') as 'single' | 'two-col' | 'grouped' | 'bordered',
    eyebrow: data.eyebrow || undefined,
    headline: data.headline || undefined,
    intro: data.intro || undefined,
    contactLabel: data.contact_label || undefined,
    contactMail: data.contact_mail || undefined,
    contactButton: data.contact_button || undefined,
    items: ((data.items || []) as any[]).map((item: any) => {
      const it = item.content || item
      return {
        q: it.q || '',
        a: it.a || '',
        group: it.group || undefined
      }
    })
  }
})
</script>

<template>
  <slot :uiProps="parsedData" />
</template>
