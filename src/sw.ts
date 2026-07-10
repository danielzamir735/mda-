/// <reference lib="webworker" />

// Custom injectManifest service worker — replaces vite-plugin-pwa's generated
// generateSW output so we can add push/notificationclick handling. The
// runtimeCaching rules below are a direct translation of the previous
// `workbox.runtimeCaching` config in vite.config.ts.

import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { RangeRequestsPlugin } from 'workbox-range-requests';

declare const self: ServiceWorkerGlobalScope;

self.skipWaiting();
clientsClaim();

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
  new NavigationRoute(createHandlerBoundToURL('/index.html'), {
    denylist: [/^\/\.well-known\//],
  }),
);

registerRoute(
  ({ url }) => /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i.test(url.href),
  new CacheFirst({
    cacheName: 'google-fonts',
    plugins: [new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 })],
  }),
);

registerRoute(
  ({ url }) => /^https:\/\/.*\.supabase\.co\/.*/i.test(url.href),
  new NetworkFirst({
    cacheName: 'supabase-api',
    plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 5 })],
  }),
);

registerRoute(
  ({ url }) => /\.mp3$/i.test(url.href),
  new CacheFirst({
    cacheName: 'audio-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 * 30 }),
      new RangeRequestsPlugin(),
    ],
  }),
);

// ─── Daily Push ───────────────────────────────────────────────────────────────

interface DailyPushPayload {
  title: string;
  body: string;
  url?: string;
}

self.addEventListener('push', (event: PushEvent) => {
  let payload: DailyPushPayload = { title: 'חובש+', body: 'יש לך עדכון חדש' };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    // Non-JSON payload — fall back to defaults
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-64x64.png',
      data: { url: payload.url ?? '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  const targetUrl = (event.notification.data as { url?: string } | undefined)?.url ?? '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) return client.focus();
      }
      return self.clients.openWindow(targetUrl);
    }),
  );
});
