import type { CacheStrategy } from '../../shared/types.js'

export interface StrategyOptions {
  cacheName?: string
  maxAge?: number
  maxEntries?: number
  networkTimeoutSeconds?: number
}

/**
 * Generate the JS code for a caching strategy function.
 */
export function generateStrategyCode(strategy: CacheStrategy, options: StrategyOptions = {}): string {
  switch (strategy) {
    case 'CacheFirst':
      return cacheFirst(options)
    case 'NetworkFirst':
      return networkFirst(options)
    case 'StaleWhileRevalidate':
      return staleWhileRevalidate(options)
    case 'NetworkOnly':
      return networkOnly()
    case 'CacheOnly':
      return cacheOnly(options)
  }
}

function cacheFirst(opts: StrategyOptions): string {
  const cacheName = opts.cacheName || 'runtime-cache'
  return `
async function cacheFirst_${sanitize(cacheName)}(request) {
  const cache = await caches.open('${cacheName}');
  const cached = await cache.match(request);
  if (cached) {
    ${opts.maxAge ? `if (!isExpired(cached, ${opts.maxAge})) return cached;` : 'return cached;'}
  }
  try {
    const response = await fetch(request);
    if (response.ok) {
      const clone = response.clone();
      ${opts.maxAge ? `const headers = new Headers(clone.headers); headers.set('sw-cache-time', Date.now().toString());` : ''}
      await cache.put(request, ${opts.maxAge ? `new Response(await clone.blob(), { headers })` : 'clone'});
      ${opts.maxEntries ? `await trimCache('${cacheName}', ${opts.maxEntries});` : ''}
    }
    return response;
  } catch {
    ${opts.maxAge ? 'if (cached) return cached;' : ''}
    return new Response('Network error', { status: 408 });
  }
}`
}

function networkFirst(opts: StrategyOptions): string {
  const cacheName = opts.cacheName || 'runtime-cache'
  const timeout = opts.networkTimeoutSeconds || 3
  return `
async function networkFirst_${sanitize(cacheName)}(request) {
  const cache = await caches.open('${cacheName}');
  try {
    const response = await Promise.race([
      fetch(request),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ${timeout * 1000}))
    ]);
    if (response.ok) {
      await cache.put(request, response.clone());
      ${opts.maxEntries ? `await trimCache('${cacheName}', ${opts.maxEntries});` : ''}
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response('Network error', { status: 408 });
  }
}`
}

function staleWhileRevalidate(opts: StrategyOptions): string {
  const cacheName = opts.cacheName || 'runtime-cache'
  return `
async function staleWhileRevalidate_${sanitize(cacheName)}(request) {
  const cache = await caches.open('${cacheName}');
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
      ${opts.maxEntries ? `trimCache('${cacheName}', ${opts.maxEntries});` : ''}
    }
    return response;
  }).catch(() => cached);
  return cached || fetchPromise;
}`
}

function networkOnly(): string {
  return `
async function networkOnly(request) {
  return fetch(request);
}`
}

function cacheOnly(opts: StrategyOptions): string {
  const cacheName = opts.cacheName || 'runtime-cache'
  return `
async function cacheOnly_${sanitize(cacheName)}(request) {
  const cache = await caches.open('${cacheName}');
  const cached = await cache.match(request);
  return cached || new Response('Not found in cache', { status: 404 });
}`
}

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, '_')
}
