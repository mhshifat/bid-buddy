import { v4 as uuidv4 } from "uuid";

/**
 * Generates a unique correlation ID for request tracing.
 * Format: BB-{timestamp}-{uuid-short}
 * Example: BB-1707840000-a1b2c3d4
 */
export function generateCorrelationId(): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const shortUuid = uuidv4().split("-")[0];
  return `BB-${timestamp}-${shortUuid}`;
}

/**
 * Validates a correlation ID format.
 */
export function isValidCorrelationId(id: string): boolean {
  return /^BB-\d+-[a-f0-9]{8}$/.test(id);
}

