import type { ResolvedPwaConfig } from '../../shared/types.js'

/**
 * Generate a runtime config object that can be injected into the SW.
 */
export function generateRuntimeConfig(config: ResolvedPwaConfig): string {
  return `
// --- Runtime config ---
const SW_CONFIG = ${JSON.stringify({
    notifications: config.notifications,
    routes: config.sw.routes.map(r => ({
      match: r.match,
      strategy: r.strategy,
      cache: r.cache,
    })),
  }, null, 2)};
`
}
