import { defineCommand, runMain } from 'citty'
import { initCommand } from './commands/init.js'
import { generateCommand } from './commands/generate.js'
import { iconsCommand } from './commands/icons.js'
import { devCommand } from './commands/dev.js'

const main = defineCommand({
  meta: {
    name: 'pwa-lib',
    version: '0.1.0',
    description: 'Zero-config CLI for full PWA management',
  },
  subCommands: {
    init: initCommand,
    generate: generateCommand,
    icons: iconsCommand,
    dev: devCommand,
  },
})

runMain(main)
