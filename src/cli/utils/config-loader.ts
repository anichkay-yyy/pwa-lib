import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { createJiti } from 'jiti'
import { defu } from 'defu'
import type { PwaConfig, ResolvedPwaConfig } from '../../shared/types.js'
import { DEFAULT_CONFIG, ICON_SEARCH_PATHS } from '../../shared/defaults.js'

const CONFIG_FILES = [
  'pwa.config.ts',
  'pwa.config.js',
  'pwa.config.mjs',
]

/**
 * Find and load the pwa config file, merge with defaults.
 */
export async function loadConfig(cwd: string = process.cwd()): Promise<ResolvedPwaConfig> {
  const userConfig = await loadUserConfig(cwd)
  const pkgInfo = await loadPackageJson(cwd)

  // Build defaults from package.json
  const pkgDefaults: Partial<PwaConfig> = {}
  if (pkgInfo) {
    pkgDefaults.manifest = {
      name: pkgInfo.name,
      short_name: pkgInfo.name,
      description: pkgInfo.description,
    }
  }

  // Merge: user config > pkg defaults > static defaults
  const merged = defu(userConfig, pkgDefaults, DEFAULT_CONFIG) as ResolvedPwaConfig

  // Auto-detect icon if not set
  if (!merged.icon) {
    merged.icon = findIcon(cwd)
  }

  return merged
}

async function loadUserConfig(cwd: string): Promise<PwaConfig | null> {
  for (const file of CONFIG_FILES) {
    const filePath = resolve(cwd, file)
    if (existsSync(filePath)) {
      const jiti = createJiti(cwd, { interopDefault: true })
      const mod = await jiti.import(filePath) as PwaConfig | { default: PwaConfig }
      // Handle both default export and direct export
      if (mod && typeof mod === 'object' && 'default' in mod) {
        return mod.default as PwaConfig
      }
      return mod as PwaConfig
    }
  }
  return null
}

async function loadPackageJson(cwd: string): Promise<{ name?: string; description?: string } | null> {
  const pkgPath = join(cwd, 'package.json')
  if (!existsSync(pkgPath)) return null
  try {
    const content = await readFile(pkgPath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

function findIcon(cwd: string): string | null {
  for (const searchPath of ICON_SEARCH_PATHS) {
    const fullPath = resolve(cwd, searchPath)
    if (existsSync(fullPath)) {
      return fullPath
    }
  }
  return null
}
