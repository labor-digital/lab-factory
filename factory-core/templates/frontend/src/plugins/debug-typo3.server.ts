export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const typo3Config = config.public.typo3 as Record<string, unknown>

  console.log('[Factory] TYPO3 runtime config:', JSON.stringify(typo3Config, null, 2))
  console.log('[Factory] TYPO3_API_BASE_URL env:', process.env.TYPO3_API_BASE_URL || '(not set)')
})
