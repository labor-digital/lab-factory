import { file } from './toContent'

export function placeholderImage(seed: string | number, width = 1600, height = 900, alt = 'Placeholder') {
  return file(`https://picsum.photos/seed/${seed}/${width}/${height}`, {
    alt,
    width,
    height,
    mime: 'image/jpeg'
  })
}

export const sampleImages = {
  hero: (seed: string) => placeholderImage(`hero-${seed}`, 1920, 1080, 'Hero image'),
  section: (seed: string) => placeholderImage(`section-${seed}`, 1200, 800, 'Section image'),
  portrait: (seed: string) => placeholderImage(`portrait-${seed}`, 800, 1200, 'Portrait image')
}
