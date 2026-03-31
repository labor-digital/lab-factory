import { fileURLToPath } from 'url'
import { addComponentsDir, defineNuxtModule } from '@nuxt/kit'

// Register Factory layer components:
// - Ce components globally (prefix T3Ce) for nuxt-typo3's resolveDynamicComponent()
// - Content components (prefix T3Content) as auto-imports for Ce templates
export default defineNuxtModule({
  meta: {
    name: 'factory-ce-global'
  },
  setup() {
    addComponentsDir({
      path: fileURLToPath(new URL('../components/T3/Ce', import.meta.url)),
      extensions: ['vue'],
      prefix: 'T3Ce',
      global: true
    })
    addComponentsDir({
      path: fileURLToPath(new URL('../components/T3/Content', import.meta.url)),
      extensions: ['vue'],
      prefix: 'T3Content'
    })
  }
})
