/**
 * Service Worker for Bid Buddy desktop push notifications.
 *
 * This SW receives push events from the web-push server and displays
 * native OS notifications. It also handles notification click events
 * to open/focus the relevant page.
 */

/* eslint-disable no-restricted-globals */

self.addEventListener("install", (event) => {
  // Activate immediately — don't wait for old SW to be replaced
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  // Claim all open clients immediately
  event.waitUntil(self.clients.claim());
});

/**
 * Handle incoming push notifications from the server.
 */
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = {
      title: "Bid Buddy",
      body: event.data.text() || "New notification",
    };
  }

  const title = payload.title || "Bid Buddy — Job Match!";
  const options = {
    body: payload.body || "A new Upwork job matches your criteria.",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: payload.data?.jobId || "bid-buddy-notification",
    renotify: true,
    requireInteraction: false,
    data: {
      url: payload.data?.url || "/dashboard",
      jobId: payload.data?.jobId,
      matchPercentage: payload.data?.matchPercentage,
    },
    actions: [
      { action: "view", title: "View Job" },
      { action: "dismiss", title: "Dismiss" },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

/**
 * Handle notification click — open or focus the relevant page.
 */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const targetUrl = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // If there's already an open tab, focus it and navigate
        for (const client of clientList) {
          if (client.url.includes(self.location.origin)) {
            client.focus();
            client.navigate(targetUrl);
            return;
          }
        }
        // Otherwise open a new tab
        return self.clients.openWindow(targetUrl);
      }),
  );
});


