const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|gif|svg|avif)(\?.*)?$/i

/**
 * Returns a helper to generate placeholder image URLs.
 *
 * Supports two modes:
 * - Dynamic (default): base URL like `https://picsum.photos` → builds `{base}/{w}/{h}?random={seed}`
 * - Fixed: direct image URL like `https://example.com/img.webp` → returns as-is
 */
export function useFactoryPlaceholder() {
  const appConfig = useAppConfig() as { factory?: { placeholderImageBaseUrl?: string } }
  const baseUrl = appConfig.factory?.placeholderImageBaseUrl || 'https://picsum.photos'

  const isFixed = IMAGE_EXTENSIONS.test(baseUrl)

  function getPlaceholderUrl(width: number, height: number, seed: string | number): string {
    if (isFixed) {
      return baseUrl
    }
    return `${baseUrl.replace(/\/+$/, '')}/${width}/${height}?random=${seed}`
  }

  return { getPlaceholderUrl }
}
