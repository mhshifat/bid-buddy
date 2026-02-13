/**
 * Auth tRPC Router.
 *
 * Provides session-related queries for the client:
 *   - getSession: Returns the current authenticated user's data
 */

import { createRouter, publicProcedure } from "../trpc";

export const authRouter = createRouter({
  /**
   * Returns the current user session data, or null if unauthenticated.
   * This is a public procedure because it needs to work before auth is confirmed.
   */
  getSession: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.userId || !ctx.tenantId) {
      return null;
    }

    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar_url: true,
        role: true,
        is_active: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!user || !user.is_active) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatar_url,
      role: user.role,
      isActive: user.is_active,
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug,
      },
    };
  }),
});

