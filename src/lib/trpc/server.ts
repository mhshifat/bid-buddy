/**
 * Server-side tRPC caller for use in Server Components.
 */

import { createTrpcContext } from "@/server/api/trpc";
import { createCaller } from "@/server/api/root";

export async function getServerTrpc() {
  const context = await createTrpcContext();
  return createCaller(context);
}

