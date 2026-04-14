/**
 * Unwrap TYPO3 Content Blocks Select field values.
 *
 * The headless API serializes Select fields as single-element arrays
 * (e.g., ["primary"] instead of "primary"). This helper normalizes
 * them back to plain strings for NuxtUI component props.
 */
export function unwrapSelect(value: any, fallback?: string): string | undefined {
  if (Array.isArray(value)) return value[0] ?? fallback
  return value ?? fallback
}
