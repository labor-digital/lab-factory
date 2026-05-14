<script setup lang="ts">
import T3ContentLogowall from '../Content/Logowall.vue'

defineOptions({ inheritAttrs: false })
const attrs = useAttrs()
const content = computed(() => ({ content: attrs }))
</script>

<template>
  <T3ContentLogowall :content="content" />
</template>
