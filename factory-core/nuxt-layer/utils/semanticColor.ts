// Maps a semantic color name to a CSS color value.
// primary/secondary resolve to design-token CSS variables (defined in
// nuxt-layer/assets/css/tokens.css) with a Nuxt UI fallback so the helper
// keeps working in contexts that haven't loaded the layer's tokens yet.
export function semanticColor(name: string | undefined): string {
  const map: Record<string, string> = {
    primary:   'var(--brand-primary, var(--ui-primary))',
    secondary: 'var(--brand-secondary, var(--ui-secondary))',
    neutral:   '#171717',
    success:   '#16a34a',
    info:      '#2563eb',
    warning:   '#d97706',
    error:     '#dc2626'
  }
  return map[name || 'primary'] || map.primary
}
