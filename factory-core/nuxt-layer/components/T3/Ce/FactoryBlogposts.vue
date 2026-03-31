<script setup lang="ts">
import T3ContentBlogPosts from '../Content/BlogPosts.vue'

defineOptions({ inheritAttrs: false })
const attrs = useAttrs()
const content = computed(() => ({ content: attrs }))
</script>

<template>
  <T3ContentBlogPosts :content="content" />
</template>
