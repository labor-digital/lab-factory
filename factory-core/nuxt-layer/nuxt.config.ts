import { fileURLToPath } from 'url'
import { resolve, dirname } from 'path'

const layerDir = dirname(fileURLToPath(import.meta.url))

export default defineNuxtConfig({
  modules: [
    '@t3headless/nuxt-typo3',
    resolve(layerDir, 'lib/register-ce-global')
  ]
})
