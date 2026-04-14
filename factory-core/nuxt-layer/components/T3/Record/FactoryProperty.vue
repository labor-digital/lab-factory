<script setup lang="ts">
import T3ContentProperty from '../Content/Property.vue'

// Sibling to T3/Ce/Factory*.vue, but for record types. Consumes a record
// payload directly (not a tt_content row) plus a variant flag. Used by
// ReferenceList.vue via resolveDynamicComponent('T3RecordFactoryProperty').

const props = defineProps<{
  record: Record<string, any>
  variant?: 'card' | 'detail'
}>()

const content = computed(() => ({ content: props.record }))
</script>

<template>
  <T3ContentProperty :content="content" :variant="props.variant ?? 'card'" />
</template>
