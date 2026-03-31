<script setup lang="ts">
import BaseTable from './BaseTable.vue'

defineProps<{
  content: any
}>()
</script>

<template>
  <BaseTable :content="content" v-slot="{ uiProps }">
    <UTable
      :data="uiProps.data"
      :columns="uiProps.columns"
      :caption="uiProps.caption"
      :sticky="uiProps.sticky"
    />
  </BaseTable>
</template>
