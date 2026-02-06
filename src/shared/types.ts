export type CacheStrategy =
  | 'CacheFirst'
  | 'NetworkFirst'
  | 'StaleWhileRevalidate'
  | 'NetworkOnly'
  | 'CacheOnly'

export interface RouteConfig {
  /** URL pattern to match (glob-like) */
  match: string
  /** Caching strategy */
  strategy: CacheStrategy
  /** Custom cache name */
  cache?: string
  /** Max age in seconds */
  maxAge?: number
  /** Max entries in cache */
  maxEntries?: number
}

export interface SwConfig {
  /** Output path for generated SW file */
  output?: string
  /** Glob patterns for precaching */
  precache?: string[]
  /** Route-based caching strategies */
  routes?: RouteConfig[]
}

export interface ManifestConfig {
  name?: string
  short_name?: string
  description?: string
  theme_color?: string
  background_color?: string
  display?: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser'
  start_url?: string
  scope?: string
  lang?: string
  orientation?: 'any' | 'natural' | 'landscape' | 'portrait'
}

export interface NotificationsConfig {
  /** Enable push notification handlers in generated SW (default: true) */
  enabled?: boolean
  /** Default icon for notifications */
  defaultIcon?: string
  /** Badge icon for notifications */
  badge?: string
  /** VAPID public key for push subscriptions */
  vapidPublicKey?: string
  /** Base URL of the push server (e.g. 'https://push.example.com') */
  serverUrl?: string
  /** Application identifier */
  appId?: string
  /** API key for server authentication */
  apiKey?: string
}

export interface PwaConfig {
  /** Path to source icon (auto-detected if not set) */
  icon?: string
  /** Web app manifest options */
  manifest?: ManifestConfig
  /** Service Worker configuration */
  sw?: SwConfig
  /** Push notifications configuration */
  notifications?: NotificationsConfig
  /** Output directory for generated icons */
  outDir?: string
}

export interface ResolvedPwaConfig {
  icon: string | null
  manifest: Required<ManifestConfig>
  sw: Required<SwConfig>
  notifications: Required<NotificationsConfig>
  outDir: string
}

export interface IconEntry {
  size: number
  name: string
  purpose?: 'any' | 'maskable'
}

/** Helper to define a typed config */
export function defineConfig(config: PwaConfig): PwaConfig {
  return config
}
