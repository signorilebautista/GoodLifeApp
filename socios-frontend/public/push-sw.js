// Cargado por el service worker autogenerado de Workbox vía workbox.importScripts
// (ver vite.config.ts). Corre en el mismo scope global del SW: agregar listeners con
// addEventListener no pisa los que Workbox instala para el cacheo de assets.

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'GoodLife', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'GoodLife';
  const options = {
    body: data.body || '',
    icon: '/app/pwa-192x192.png',
    badge: '/app/pwa-192x192.png',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/app/') && 'focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('/app/');
    }),
  );
});
