export interface SwRegisterOptions {
  /** Called when a new SW update is available */
  onUpdate?: (registration: ServiceWorkerRegistration) => void
  /** Called when SW is active and ready */
  onReady?: (registration: ServiceWorkerRegistration) => void
  /** Called on registration error */
  onError?: (error: Error) => void
}

export interface SubscribeOptions {
  /** VAPID public key for push subscription */
  applicationServerKey: string
}

export interface NotificationsApi {
  /** Check if push notifications are supported */
  isSupported: () => boolean
  /** Request notification permission */
  requestPermission: () => Promise<NotificationPermission>
  /** Subscribe to push notifications */
  subscribe: (options: SubscribeOptions) => Promise<PushSubscription>
  /** Get current push subscription */
  getSubscription: () => Promise<PushSubscription | null>
  /** Unsubscribe from push notifications */
  unsubscribe: () => Promise<boolean>
}
