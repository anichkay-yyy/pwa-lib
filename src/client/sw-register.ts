import type { SwRegisterOptions } from './types.js'

/**
 * Register a service worker and handle lifecycle events.
 */
export async function registerSW(
  swUrl: string = '/sw.js',
  options: SwRegisterOptions = {},
): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Workers are not supported in this browser')
  }

  try {
    const registration = await navigator.serviceWorker.register(swUrl, { scope: '/' })

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (!newWorker) return

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'activated') {
          if (navigator.serviceWorker.controller) {
            // Updated SW, not first install
            options.onUpdate?.(registration)
          } else {
            options.onReady?.(registration)
          }
        }
      })
    })

    // If SW is already active
    if (registration.active) {
      options.onReady?.(registration)
    }

    return registration
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err))
    options.onError?.(error)
    throw error
  }
}
