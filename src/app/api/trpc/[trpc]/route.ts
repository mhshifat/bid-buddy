import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/api/root";
import { createTrpcContext } from "@/server/api/trpc";

/** So the extension can call the API with credentials and get the logged-in user's data. */
function addExtensionCorsIfNeeded(req: Request, res: Response): Response {
  const origin = req.headers.get("origin");
  if (!origin?.startsWith("chrome-extension://")) return res;
  const headers = new Headers(res.headers);
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Credentials", "true");
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}

async function handler(req: Request): Promise<Response> {
  const res = await fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: createTrpcContext,
  });
  return addExtensionCorsIfNeeded(req, res);
}

export async function GET(req: Request) {
  return handler(req);
}

export async function POST(req: Request) {
  return handler(req);
}

/** Preflight for extension requests with credentials. */
export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin?.startsWith("chrome-extension://")) {
    return new Response(null, { status: 204 });
  }
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}

