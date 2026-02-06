import { defineCommand } from 'citty'
import { watch } from 'node:fs'
import { resolve } from 'node:path'
import { buildServiceWorker } from '../../core/sw/builder.js'
import { loadConfig } from '../utils/config-loader.js'
import { success, error, info } from '../utils/logger.js'

export const devCommand = defineCommand({
  meta: {
    name: 'dev',
    description: 'Watch mode — regenerate SW on config/source changes',
  },
  args: {},
  async run() {
    const cwd = process.cwd()
    info('Starting watch mode...')

    // Initial build
    await rebuild(cwd)

    // Watch config files
    const watchPaths = [
      'pwa.config.ts',
      'pwa.config.js',
      'pwa.config.mjs',
    ]

    let debounceTimer: ReturnType<typeof setTimeout> | null = null

    for (const file of watchPaths) {
      const fullPath = resolve(cwd, file)
      try {
        watch(fullPath, () => {
          if (debounceTimer) clearTimeout(debounceTimer)
          debounceTimer = setTimeout(() => rebuild(cwd), 300)
        })
        info(`Watching ${file}`)
      } catch {
        // File doesn't exist, skip
      }
    }

    // Watch public dir for precache changes
    try {
      const publicDir = resolve(cwd, 'public')
      watch(publicDir, { recursive: true }, () => {
        if (debounceTimer) clearTimeout(debounceTimer)
        debounceTimer = setTimeout(() => rebuild(cwd), 500)
      })
      info('Watching public/ directory')
    } catch {
      // public dir doesn't exist
    }

    info('Watching for changes... (Ctrl+C to stop)')

    // Keep process alive
    await new Promise(() => {})
  },
})

async function rebuild(cwd: string): Promise<void> {
  try {
    const config = await loadConfig(cwd)
    const swPath = await buildServiceWorker(config, cwd)
    success(`Rebuilt ${swPath}`)
  } catch (err) {
    error(`Rebuild failed: ${err instanceof Error ? err.message : err}`)
  }
}
