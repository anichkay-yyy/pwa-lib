import { defineCommand } from 'citty'
import { existsSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { success, warn, info } from '../utils/logger.js'

const CONFIG_TEMPLATE = `// import { defineConfig } from 'pwa-lib/config'

/** @type {import('pwa-lib').PwaConfig} */
export default {
  // All options are optional — defaults work out of the box.

  // icon: './src/assets/icon.png',

  // manifest: {
  //   name: 'My App',
  //   short_name: 'App',
  //   theme_color: '#ffffff',
  //   background_color: '#ffffff',
  // },

  // sw: {
  //   output: './public/sw.js',
  //   routes: [
  //     { match: '/api/**', strategy: 'NetworkFirst', cache: 'api-cache' },
  //     { match: '*.{png,jpg,svg}', strategy: 'CacheFirst', cache: 'images' },
  //     { match: '/**', strategy: 'StaleWhileRevalidate' },
  //   ],
  // },
}
`

export const initCommand = defineCommand({
  meta: {
    name: 'init',
    description: 'Initialize PWA configuration',
  },
  args: {
    yes: {
      type: 'boolean',
      alias: 'y',
      description: 'Skip prompts and use defaults',
      default: false,
    },
  },
  async run({ args }) {
    const cwd = process.cwd()
    const configPath = resolve(cwd, 'pwa.config.ts')

    if (existsSync(configPath)) {
      warn('pwa.config.ts already exists. Skipping.')
      return
    }

    await writeFile(configPath, CONFIG_TEMPLATE, 'utf-8')
    success('Created pwa.config.ts')

    info('Next steps:')
    info('  1. Edit pwa.config.ts to customize your PWA')
    info('  2. Run `pwa-lib generate` to generate icons, manifest, and SW')
  },
})
