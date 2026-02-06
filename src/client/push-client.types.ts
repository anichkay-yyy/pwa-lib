export type PushClientErrorCode =
  | 'NOT_SUPPORTED'
  | 'PERMISSION_DENIED'
  | 'VAPID_FETCH_FAILED'
  | 'SUBSCRIBE_FAILED'
  | 'SERVER_SUBSCRIBE_FAILED'
  | 'SERVER_UNSUBSCRIBE_FAILED'
  | 'UNSUBSCRIBE_FAILED'
  | 'NETWORK_ERROR'

export interface PushClientConfig {
  /** Base URL of the push server (e.g. 'https://push.example.com') */
  serverUrl: string
  /** Application identifier */
  appId: string
  /** API key for server authentication */
  apiKey: string
}

export interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export interface PushClient {
  /** Full subscribe flow: check support → request permission → fetch VAPID key → subscribe via PushManager → send subscription to server */
  subscribe(): Promise<PushSubscriptionData>
  /** Unsubscribe: get current subscription → remove on server → unsubscribe in browser */
  unsubscribe(): Promise<void>
  /** Get subscriber count from the server */
  getSubscriberCount(): Promise<number>
}
