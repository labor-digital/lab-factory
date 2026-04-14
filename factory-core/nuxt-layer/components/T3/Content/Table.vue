<script setup lang="ts">
import BaseTable from './BaseTable.vue'
import ContentContainer from './ContentContainer.vue'

defineProps<{
  content: any
}>()
</script>

<template>
  <BaseTable :content="content" v-slot="{ uiProps }">
    <ContentContainer>
      <UTable
        :data="uiProps.data"
        :columns="uiProps.columns"
        :caption="uiProps.caption"
        :sticky="uiProps.sticky"
      />
    </ContentContainer>
  </BaseTable>
</template>
