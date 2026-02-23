/**
 * Portfolio websites router — manage live sites to include in proposal footer.
 */

import { z } from "zod";
import { createRouter, publicProcedure } from "../trpc";
import type { TrpcContext } from "../trpc";

const DEFAULT_TENANT_SLUG = "default";

async function resolveTenantId(ctx: TrpcContext): Promise<string> {
  if (ctx.tenantId) return ctx.tenantId;

  let tenant = await ctx.prisma.tenant.findUnique({
    where: { slug: DEFAULT_TENANT_SLUG },
    select: { id: true },
  });

  if (!tenant) {
    tenant = await ctx.prisma.tenant.create({
      data: { name: "My Workspace", slug: DEFAULT_TENANT_SLUG },
      select: { id: true },
    });
  }

  return tenant.id;
}

const websiteSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  label: z.string().max(100).optional(),
});

export const portfolioRouter = createRouter({
  /** List portfolio websites for the current tenant (for proposal footer). */
  list: publicProcedure.query(async ({ ctx }) => {
    const tenantId = await resolveTenantId(ctx);
    const rows = await ctx.prisma.portfolioWebsite.findMany({
      where: { tenant_id: tenantId },
      orderBy: [{ sort_order: "asc" }, { created_at: "asc" }],
      select: { id: true, url: true, label: true, sort_order: true },
    });
    return rows.map((r) => ({
      id: r.id,
      url: r.url,
      label: r.label ?? null,
      sortOrder: r.sort_order,
    }));
  }),

  /** Replace all portfolio websites for the tenant. */
  set: publicProcedure
    .input(z.object({ websites: z.array(websiteSchema) }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenantId(ctx);
      await ctx.prisma.portfolioWebsite.deleteMany({
        where: { tenant_id: tenantId },
      });
      if (input.websites.length > 0) {
        await ctx.prisma.portfolioWebsite.createMany({
          data: input.websites.map((w, i) => ({
            tenant_id: tenantId,
            url: w.url,
            label: w.label ?? null,
            sort_order: i,
          })),
        });
      }
      const rows = await ctx.prisma.portfolioWebsite.findMany({
        where: { tenant_id: tenantId },
        orderBy: [{ sort_order: "asc" }, { created_at: "asc" }],
        select: { id: true, url: true, label: true, sort_order: true },
      });
      return rows.map((r) => ({
        id: r.id,
        url: r.url,
        label: r.label ?? null,
        sortOrder: r.sort_order,
      }));
    }),
});
