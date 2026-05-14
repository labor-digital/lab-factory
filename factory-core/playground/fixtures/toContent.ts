// Helpers that wrap plain playground values into the TYPO3-headless JSON shape
// consumed by BaseHero / BaseSection / etc. via parseContent.ts.
//
// - TYPO3 Select fields arrive as single-element arrays: ['primary']
// - Booleans arrive as '1' / '0' strings
// - File fields arrive as arrays with publicUrl + properties

export function select(value: string | undefined | null): string[] | undefined {
  if (value === undefined || value === null || value === '') return undefined
  return [value]
}

export function bool(v: boolean): '1' | '0' {
  return v ? '1' : '0'
}

export interface FileMeta {
  alt?: string
  width?: number
  height?: number
  mime?: string
}

export function file(publicUrl: string | null | undefined, meta: FileMeta = {}): any[] | undefined {
  if (!publicUrl) return undefined
  return [
    {
      publicUrl,
      mimeType: meta.mime,
      properties: {
        alternative: meta.alt || '',
        width: meta.width,
        height: meta.height,
        mimeType: meta.mime
      }
    }
  ]
}

// Wrap a plain value object as a TYPO3 "child" entry: [{ content: {...} }]
export function child(values: Record<string, any>): { content: Record<string, any> } {
  return { content: values }
}
