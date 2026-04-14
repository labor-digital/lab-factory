import { select, bool, child } from './toContent'

export interface ButtonSpec {
  label?: string
  to?: string
  color?: string
  variant?: string
  size?: string
  icon?: string
  trailing?: boolean
}

export function button(spec: ButtonSpec) {
  return child({
    label: spec.label ?? 'Button',
    to: spec.to ?? '#',
    color: select(spec.color ?? 'primary'),
    variant: select(spec.variant ?? 'solid'),
    size: select(spec.size ?? 'md'),
    icon: spec.icon,
    trailing: bool(spec.trailing ?? false)
  })
}

// Build a `count` long list of sample buttons using a rotating preset pool.
export function sampleButtons(count: number): any[] {
  if (count <= 0) return []
  const presets: ButtonSpec[] = [
    { label: 'Get started', variant: 'solid', color: 'primary' },
    { label: 'Learn more', variant: 'outline', color: 'neutral' },
    { label: 'Docs', variant: 'ghost', color: 'neutral', icon: 'i-lucide-book-open' }
  ]
  return Array.from({ length: count }, (_, i) => button(presets[i % presets.length]))
}
