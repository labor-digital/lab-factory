<script setup lang="ts">
import BaseBlogPosts from './BaseBlogPosts.vue'

defineProps<{
  content: any
}>()
</script>

<template>
  <BaseBlogPosts :content="content" v-slot="{ posts }">
    <UBlogPosts>
      <UBlogPost
        v-for="(post, index) in posts"
        :key="index"
        v-bind="post"
      />
    </UBlogPosts>
  </BaseBlogPosts>
</template>
