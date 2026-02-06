import { defineCommand } from 'citty'
import { resolve } from 'node:path'
import { generateIcons } from '../../core/icons/generator.js'
import { buildServiceWorker } from '../../core/sw/builder.js'
import { generateManifest } from '../../core/manifest/generator.js'
import { loadConfig } from '../utils/config-loader.js'
import { success, error, info, warn, box } from '../utils/logger.js'

export const generateCommand = defineCommand({
  meta: {
    name: 'generate',
    description: 'Generate icons, manifest.json, and service worker',
  },
  args: {},
  async run() {
    const cwd = process.cwd()
    const config = await loadConfig(cwd)
    const results: string[] = []

    // 1. Generate icons
    if (config.icon) {
      info('Generating icons...')
      try {
        const icons = await generateIcons({
          input: config.icon,
          outDir: resolve(cwd, config.outDir),
        })
        results.push(`Icons: ${icons.length} files`)
        success(`Generated ${icons.length} icons`)
      } catch (err) {
        error(`Icon generation failed: ${err instanceof Error ? err.message : err}`)
      }
    } else {
      warn('No source icon found — skipping icon generation')
      warn('Provide an icon.png (>=512x512) or set icon in pwa.config.ts')
    }

    // 2. Generate manifest.json
    info('Generating manifest.json...')
    try {
      const manifestPath = await generateManifest(config, cwd)
      results.push(`Manifest: ${manifestPath}`)
      success('Generated manifest.json')
    } catch (err) {
      error(`Manifest generation failed: ${err instanceof Error ? err.message : err}`)
    }

    // 3. Build Service Worker
    info('Building service worker...')
    try {
      const swPath = await buildServiceWorker(config, cwd)
      results.push(`SW: ${swPath}`)
      success(`Generated ${config.sw.output}`)
    } catch (err) {
      error(`SW generation failed: ${err instanceof Error ? err.message : err}`)
    }

    box(`PWA assets generated:\n${results.join('\n')}`)
  },
})
