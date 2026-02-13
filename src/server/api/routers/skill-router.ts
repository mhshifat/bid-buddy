/**
 * Skill tRPC router - handles skill management.
 */

import { z } from "zod";
import type { Skill } from "@prisma/client";
import { createRouter, publicProcedure } from "../trpc";

export const skillRouter = createRouter({
  list: publicProcedure.query(async ({ ctx }) => {
    const skills: Skill[] = await ctx.prisma.skill.findMany({
      orderBy: [{ is_primary: "desc" }, { proficiency: "desc" }],
    });

    return skills.map((s: Skill) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      proficiency: s.proficiency,
      yearsExperience: s.years_experience
        ? Number(s.years_experience)
        : null,
      source: s.source,
      isPrimary: s.is_primary,
    }));
  }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        category: z.string().optional(),
        proficiency: z.number().min(1).max(10).optional(),
        yearsExperience: z.number().min(0).optional(),
        source: z.enum(["MANUAL", "GITHUB", "UPWORK", "AI_DETECTED"]).default("MANUAL"),
        isPrimary: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: Replace with actual tenant from auth context
      const tenantId = "placeholder-tenant";

      const skill = await ctx.prisma.skill.create({
        data: {
          tenant_id: tenantId,
          name: input.name,
          category: input.category,
          proficiency: input.proficiency,
          years_experience: input.yearsExperience,
          source: input.source,
          is_primary: input.isPrimary,
        },
      });

      return { id: skill.id };
    }),
});
