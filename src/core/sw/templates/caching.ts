import type { RouteConfig } from '../../../shared/types.js'
import { generateStrategyCode } from '../strategies.js'

/**
 * Generate the runtime caching block with fetch event listener.
 */
export function generateCachingBlock(routes: RouteConfig[]): string {
  // Collect unique strategy functions
  const strategyFns = new Set<string>()
  const routeHandlers: string[] = []

  for (const route of routes) {
    const cacheName = route.cache || `rt-${route.strategy.toLowerCase()}`
    const fnName = getFnName(route.strategy, cacheName)

    const code = generateStrategyCode(route.strategy, {
      cacheName,
      maxAge: route.maxAge,
      maxEntries: route.maxEntries,
    })

    strategyFns.add(code)

    routeHandlers.push(
      `  if (matchRoute('${route.match}', url)) { event.respondWith(${fnName}(event.request)); return; }`
    )
  }

  return `
// --- Utility functions ---
function matchRoute(pattern, url) {
  const path = new URL(url).pathname;
  // Convert glob pattern to regex
  const regexStr = '^' + pattern
    .replace(/\\*\\*/g, '§DOUBLESTAR§')
    .replace(/\\*/g, '[^/]*')
    .replace(/§DOUBLESTAR§/g, '.*')
    .replace(/\\{([^}]+)\\}/g, (_, exts) => '(' + exts.split(',').join('|') + ')')
    + '$';
  return new RegExp(regexStr).test(path);
}

function isExpired(response, maxAgeSec) {
  const cacheTime = response.headers.get('sw-cache-time');
  if (!cacheTime) return false;
  return (Date.now() - Number(cacheTime)) > maxAgeSec * 1000;
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    for (let i = 0; i < keys.length - maxEntries; i++) {
      await cache.delete(keys[i]);
    }
  }
}

// --- Strategy implementations ---
${Array.from(strategyFns).join('\n')}

// --- Fetch handler ---
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip chrome-extension and other non-http schemes
  if (!url.startsWith('http')) return;

${routeHandlers.join('\n')}
});
`
}

function getFnName(strategy: string, cacheName: string): string {
  const sanitized = cacheName.replace(/[^a-zA-Z0-9]/g, '_')
  switch (strategy) {
    case 'NetworkOnly': return 'networkOnly'
    default: return `${strategy.charAt(0).toLowerCase() + strategy.slice(1)}_${sanitized}`
  }
}
