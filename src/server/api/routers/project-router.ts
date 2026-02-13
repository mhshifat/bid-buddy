/**
 * Project tRPC router - handles project management operations.
 */

import { z } from "zod";
import type { Project, Client } from "@prisma/client";
import { createRouter, publicProcedure } from "../trpc";

const projectFilterSchema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
  status: z
    .enum([
      "PENDING",
      "ACTIVE",
      "ON_HOLD",
      "COMPLETED",
      "CANCELLED",
      "DISPUTED",
    ])
    .optional(),
  clientId: z.string().optional(),
  sortBy: z
    .enum(["created_at", "start_date", "deadline", "total_earned"])
    .default("created_at"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});

type ProjectWithClient = Project & {
  client: Pick<Client, "id" | "name" | "company">;
  _count: { tasks: number; milestones: number };
};

export const projectRouter = createRouter({
  list: publicProcedure
    .input(projectFilterSchema)
    .query(async ({ ctx, input }) => {
      const skip = (input.page - 1) * input.pageSize;

      const where: Record<string, unknown> = {};

      if (input.status) {
        where.status = input.status;
      }
      if (input.clientId) {
        where.client_id = input.clientId;
      }

      const [items, total] = await ctx.prisma.$transaction([
        ctx.prisma.project.findMany({
          where,
          skip,
          take: input.pageSize,
          orderBy: { [input.sortBy]: input.sortDirection },
          include: {
            client: {
              select: { id: true, name: true, company: true },
            },
            _count: {
              select: { tasks: true, milestones: true },
            },
          },
        }),
        ctx.prisma.project.count({ where }),
      ]);

      const totalPages = Math.ceil(total / input.pageSize);

      return {
        items: (items as ProjectWithClient[]).map((p: ProjectWithClient) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          clientName: p.client.name,
          clientCompany: p.client.company,
          jobType: p.job_type,
          budget: p.budget ? Number(p.budget) : null,
          hourlyRate: p.hourly_rate ? Number(p.hourly_rate) : null,
          totalEarned: p.total_earned ? Number(p.total_earned) : null,
          status: p.status,
          startDate: p.start_date,
          deadline: p.deadline,
          taskCount: p._count.tasks,
          milestoneCount: p._count.milestones,
          createdAt: p.created_at,
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
    const [totalProjects, activeProjects, completedProjects] =
      await ctx.prisma.$transaction([
        ctx.prisma.project.count(),
        ctx.prisma.project.count({ where: { status: "ACTIVE" } }),
        ctx.prisma.project.count({ where: { status: "COMPLETED" } }),
      ]);

    // Get total earnings
    const earningsResult = await ctx.prisma.project.aggregate({
      _sum: { total_earned: true },
      where: { status: { in: ["ACTIVE", "COMPLETED"] } },
    });

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      totalEarnings: earningsResult._sum.total_earned
        ? Number(earningsResult._sum.total_earned)
        : 0,
    };
  }),
});
