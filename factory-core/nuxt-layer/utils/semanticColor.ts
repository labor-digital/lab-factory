// Maps a semantic color name to a CSS color value.
// primary/secondary resolve to theme CSS variables; the remaining tokens are
// hardcoded here until factory-settings exposes them as --ui-* vars too.
export function semanticColor(name: string | undefined): string {
  const map: Record<string, string> = {
    primary:   'var(--ui-primary)',
    secondary: 'var(--ui-secondary)',
    neutral:   '#171717',
    success:   '#16a34a',
    info:      '#2563eb',
    warning:   '#d97706',
    error:     '#dc2626'
  }
  return map[name || 'primary'] || map.primary
}
