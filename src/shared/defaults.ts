import type { ResolvedPwaConfig, RouteConfig } from './types.js'

export const DEFAULT_ROUTES: RouteConfig[] = [
  {
    match: '/api/**',
    strategy: 'NetworkFirst',
    cache: 'api-cache',
    maxAge: 60 * 5,
  },
  {
    match: '*.{png,jpg,jpeg,gif,svg,webp,ico}',
    strategy: 'CacheFirst',
    cache: 'images',
    maxAge: 60 * 60 * 24 * 30,
    maxEntries: 100,
  },
  {
    match: '*.{woff,woff2,ttf,eot}',
    strategy: 'CacheFirst',
    cache: 'fonts',
    maxAge: 60 * 60 * 24 * 365,
  },
  {
    match: '/**',
    strategy: 'StaleWhileRevalidate',
  },
]

/** File names to search when auto-detecting a source icon */
export const ICON_SEARCH_PATHS = [
  'icon.png',
  'logo.png',
  'favicon.png',
  'app-icon.png',
  'src/assets/icon.png',
  'src/assets/logo.png',
  'assets/icon.png',
  'assets/logo.png',
  'public/icon.png',
  'public/logo.png',
]

export const DEFAULT_CONFIG: ResolvedPwaConfig = {
  icon: null,
  manifest: {
    name: 'My PWA',
    short_name: 'PWA',
    description: '',
    theme_color: '#ffffff',
    background_color: '#ffffff',
    display: 'standalone',
    start_url: '/',
    scope: '/',
    lang: 'en',
    orientation: 'any',
  },
  sw: {
    output: './public/sw.js',
    precache: [],
    routes: DEFAULT_ROUTES,
  },
  notifications: {
    enabled: true,
    defaultIcon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    vapidPublicKey: '',
    serverUrl: '',
    appId: '',
    apiKey: '',
  },
  outDir: './public/icons',
}
