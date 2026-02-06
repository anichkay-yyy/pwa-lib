/**
 * Generate precache block for the Service Worker.
 */
export function generatePrecache(urls: string[]): string {
  if (urls.length === 0) {
    return `const PRECACHE_NAME = 'precache-v1';
const PRECACHE_URLS = [];
`
  }

  const urlList = urls.map(u => `  '${u}'`).join(',\n')

  return `const PRECACHE_NAME = 'precache-v1';
const PRECACHE_URLS = [
${urlList}
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PRECACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
});
`
}
