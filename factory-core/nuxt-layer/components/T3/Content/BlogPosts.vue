<script setup lang="ts">
import BaseBlogPosts from './BaseBlogPosts.vue'

defineProps<{
  content: any
}>()

function formatDate(date: string | undefined) {
  if (!date) return ''
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date))
  } catch {
    return ''
  }
}
</script>

<template>
  <BaseBlogPosts :content="content" v-slot="{ posts }">
    <section class="w-full py-16 sm:py-20">
      <UContainer>
        <div class="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="(post, index) in posts"
            :key="index"
            class="flex flex-col gap-4"
          >
            <a
              :href="post.to"
              class="block rounded-(--ui-radius) overflow-hidden bg-elevated"
            >
              <NuxtImg
                v-if="post.image"
                :src="post.image.src"
                :alt="post.image.alt"
                :width="post.image.width"
                :height="post.image.height"
                class="w-full h-48 object-cover transition hover:scale-105"
              />
            </a>

            <div class="flex flex-col gap-2">
              <div class="flex items-center gap-3 text-xs text-muted">
                <span
                  v-if="post.badge"
                  class="px-2 py-0.5 rounded-(--ui-radius) bg-(--ui-primary) text-white font-medium"
                >
                  {{ post.badge }}
                </span>
                <time v-if="post.date" :datetime="post.date">
                  {{ formatDate(post.date) }}
                </time>
              </div>

              <h3 class="text-lg font-semibold text-default">
                <a :href="post.to" class="hover:text-(--ui-primary) transition">
                  {{ post.title }}
                </a>
              </h3>

              <p
                v-if="post.description"
                class="text-sm text-muted line-clamp-3"
              >
                {{ post.description }}
              </p>

              <div
                v-if="post.authors?.length"
                class="flex items-center gap-2 mt-2 text-xs text-muted"
              >
                <UIcon name="i-heroicons-user" class="size-4" />
                <span>{{ post.authors[0].name }}</span>
              </div>
            </div>
          </article>
        </div>
      </UContainer>
    </section>
  </BaseBlogPosts>
</template>
