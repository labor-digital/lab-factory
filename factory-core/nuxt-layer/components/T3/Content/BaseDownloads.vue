<script setup lang="ts">
import { computed } from 'vue'
import { parseFile } from '../../../utils/parseContent'
import { unwrapSelect } from '../../../utils/unwrapSelect'

const props = defineProps<{
  content: any
}>()

function deriveExt(file: any, fallback?: string): string {
  if (fallback) return fallback.toLowerCase()
  const src: string | undefined = file?.src
  if (!src) return 'file'
  const match = src.match(/\.([a-z0-9]{2,5})(?:[?#].*)?$/i)
  return match ? match[1].toLowerCase() : 'file'
}

function humanSize(bytes?: number, fallback?: string): string {
  if (fallback) return fallback
  if (!bytes || bytes <= 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const parsedData = computed(() => {
  const data = props.content?.content || {}
  return {
    variant: unwrapSelect(data.variant, 'list') as 'list' | 'icons' | 'featured' | 'grouped',
    eyebrow: data.eyebrow || undefined,
    headline: data.headline || undefined,
    intro: data.intro || undefined,
    items: ((data.items || []) as any[]).map((item: any) => {
      const it = item.content || item
      const file = parseFile(it.file)
      const ext = deriveExt(file, it.ext)
      return {
        title: it.title || '',
        desc: it.desc || undefined,
        ext,
        size: humanSize(file?.['width'] /* not used */, it.size),
        group: it.group || undefined,
        url: file?.src || it.url?.url || it.url || '#'
      }
    })
  }
})
</script>

<template>
  <slot :uiProps="parsedData" />
</template>
