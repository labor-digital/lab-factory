// Shared parsers for TYPO3 Content Block payloads. Used by Base* components
// to turn the raw headless-TYPO3 JSON into clean, typed objects for rendering.

export interface ParsedFile {
  src: string
  mime?: string
  alt: string
  width?: number
  height?: number
}

export interface ParsedButton {
  label?: string
  to?: string
  target?: string
  color: string
  variant: string
  size: string
  icon?: string
  leading: boolean
  trailing: boolean
  block: boolean
}

export function parseFile(raw: any): ParsedFile | null {
  if (!raw || !Array.isArray(raw) || raw.length === 0) return null
  const f = raw[0]
  return {
    src: f.publicUrl || f.url,
    mime: f.mimeType || f.properties?.mimeType,
    alt: f.properties?.alternative || f.title || '',
    width: f.properties?.width,
    height: f.properties?.height
  }
}

export function parseButtons(raw: any[] | undefined): ParsedButton[] {
  return (raw || []).map((btn: any) => {
    const b = btn.content || btn
    return {
      label: b.label,
      to: b.to?.url || b.to || undefined,
      target: b.target || undefined,
      color: unwrapSelect(b.color, 'primary'),
      variant: unwrapSelect(b.variant, 'solid'),
      // Field identifier is `button_size` in the YAML schemas — `size` itself
      // is reserved by content-blocks (TCA input width attribute) and would
      // be silently dropped from the DB column list. Fall back to `b.size`
      // for any legacy seeds that still emit the old key.
      size: unwrapSelect(b.button_size ?? b.size, 'md'),
      icon: b.icon || undefined,
      leading: b.leading === '1' || b.leading === true,
      trailing: b.trailing === '1' || b.trailing === true,
      block: b.block === '1' || b.block === true
    }
  })
}

export function asBool(v: any): boolean {
  return v === '1' || v === 1 || v === true
}
