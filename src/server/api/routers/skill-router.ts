/**
 * Skill tRPC router – handles skill CRUD with tenant isolation.
 *
 * Procedures:
 *   - list      → All skills for the current tenant
 *   - create    → Add a new manual skill
 *   - update    → Toggle primary, set proficiency / years
 *   - delete    → Remove a skill
 *   - bulkUpdatePrimary → Toggle primary for multiple skills at once
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { Skill } from "@prisma/client";
import { createRouter, protectedProcedure } from "../trpc";

// ---------------------------------------------------------------------------
// Shared mapper
// ---------------------------------------------------------------------------

function mapSkill(s: Skill) {
  return {
    id: s.id,
    name: s.name,
    category: s.category,
    proficiency: s.proficiency,
    yearsExperience: s.years_experience ? Number(s.years_experience) : null,
    source: s.source,
    isPrimary: s.is_primary,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const skillRouter = createRouter({
  /**
   * List all skills for the current tenant, ordered by primary first, then proficiency.
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const skills = await ctx.prisma.skill.findMany({
      where: { tenant_id: ctx.tenantId },
      orderBy: [{ is_primary: "desc" }, { proficiency: "desc" }, { name: "asc" }],
    });

    return skills.map(mapSkill);
  }),

  /**
   * Create a new skill (MANUAL source by default).
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Skill name is required").max(100),
        category: z.string().max(50).optional(),
        proficiency: z.number().int().min(1).max(10).optional(),
        yearsExperience: z.number().min(0).max(50).optional(),
        isPrimary: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check for duplicate
      const existing = await ctx.prisma.skill.findUnique({
        where: {
          tenant_id_name: {
            tenant_id: ctx.tenantId,
            name: input.name,
          },
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Skill "${input.name}" already exists.`,
        });
      }

      const skill = await ctx.prisma.skill.create({
        data: {
          tenant_id: ctx.tenantId,
          name: input.name,
          category: input.category,
          proficiency: input.proficiency,
          years_experience: input.yearsExperience,
          source: "MANUAL",
          is_primary: input.isPrimary,
        },
      });

      return mapSkill(skill);
    }),

  /**
   * Update a single skill (proficiency, years, primary, category).
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        proficiency: z.number().int().min(1).max(10).nullish(),
        yearsExperience: z.number().min(0).max(50).nullish(),
        isPrimary: z.boolean().optional(),
        category: z.string().max(50).nullish(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const skill = await ctx.prisma.skill.findFirst({
        where: { id: input.id, tenant_id: ctx.tenantId },
      });

      if (!skill) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Skill not found.",
        });
      }

      const updated = await ctx.prisma.skill.update({
        where: { id: input.id },
        data: {
          ...(input.proficiency !== undefined && {
            proficiency: input.proficiency,
          }),
          ...(input.yearsExperience !== undefined && {
            years_experience: input.yearsExperience,
          }),
          ...(input.isPrimary !== undefined && {
            is_primary: input.isPrimary,
          }),
          ...(input.category !== undefined && {
            category: input.category,
          }),
        },
      });

      return mapSkill(updated);
    }),

  /**
   * Delete a skill.
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const skill = await ctx.prisma.skill.findFirst({
        where: { id: input.id, tenant_id: ctx.tenantId },
      });

      if (!skill) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Skill not found.",
        });
      }

      await ctx.prisma.skill.delete({ where: { id: input.id } });

      return { success: true };
    }),

  /**
   * Bulk toggle primary status for multiple skills.
   */
  bulkUpdatePrimary: protectedProcedure
    .input(
      z.object({
        updates: z.array(
          z.object({
            id: z.string(),
            isPrimary: z.boolean(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.$transaction(
        input.updates.map((u) =>
          ctx.prisma.skill.updateMany({
            where: { id: u.id, tenant_id: ctx.tenantId },
            data: { is_primary: u.isPrimary },
          })
        )
      );

      return { success: true, count: input.updates.length };
    }),
});
