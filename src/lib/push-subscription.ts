/**
 * Client-side Web Push subscription manager.
 *
 * Handles:
 * - Registering the Service Worker
 * - Subscribing to push notifications via the Push API
 * - Converting the subscription to a JSON-serialisable format for storage
 *
 * The VAPID public key is read from the NEXT_PUBLIC_VAPID_PUBLIC_KEY env var.
 */

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

/**
 * Convert a base64-encoded VAPID key to a Uint8Array (required by the Push API).
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Check whether push notifications are supported in this browser.
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Get the current Notification permission status.
 */
export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.permission;
}

/**
 * Register the Service Worker and subscribe to push notifications.
 *
 * Returns the push subscription as a plain JSON object (suitable for
 * persisting in the database via the tRPC mutation).
 *
 * Throws if:
 * - Push is not supported
 * - Notification permission is denied
 * - VAPID public key is missing
 */
export async function subscribeToPush(): Promise<PushSubscriptionJSON> {
  if (!isPushSupported()) {
    throw new Error("Push notifications are not supported in this browser.");
  }

  if (!VAPID_PUBLIC_KEY) {
    throw new Error(
      "VAPID public key not configured. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY in your .env.",
    );
  }

  // Request notification permission
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error(
      `Notification permission ${permission}. Please allow notifications in your browser settings.`,
    );
  }

  // Register the Service Worker
  const registration = await navigator.serviceWorker.register("/sw.js", {
    scope: "/",
  });

  // Wait for the SW to be ready
  await navigator.serviceWorker.ready;

  // Subscribe to push notifications
  const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey as BufferSource,
    });
  }

  // Convert to plain JSON (endpoint + keys)
  return subscription.toJSON();
}

/**
 * Unsubscribe from push notifications and unregister the Service Worker.
 */
export async function unsubscribeFromPush(): Promise<void> {
  if (!isPushSupported()) return;

  const registration = await navigator.serviceWorker.getRegistration("/");
  if (!registration) return;

  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    await subscription.unsubscribe();
  }
}

/**
 * Show a local desktop notification (for test purposes).
 * This uses the Notification API directly — no Service Worker needed.
 */
export function showLocalNotification(
  title: string,
  body: string,
  url?: string,
): void {
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;

  const notification = new Notification(title, {
    body,
    icon: "/favicon.ico",
    tag: "bid-buddy-test",
  });

  if (url) {
    notification.onclick = () => {
      window.focus();
      window.location.href = url;
    };
  }
}

