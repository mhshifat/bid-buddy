/**
 * Event Bus — Strategy / Adapter pattern.
 *
 * Currently uses in-process Node.js EventEmitter.
 * Can be swapped to Redis Pub/Sub, NATS, or RabbitMQ
 * by implementing the EventBusAdapter interface.
 *
 * The singleton `eventBus` is the only thing consumers import.
 */

import { EventEmitter } from "events";
import { v4 as uuidv4 } from "uuid";
import { logger } from "@/server/lib/logger";
import type { EventMap, EventName, RealtimeEvent } from "./types";

// ============================================================================
// Adapter Interface (Strategy pattern)
// ============================================================================

export interface EventBusAdapter {
  publish<T extends EventName>(event: T, data: EventMap[T], tenantId?: string): void;
  subscribe(callback: (event: RealtimeEvent) => void): () => void;
  destroy(): void;
}

// ============================================================================
// In-Memory Adapter (default — uses Node EventEmitter)
// ============================================================================

const INTERNAL_EVENT = "__realtime_event__";

class InMemoryEventBusAdapter implements EventBusAdapter {
  private emitter: EventEmitter;

  constructor() {
    this.emitter = new EventEmitter();
    // Allow many SSE connections
    this.emitter.setMaxListeners(200);
  }

  publish<T extends EventName>(event: T, data: EventMap[T], tenantId?: string): void {
    const realtimeEvent: RealtimeEvent<T> = {
      id: uuidv4(),
      event,
      data,
      timestamp: new Date().toISOString(),
      tenantId,
    };

    logger.debug(`EventBus publish: ${event}`, {
      tenantId,
    });

    this.emitter.emit(INTERNAL_EVENT, realtimeEvent);
  }

  subscribe(callback: (event: RealtimeEvent) => void): () => void {
    const handler = (evt: RealtimeEvent) => {
      callback(evt);
    };

    this.emitter.on(INTERNAL_EVENT, handler);

    return () => {
      this.emitter.off(INTERNAL_EVENT, handler);
    };
  }

  destroy(): void {
    this.emitter.removeAllListeners();
  }
}

// ============================================================================
// Redis Adapter (placeholder — implement when scaling)
// ============================================================================

// export class RedisEventBusAdapter implements EventBusAdapter {
//   constructor(private redisUrl: string) {}
//   publish() { /* Redis PUBLISH */ }
//   subscribe() { /* Redis SUBSCRIBE */ return () => {}; }
//   destroy() { /* Close Redis connection */ }
// }

// ============================================================================
// EventBus Facade
// ============================================================================

class EventBus {
  private adapter: EventBusAdapter;

  constructor(adapter: EventBusAdapter) {
    this.adapter = adapter;
  }

  /**
   * Publish an event to all subscribers.
   */
  emit<T extends EventName>(event: T, data: EventMap[T], tenantId?: string): void {
    try {
      this.adapter.publish(event, data, tenantId);
    } catch (err) {
      logger.error(
        `EventBus emit failed: ${event}`,
        err instanceof Error ? err : new Error(String(err)),
      );
    }
  }

  /**
   * Subscribe to all events. Returns an unsubscribe function.
   * Optionally filter by tenantId.
   */
  subscribe(
    callback: (event: RealtimeEvent) => void,
    tenantId?: string,
  ): () => void {
    return this.adapter.subscribe((event) => {
      // Filter by tenant if specified
      if (tenantId && event.tenantId && event.tenantId !== tenantId) {
        return;
      }
      callback(event);
    });
  }

  /**
   * Swap the underlying adapter (e.g., switch from InMemory to Redis).
   */
  setAdapter(adapter: EventBusAdapter): void {
    this.adapter.destroy();
    this.adapter = adapter;
  }

  destroy(): void {
    this.adapter.destroy();
  }
}

// ============================================================================
// Singleton
// ============================================================================

const globalForEventBus = globalThis as unknown as { eventBus?: EventBus };

export const eventBus: EventBus =
  globalForEventBus.eventBus ?? new EventBus(new InMemoryEventBusAdapter());

if (process.env.NODE_ENV !== "production") {
  globalForEventBus.eventBus = eventBus;
}

