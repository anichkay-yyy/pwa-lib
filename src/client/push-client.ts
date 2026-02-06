import { notifications } from './notifications.js'
import type { PushClientConfig, PushClient, PushSubscriptionData, PushClientErrorCode } from './push-client.types.js'

export class PushClientError extends Error {
  readonly code: PushClientErrorCode

  constructor(code: PushClientErrorCode, message: string) {
    super(message)
    this.name = 'PushClientError'
    this.code = code
  }
}

/**
 * Create a high-level push client that handles the full subscribe/unsubscribe flow
 * with a push server.
 */
export function createPushClient(config: PushClientConfig): PushClient {
  const { appId, apiKey } = config
  const serverUrl = config.serverUrl.replace(/\/+$/, '')

  async function serverFetch(path: string, options?: RequestInit): Promise<Response> {
    const url = `${serverUrl}${path}`
    let response: Response
    try {
      response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
          ...options?.headers,
        },
      })
    } catch {
      throw new PushClientError('NETWORK_ERROR', `Network request to ${url} failed`)
    }
    return response
  }

  async function fetchVapidPublicKey(): Promise<string> {
    const response = await serverFetch(`/apps/${appId}/vapid-key`)
    if (!response.ok) {
      throw new PushClientError('VAPID_FETCH_FAILED', `Failed to fetch VAPID key: ${response.status} ${response.statusText}`)
    }
    const data = await response.json() as { publicKey: string }
    return data.publicKey
  }

  function extractSubscriptionData(subscription: PushSubscription): PushSubscriptionData {
    const json = subscription.toJSON()
    return {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: json.keys!['p256dh']!,
        auth: json.keys!['auth']!,
      },
    }
  }

  async function serverSubscribe(subscriptionData: PushSubscriptionData): Promise<void> {
    const response = await serverFetch(`/apps/${appId}/subscriptions`, {
      method: 'POST',
      body: JSON.stringify(subscriptionData),
    })
    if (!response.ok) {
      throw new PushClientError('SERVER_SUBSCRIBE_FAILED', `Failed to send subscription to server: ${response.status} ${response.statusText}`)
    }
  }

  async function serverUnsubscribe(endpoint: string): Promise<void> {
    const response = await serverFetch(`/apps/${appId}/subscriptions`, {
      method: 'DELETE',
      body: JSON.stringify({ endpoint }),
    })
    if (!response.ok) {
      throw new PushClientError('SERVER_UNSUBSCRIBE_FAILED', `Failed to remove subscription on server: ${response.status} ${response.statusText}`)
    }
  }

  return {
    async subscribe(): Promise<PushSubscriptionData> {
      if (!notifications.isSupported()) {
        throw new PushClientError('NOT_SUPPORTED', 'Push notifications are not supported in this browser')
      }

      const permission = await notifications.requestPermission()
      if (permission !== 'granted') {
        throw new PushClientError('PERMISSION_DENIED', `Notification permission was ${permission}`)
      }

      const vapidKey = await fetchVapidPublicKey()

      let subscription: PushSubscription
      try {
        subscription = await notifications.subscribe({ applicationServerKey: vapidKey })
      } catch {
        throw new PushClientError('SUBSCRIBE_FAILED', 'Failed to subscribe via PushManager')
      }

      const subscriptionData = extractSubscriptionData(subscription)
      await serverSubscribe(subscriptionData)

      return subscriptionData
    },

    async unsubscribe(): Promise<void> {
      const subscription = await notifications.getSubscription()
      if (!subscription) return

      await serverUnsubscribe(subscription.endpoint)

      try {
        await subscription.unsubscribe()
      } catch {
        throw new PushClientError('UNSUBSCRIBE_FAILED', 'Failed to unsubscribe in browser')
      }
    },

    async getSubscriberCount(): Promise<number> {
      const response = await serverFetch(`/apps/${appId}/subscriber-count`)
      if (!response.ok) {
        throw new PushClientError('NETWORK_ERROR', `Failed to fetch subscriber count: ${response.status} ${response.statusText}`)
      }
      const data = await response.json() as { count: number }
      return data.count
    },
  }
}
