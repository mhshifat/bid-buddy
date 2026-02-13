/**
 * Lightweight health-check endpoint.
 * Used by the browser extension to verify the web app is running.
 * No database or auth required — just returns 200 with a timestamp.
 */
export async function GET() {
  return Response.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    app: "bid-buddy",
  });
}

