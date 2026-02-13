/**
 * tRPC server initialization.
 * This file sets up the tRPC context, middleware, and procedure types.
 */

import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { prisma } from "@/server/db/prisma";
import { logger } from "@/server/lib/logger";
import { generateCorrelationId } from "@/server/lib/correlation-id";
import { AppError } from "@/server/lib/errors";
import { getServerSession } from "@/server/auth/get-session";

/**
 * Context type - available in all tRPC procedures.
 */
export interface TrpcContext {
  prisma: typeof prisma;
  correlationId: string;
  userId: string | null;
  tenantId: string | null;
  userRole: string | null;
}

/**
 * Creates the tRPC context for each request.
 * Reads the session cookie and populates auth fields.
 */
export async function createTrpcContext(opts?: {
  req: Request;
  resHeaders: Headers;
}): Promise<TrpcContext> {
  void opts; // opts available for future use (e.g., IP extraction)

  const correlationId = generateCorrelationId();

  let userId: string | null = null;
  let tenantId: string | null = null;
  let userRole: string | null = null;

  try {
    const sessionData = await getServerSession();
    if (sessionData) {
      userId = sessionData.user.id;
      tenantId = sessionData.user.tenantId;
      userRole = sessionData.user.role;
    }
  } catch (error) {
    logger.warn("Failed to extract session in tRPC context", {
      correlationId,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return {
    prisma,
    correlationId,
    userId,
    tenantId,
    userRole,
  };
}

/**
 * Initialize tRPC with superjson transformer for proper serialization.
 */
const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    const cause = error.cause;
    const isAppError = cause instanceof AppError;
    const isZodError = cause instanceof ZodError;

    return {
      ...shape,
      data: {
        ...shape.data,
        correlationId: isAppError ? cause.correlationId : undefined,
        zodError: isZodError ? cause.flatten() : null,
        userMessage: isAppError
          ? cause.userMessage
          : "An unexpected error occurred. Please try again.",
      },
    };
  },
});

/**
 * Logging middleware - logs all procedure calls.
 */
const loggerMiddleware = t.middleware(async ({ path, type, next, ctx }) => {
  const start = Date.now();

  logger.info(`tRPC ${type} starting: ${path}`, {
    correlationId: ctx.correlationId,
    userId: ctx.userId ?? undefined,
    tenantId: ctx.tenantId ?? undefined,
  });

  const result = await next();

  const duration = Date.now() - start;

  if (result.ok) {
    logger.info(`tRPC ${type} completed: ${path} (${duration}ms)`, {
      correlationId: ctx.correlationId,
    });
  } else {
    logger.error(
      `tRPC ${type} failed: ${path} (${duration}ms)`,
      result.error instanceof Error ? result.error : undefined,
      { correlationId: ctx.correlationId }
    );
  }

  return result;
});

/**
 * Auth middleware - ensures user is authenticated.
 */
const authMiddleware = t.middleware(async ({ ctx, next }) => {
  if (!ctx.userId || !ctx.tenantId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be signed in to perform this action.",
    });
  }

  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
      tenantId: ctx.tenantId,
    },
  });
});

/**
 * Role-based access middleware factory.
 */
export function requireRole(...roles: string[]) {
  return t.middleware(async ({ ctx, next }) => {
    if (!ctx.userRole || !roles.includes(ctx.userRole)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have permission to perform this action.",
      });
    }
    return next();
  });
}

/**
 * Exported tRPC helpers.
 */
export const createRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

/**
 * Public procedure - no auth required, but has logging.
 */
export const publicProcedure = t.procedure.use(loggerMiddleware);

/**
 * Protected procedure - requires authentication.
 */
export const protectedProcedure = t.procedure
  .use(loggerMiddleware)
  .use(authMiddleware);
