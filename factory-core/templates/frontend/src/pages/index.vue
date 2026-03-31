<template>
  <T3BackendLayout
    v-if="pageData?.content"
    :name="backendLayout"
    :content="pageData.content"
  />
</template>

<script setup>
const { headData, pageData, backendLayout } = await useT3Page()
useHead(headData)
</script>
