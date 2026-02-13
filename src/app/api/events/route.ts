/**
 * SSE (Server-Sent Events) API route.
 *
 * Streams real-time events to the client. Supports:
 * - Tenant-scoped filtering via query param
 * - Heartbeat every 30s to keep connection alive
 * - Automatic cleanup on disconnect
 *
 * Usage: GET /api/events?tenantId=xxx
 */

import { eventBus } from "@/server/events";
import type { RealtimeEvent } from "@/server/events";
import { logger } from "@/server/lib/logger";
import { v4 as uuidv4 } from "uuid";

/** Heartbeat interval in ms (keeps connection alive through proxies) */
const HEARTBEAT_INTERVAL_MS = 30_000;

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const tenantId = url.searchParams.get("tenantId") ?? undefined;
  const connectionId = uuidv4().slice(0, 8);

  logger.info(`SSE connection opened: ${connectionId}`, { tenantId });

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Helper: write an SSE message
      function sendEvent(event: RealtimeEvent): void {
        try {
          const sseMessage = formatSseMessage(event.event, event);
          controller.enqueue(encoder.encode(sseMessage));
        } catch {
          // Controller may be closed
        }
      }

      // Helper: write a heartbeat comment
      function sendHeartbeat(): void {
        try {
          const heartbeatEvent: RealtimeEvent<"system:heartbeat"> = {
            id: uuidv4(),
            event: "system:heartbeat",
            data: { timestamp: new Date().toISOString() },
            timestamp: new Date().toISOString(),
          };
          const sseMessage = formatSseMessage("system:heartbeat", heartbeatEvent);
          controller.enqueue(encoder.encode(sseMessage));
        } catch {
          // Controller may be closed
        }
      }

      // Send initial connected event
      const connectedEvent: RealtimeEvent<"system:connected"> = {
        id: uuidv4(),
        event: "system:connected",
        data: {
          connectedAt: new Date().toISOString(),
          serverVersion: "0.1.0",
        },
        timestamp: new Date().toISOString(),
      };
      sendEvent(connectedEvent);

      // Subscribe to the event bus
      const unsubscribe = eventBus.subscribe((event) => {
        sendEvent(event);
      }, tenantId);

      // Heartbeat timer
      const heartbeatTimer = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

      // Handle client disconnect via AbortSignal
      request.signal.addEventListener("abort", () => {
        logger.info(`SSE connection closed: ${connectionId}`, { tenantId });
        unsubscribe();
        clearInterval(heartbeatTimer);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Nginx: disable buffering
      "Access-Control-Allow-Origin": "*",
    },
  });
}

/**
 * Format an event into the SSE wire protocol.
 *
 * Format:
 *   event: <event-name>\n
 *   id: <event-id>\n
 *   data: <json-payload>\n
 *   \n
 */
function formatSseMessage(eventName: string, payload: RealtimeEvent): string {
  const data = JSON.stringify(payload);
  return `event: ${eventName}\nid: ${payload.id}\ndata: ${data}\n\n`;
}

