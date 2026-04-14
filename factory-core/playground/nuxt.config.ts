export default defineNuxtConfig({
  extends: ['../nuxt-layer'],
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  // The layer registers @t3headless/nuxt-typo3 unconditionally. The playground
  // never hits the API, so disable the auto-fetching initialData middleware
  // (the global middleware that crashes without a reachable backend).
  typo3: {
    api: { baseUrl: 'http://localhost/_noop' },
    i18n: {
      default: 'en',
      locales: [{ code: 'en', iso: 'en-US', label: 'English' }]
    },
    features: {
      initInitialData: false,
      i18nMiddleware: false
    }
  },
  devServer: {
    port: 3030
  },
  app: {
    head: {
      title: 'Factory Playground'
    }
  }
})
