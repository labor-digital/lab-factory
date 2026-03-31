<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  content: any
}>()

const parsedData = computed(() => {
  const data = props.content?.content || {}

  const columns = (data.columns || []).map((col: any) => {
    const colData = col.content || col
    return {
      accessorKey: colData.key,
      header: colData.label
    }
  })

  const rows = (data.rows || []).map((row: any) => {
    const rowData = row.content || row
    try {
      return typeof rowData.data === 'string' ? JSON.parse(rowData.data) : rowData.data
    } catch {
      return {}
    }
  })

  const sticky = data.sticky === 'both' ? true : data.sticky || undefined

  return {
    caption: data.caption || undefined,
    sticky,
    columns: columns.length > 0 ? columns : undefined,
    data: rows.length > 0 ? rows : undefined
  }
})
</script>

<template>
  <slot :uiProps="parsedData" />
</template>
