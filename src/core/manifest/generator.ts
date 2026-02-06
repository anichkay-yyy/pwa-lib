import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve, join } from 'node:path'
import type { ResolvedPwaConfig } from '../../shared/types.js'
import { ICON_SIZES, MASKABLE_ICON } from '../icons/sizes.js'

export interface ManifestIcon {
  src: string
  sizes: string
  type: string
  purpose: string
}

/**
 * Generate manifest.json from resolved config.
 */
export async function generateManifest(config: ResolvedPwaConfig, cwd: string = process.cwd()): Promise<string> {
  const iconsBasePath = getIconsUrlPath(config.outDir)

  const icons: ManifestIcon[] = [
    ...ICON_SIZES.map(entry => ({
      src: `${iconsBasePath}/${entry.name}`,
      sizes: `${entry.size}x${entry.size}`,
      type: 'image/png',
      purpose: entry.purpose || 'any',
    })),
    {
      src: `${iconsBasePath}/${MASKABLE_ICON.name}`,
      sizes: `${MASKABLE_ICON.size}x${MASKABLE_ICON.size}`,
      type: 'image/png',
      purpose: 'maskable',
    },
  ]

  const manifest = {
    name: config.manifest.name,
    short_name: config.manifest.short_name,
    description: config.manifest.description || undefined,
    start_url: config.manifest.start_url,
    scope: config.manifest.scope,
    display: config.manifest.display,
    theme_color: config.manifest.theme_color,
    background_color: config.manifest.background_color,
    lang: config.manifest.lang,
    orientation: config.manifest.orientation,
    icons,
  }

  // Remove undefined values
  const cleaned = JSON.parse(JSON.stringify(manifest))

  const outputDir = resolve(cwd, 'public')
  const outputPath = join(outputDir, 'manifest.json')

  await mkdir(outputDir, { recursive: true })
  await writeFile(outputPath, JSON.stringify(cleaned, null, 2), 'utf-8')

  return outputPath
}

/**
 * Convert outDir to URL path for use in manifest.
 * e.g. ./public/icons -> /icons
 */
function getIconsUrlPath(outDir: string): string {
  return '/' + outDir
    .replace(/^\.\//, '')
    .replace(/^public\//, '')
}
