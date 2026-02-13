/**
 * Client tRPC router - handles client management operations.
 */

import { z } from "zod";
import type { Client } from "@prisma/client";
import { createRouter, publicProcedure } from "../trpc";

const clientFilterSchema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
  status: z.enum(["PROSPECT", "ACTIVE", "INACTIVE", "BLOCKED"]).optional(),
  search: z.string().optional(),
  sortBy: z
    .enum(["created_at", "name", "total_spent"])
    .default("created_at"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});

type ClientWithCount = Client & {
  _count: { projects: number };
};

export const clientRouter = createRouter({
  list: publicProcedure
    .input(clientFilterSchema)
    .query(async ({ ctx, input }) => {
      const skip = (input.page - 1) * input.pageSize;

      const where: Record<string, unknown> = {};

      if (input.status) {
        where.status = input.status;
      }
      if (input.search) {
        where.OR = [
          { name: { contains: input.search, mode: "insensitive" as const } },
          { company: { contains: input.search, mode: "insensitive" as const } },
        ];
      }

      const [items, total] = await ctx.prisma.$transaction([
        ctx.prisma.client.findMany({
          where,
          skip,
          take: input.pageSize,
          orderBy: { [input.sortBy]: input.sortDirection },
          include: {
            _count: {
              select: { projects: true },
            },
          },
        }),
        ctx.prisma.client.count({ where }),
      ]);

      const totalPages = Math.ceil(total / input.pageSize);

      return {
        items: (items as ClientWithCount[]).map((c: ClientWithCount) => ({
          id: c.id,
          name: c.name,
          company: c.company,
          email: c.email,
          country: c.country,
          upworkRating: c.upwork_rating ? Number(c.upwork_rating) : null,
          totalSpent: c.total_spent ? Number(c.total_spent) : null,
          paymentVerified: c.payment_verified,
          status: c.status,
          projectCount: c._count.projects,
          createdAt: c.created_at,
        })),
        total,
        page: input.page,
        pageSize: input.pageSize,
        totalPages,
        hasNext: input.page < totalPages,
        hasPrevious: input.page > 1,
      };
    }),

  stats: publicProcedure.query(async ({ ctx }) => {
    const [totalClients, activeClients] = await ctx.prisma.$transaction([
      ctx.prisma.client.count(),
      ctx.prisma.client.count({ where: { status: "ACTIVE" } }),
    ]);

    return {
      totalClients,
      activeClients,
    };
  }),
});
