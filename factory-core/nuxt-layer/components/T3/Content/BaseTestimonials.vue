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
    variant: unwrapSelect(data.variant, 'quote-xl') as 'quote-xl' | 'quote-flow' | 'cards' | 'slider' | 'featured',
    eyebrow: data.eyebrow || undefined,
    headline: data.headline || undefined,
    intro: data.intro || undefined,
    longQuote: data.long_quote || undefined,
    items: ((data.items || []) as any[]).map((item: any) => {
      const it = item.content || item
      return {
        quote: it.quote || '',
        name: it.name || '',
        role: it.role || '',
        company: it.company || '',
        avatar: parseFile(it.avatar),
        media: parseFile(it.media)
      }
    })
  }
})
</script>

<template>
  <slot :uiProps="parsedData" />
</template>
