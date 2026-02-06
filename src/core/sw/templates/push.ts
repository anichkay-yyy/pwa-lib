import type { NotificationsConfig } from '../../../shared/types.js'

/**
 * Generate push notification handler block for the SW.
 */
export function generatePushHandler(config: NotificationsConfig): string {
  return `
// --- Push notifications ---
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'Notification', body: event.data.text() };
  }

  const options = {
    body: data.body || '',
    icon: data.icon || '${config.defaultIcon || '/icons/icon-192.png'}',
    badge: data.badge || '${config.badge || '/icons/badge-72.png'}',
    data: data.data || {},
    actions: data.actions || [],
    tag: data.tag || undefined,
    renotify: data.renotify || false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Notification', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      // Focus existing window if available
      for (const client of clients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      return self.clients.openWindow(url);
    })
  );
});
`
}
