import type { NotificationsApi, SubscribeOptions } from './types.js'

/**
 * Push notifications client API.
 */
export const notifications: NotificationsApi = {
  isSupported(): boolean {
    return 'Notification' in globalThis && 'PushManager' in globalThis && 'serviceWorker' in navigator
  },

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in globalThis)) {
      throw new Error('Notifications are not supported')
    }
    return Notification.requestPermission()
  },

  async subscribe(options: SubscribeOptions): Promise<PushSubscription> {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(options.applicationServerKey).buffer as ArrayBuffer,
    })
    return subscription
  },

  async getSubscription(): Promise<PushSubscription | null> {
    const registration = await navigator.serviceWorker.ready
    return registration.pushManager.getSubscription()
  },

  async unsubscribe(): Promise<boolean> {
    const subscription = await this.getSubscription()
    if (!subscription) return false
    return subscription.unsubscribe()
  },
}

/**
 * Convert a VAPID base64 key to Uint8Array for PushManager.subscribe().
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
