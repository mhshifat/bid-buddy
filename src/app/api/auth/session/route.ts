/**
 * GET /api/auth/session
 *
 * Returns the current authenticated user and session metadata.
 * Used by the client-side AuthProvider to hydrate auth state.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "@/server/auth/get-session";
import { generateCorrelationId } from "@/server/lib/correlation-id";

export async function GET(): Promise<NextResponse> {
  const sessionData = await getServerSession();

  if (!sessionData) {
    const correlationId = generateCorrelationId();
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Not authenticated",
          correlationId,
        },
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      user: sessionData.user,
      session: {
        expiresAt: sessionData.session.expiresAt,
      },
    },
  });
}

