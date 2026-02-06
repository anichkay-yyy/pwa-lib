import { defineCommand } from 'citty'
import { resolve } from 'node:path'
import { generateIcons } from '../../core/icons/generator.js'
import { loadConfig } from '../utils/config-loader.js'
import { success, error, info } from '../utils/logger.js'

export const iconsCommand = defineCommand({
  meta: {
    name: 'icons',
    description: 'Generate PWA icons from a source image',
  },
  args: {
    input: {
      type: 'string',
      alias: 'i',
      description: 'Path to source icon (>=512x512)',
    },
    output: {
      type: 'string',
      alias: 'o',
      description: 'Output directory for icons',
    },
  },
  async run({ args }) {
    const cwd = process.cwd()
    const config = await loadConfig(cwd)

    const input = args.input ? resolve(cwd, args.input) : config.icon
    const outDir = args.output ? resolve(cwd, args.output) : resolve(cwd, config.outDir)

    if (!input) {
      error('No source icon found. Provide --input or set icon in pwa.config.ts')
      process.exit(1)
    }

    info(`Generating icons from ${input}...`)

    try {
      const results = await generateIcons({ input, outDir })
      success(`Generated ${results.length} icons + favicon.ico in ${outDir}`)
    } catch (err) {
      error(`Failed to generate icons: ${err instanceof Error ? err.message : err}`)
      process.exit(1)
    }
  },
})
