export default defineNuxtConfig({
  modules: [
    '@t3headless/nuxt-typo3'
  ],
  typo3: {
    contentElements: {
      factory_blog_posts: 'T3ContentBlogPosts'
    }
  }
})
