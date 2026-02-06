import type { IconEntry } from '../../shared/types.js'

export const ICON_SIZES: IconEntry[] = [
  { size: 16, name: 'icon-16.png' },
  { size: 32, name: 'icon-32.png' },
  { size: 48, name: 'icon-48.png' },
  { size: 72, name: 'icon-72.png' },
  { size: 96, name: 'icon-96.png' },
  { size: 128, name: 'icon-128.png' },
  { size: 144, name: 'icon-144.png' },
  { size: 152, name: 'icon-152.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 192, name: 'icon-192.png' },
  { size: 384, name: 'icon-384.png' },
  { size: 512, name: 'icon-512.png' },
]

export const MASKABLE_ICON: IconEntry = {
  size: 512,
  name: 'icon-512-maskable.png',
  purpose: 'maskable',
}

/** Sizes embedded into favicon.ico */
export const FAVICON_SIZES = [16, 32, 48]
