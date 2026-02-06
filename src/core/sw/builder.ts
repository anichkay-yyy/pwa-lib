import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { globby } from 'globby'
import type { ResolvedPwaConfig } from '../../shared/types.js'
import { generateSwCore } from './templates/sw-core.js'
import { generatePrecache } from './templates/precache.js'
import { generateCachingBlock } from './templates/caching.js'
import { generatePushHandler } from './templates/push.js'

/**
 * Build the final sw.js file from config.
 */
export async function buildServiceWorker(config: ResolvedPwaConfig, cwd: string = process.cwd()): Promise<string> {
  const outputPath = resolve(cwd, config.sw.output)

  // Resolve precache URLs from glob patterns
  const precacheUrls = await resolvePrecacheUrls(config.sw.precache, cwd)

  // Collect all cache names
  const cacheNames = config.sw.routes
    .map(r => r.cache)
    .filter((name): name is string => !!name)

  // Build SW content from blocks
  const blocks: string[] = [
    generateSwCore(cacheNames),
    generatePrecache(precacheUrls),
    generateCachingBlock(config.sw.routes),
  ]

  if (config.notifications.enabled) {
    blocks.push(generatePushHandler(config.notifications))
  }

  const swContent = blocks.join('\n')

  // Write the file
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, swContent, 'utf-8')

  // Generate pwa-push.json if push server fields are configured
  const { serverUrl, appId, apiKey } = config.notifications
  if (serverUrl || appId || apiKey) {
    const pushConfig = {
      serverUrl,
      appId,
      apiKey,
      vapidPublicKey: config.notifications.vapidPublicKey,
    }
    const pushConfigPath = resolve(cwd, 'public/pwa-push.json')
    await writeFile(pushConfigPath, JSON.stringify(pushConfig, null, 2), 'utf-8')
  }

  return outputPath
}

/**
 * Resolve glob patterns into URL paths relative to the public dir.
 */
async function resolvePrecacheUrls(patterns: string[], cwd: string): Promise<string[]> {
  if (patterns.length === 0) return []

  const files = await globby(patterns, { cwd })

  // Convert file paths to URL paths (remove ./public prefix)
  return files.map(file => {
    return '/' + file
      .replace(/^\.\//, '')
      .replace(/^public\//, '')
  })
}
