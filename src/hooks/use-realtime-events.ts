"use client";

/**
 * Client-side hook for consuming SSE real-time events.
 *
 * Features:
 * - Auto-connects to the SSE endpoint
 * - Auto-reconnects on disconnect with exponential backoff
 * - Typed event handling
 * - Connection status tracking
 * - Maintains a notification history (capped)
 */

import { useState, useCallback, useRef } from "react";
import { useSyncExternalStore } from "react";
import type {
  RealtimeEvent,
  EventName,
  NotificationItem,
} from "@/server/events/types";
import { eventToNotification } from "@/server/events/types";

// ============================================================================
// Types
// ============================================================================

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

export interface UseRealtimeEventsOptions {
  /** Tenant ID for scoped events */
  tenantId?: string;
  /** Max number of notifications to keep in memory */
  maxNotifications?: number;
  /** Whether to auto-connect on mount */
  autoConnect?: boolean;
  /** Events to ignore (won't be stored in notifications) */
  ignoreEvents?: EventName[];
  /** Callback fired for every incoming event */
  onEvent?: (event: RealtimeEvent) => void;
}

interface RealtimeStore {
  status: ConnectionStatus;
  notifications: NotificationItem[];
  unreadCount: number;
  lastEvent: RealtimeEvent | null;
}

// ============================================================================
// External Store (singleton shared across components)
// ============================================================================

const DEFAULT_MAX_NOTIFICATIONS = 50;
const IGNORED_EVENTS: EventName[] = ["system:heartbeat", "system:connected"];

let eventSource: EventSource | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempt = 0;
const MAX_RECONNECT_DELAY_MS = 30_000;
const BASE_RECONNECT_DELAY_MS = 1_000;

let store: RealtimeStore = {
  status: "disconnected",
  notifications: [],
  unreadCount: 0,
  lastEvent: null,
};

let listeners: Array<() => void> = [];
let eventCallbacks: Array<(event: RealtimeEvent) => void> = [];
let currentTenantId: string | undefined;
let maxNotifications = DEFAULT_MAX_NOTIFICATIONS;
let ignoredEvents: EventName[] = [...IGNORED_EVENTS];

function emitChange(): void {
  for (const listener of listeners) {
    listener();
  }
}

function setStore(partial: Partial<RealtimeStore>): void {
  store = { ...store, ...partial };
  emitChange();
}

function addNotification(notification: NotificationItem): void {
  const updated = [notification, ...store.notifications].slice(0, maxNotifications);
  setStore({
    notifications: updated,
    unreadCount: store.unreadCount + 1,
    lastEvent: store.lastEvent,
  });
}

function handleSseMessage(event: MessageEvent<string>): void {
  try {
    const parsed = JSON.parse(event.data) as RealtimeEvent;

    setStore({ lastEvent: parsed });

    // Fire registered callbacks
    for (const cb of eventCallbacks) {
      try {
        cb(parsed);
      } catch {
        // Don't let callback errors break the stream
      }
    }

    // Skip ignored events for notification storage
    if (ignoredEvents.includes(parsed.event)) return;

    // Convert to notification and store
    const notification = eventToNotification(parsed);
    addNotification(notification);
  } catch {
    // Malformed SSE data — ignore
  }
}

function connect(tenantId?: string): void {
  // EventSource is browser-only — bail during SSR
  if (typeof EventSource === "undefined") return;

  // Close existing connection
  disconnect();

  currentTenantId = tenantId;
  setStore({ status: "connecting" });

  const params = new URLSearchParams();
  if (tenantId) params.set("tenantId", tenantId);

  const url = `/api/events${params.toString() ? `?${params.toString()}` : ""}`;
  eventSource = new EventSource(url);

  eventSource.onopen = () => {
    reconnectAttempt = 0;
    setStore({ status: "connected" });
  };

  // Listen for all named events
  const eventNames: EventName[] = [
    "job:captured",
    "job:statusChanged",
    "ai:analysisStarted",
    "ai:analysisComplete",
    "ai:analysisFailed",
    "proposal:generated",
    "proposal:statusChanged",
    "system:connected",
    "system:heartbeat",
  ];

  for (const eventName of eventNames) {
    eventSource.addEventListener(eventName, handleSseMessage);
  }

  eventSource.onerror = () => {
    if (eventSource?.readyState === EventSource.CLOSED) {
      setStore({ status: "disconnected" });
      scheduleReconnect();
    } else {
      setStore({ status: "error" });
    }
  };
}

function disconnect(): void {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  setStore({ status: "disconnected" });
}

function scheduleReconnect(): void {
  if (reconnectTimer) return;

  const delay = Math.min(
    BASE_RECONNECT_DELAY_MS * Math.pow(2, reconnectAttempt) + Math.random() * 500,
    MAX_RECONNECT_DELAY_MS,
  );

  reconnectAttempt++;

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect(currentTenantId);
  }, delay);
}

function subscribe(listener: () => void): () => void {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot(): RealtimeStore {
  return store;
}

// Cached to satisfy React's requirement that getServerSnapshot returns a stable reference
const SERVER_SNAPSHOT: RealtimeStore = {
  status: "disconnected",
  notifications: [],
  unreadCount: 0,
  lastEvent: null,
};

function getServerSnapshot(): RealtimeStore {
  return SERVER_SNAPSHOT;
}

// ============================================================================
// Hook
// ============================================================================

export function useRealtimeEvents(options: UseRealtimeEventsOptions = {}): {
  status: ConnectionStatus;
  notifications: NotificationItem[];
  unreadCount: number;
  lastEvent: RealtimeEvent | null;
  connect: () => void;
  disconnect: () => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  clearNotifications: () => void;
} {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Configure
  maxNotifications = options.maxNotifications ?? DEFAULT_MAX_NOTIFICATIONS;
  ignoredEvents = [...IGNORED_EVENTS, ...(options.ignoreEvents ?? [])];

  // Register event callback
  const [callbackRegistered] = useState(() => {
    if (options.onEvent) {
      const cb = options.onEvent;
      eventCallbacks = [...eventCallbacks.filter((c) => c !== cb), cb];
    }
    return true;
  });
  void callbackRegistered;

  // Auto-connect
  const [autoConnected] = useState(() => {
    if (options.autoConnect !== false && store.status === "disconnected" && !eventSource) {
      connect(options.tenantId);
    }
    return true;
  });
  void autoConnected;

  const storeState = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const doConnect = useCallback(() => {
    connect(optionsRef.current.tenantId);
  }, []);

  const doDisconnect = useCallback(() => {
    disconnect();
  }, []);

  const markAllRead = useCallback(() => {
    setStore({
      notifications: store.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    });
  }, []);

  const markRead = useCallback((id: string) => {
    const updated = store.notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n,
    );
    const unread = updated.filter((n) => !n.read).length;
    setStore({ notifications: updated, unreadCount: unread });
  }, []);

  const clearNotifications = useCallback(() => {
    setStore({ notifications: [], unreadCount: 0 });
  }, []);

  return {
    status: storeState.status,
    notifications: storeState.notifications,
    unreadCount: storeState.unreadCount,
    lastEvent: storeState.lastEvent,
    connect: doConnect,
    disconnect: doDisconnect,
    markAllRead,
    markRead,
    clearNotifications,
  };
}

