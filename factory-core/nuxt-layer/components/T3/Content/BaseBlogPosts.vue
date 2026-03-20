<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  content: any
}>()

const mappedPosts = computed(() => {
  // The payload from @t3headless/nuxt-typo3-news usually has the records in content.data.news or content.data
  const records = props.content?.data?.news || props.content?.data || props.content?.content || []
  
  if (!Array.isArray(records)) {
    return []
  }

  return records.map((record: any) => {
    // Handle image
    let image = null
    if (record.media && record.media.length > 0) {
      const media = record.media[0]
      image = {
        src: media.publicUrl || media.url,
        alt: media.properties?.alternative || media.title || record.title || '',
        width: media.properties?.width,
        height: media.properties?.height
      }
    } else if (record.falMedia && record.falMedia.length > 0) {
      const media = record.falMedia[0]
      image = {
        src: media.publicUrl || media.url,
        alt: media.properties?.alternative || media.title || record.title || '',
        width: media.properties?.width,
        height: media.properties?.height
      }
    } else {
      // Fallback image
      image = {
        src: '/images/fallback-news.jpg',
        alt: record.title || 'News'
      }
    }

    // Handle date
    let date = record.datetime || record.crdate || record.date
    if (date) {
      // Ensure it's a valid date string or Date object
      // TYPO3 might send a timestamp (number) or ISO string
      if (typeof date === 'number') {
        date = new Date(date * 1000).toISOString()
      } else {
        date = new Date(date).toISOString()
      }
    }

    // Handle authors
    let authors = undefined
    if (record.author) {
      authors = [{
        name: record.author,
        description: record.authorEmail || undefined
      }]
    }

    return {
      title: record.title,
      description: record.teaser || record.bodytext,
      date: date,
      image: image,
      to: record.link || record.path || record.url,
      authors: authors,
      badge: record.categories?.[0]?.title || undefined
    }
  })
})
</script>

<template>
  <slot :posts="mappedPosts" />
</template>
