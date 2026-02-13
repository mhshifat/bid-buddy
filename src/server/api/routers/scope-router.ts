/**
 * Scope Shield tRPC router – protects freelancers from scope creep.
 *
 * Features:
 *   - Define project scope (deliverables, exclusions, budget, timeline)
 *   - Detect scope creep from client messages via AI
 *   - Generate diplomatic responses to push back professionally
 *   - Create change orders with pricing for out-of-scope work
 *   - Track scope change request history
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, publicProcedure } from "../trpc";
import { getAiService } from "@/server/ai";
import { logger } from "@/server/lib/logger";
import type { PrismaClient } from "@prisma/client";

// ---------------------------------------------------------------------------
// Input Schemas
// ---------------------------------------------------------------------------

const createScopeSchema = z.object({
  projectId: z.string().optional(),
  jobId: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  originalDescription: z.string().min(1, "Scope description is required"),
  deliverables: z.array(z.string()).min(1, "At least one deliverable is required"),
  exclusions: z.array(z.string()).default([]),
  milestones: z.array(z.string()).default([]),
  agreedBudget: z.number().positive().nullable().default(null),
  agreedTimeline: z.string().nullable().default(null),
  revisionLimit: z.number().int().min(0).nullable().default(null),
  notes: z.string().nullable().default(null),
});

const updateScopeSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).optional(),
  originalDescription: z.string().min(1).optional(),
  deliverables: z.array(z.string()).optional(),
  exclusions: z.array(z.string()).optional(),
  milestones: z.array(z.string()).optional(),
  agreedBudget: z.number().positive().nullable().optional(),
  agreedTimeline: z.string().nullable().optional(),
  revisionLimit: z.number().int().min(0).nullable().optional(),
  notes: z.string().nullable().optional(),
});

const detectCreepSchema = z.object({
  scopeId: z.string().min(1, "Scope ID is required"),
  clientMessage: z.string().min(1, "Client message is required"),
});

const generateResponseSchema = z.object({
  changeRequestId: z.string().min(1, "Change request ID is required"),
  tone: z.enum(["firm", "friendly", "neutral"]).default("friendly"),
  freelancerName: z.string().optional(),
});

const generateChangeOrderSchema = z.object({
  changeRequestId: z.string().min(1, "Change request ID is required"),
  freelancerHourlyRate: z.number().positive().nullable().default(null),
});

const updateChangeRequestStatusSchema = z.object({
  changeRequestId: z.string().min(1),
  status: z.enum(["ACCEPTED", "DECLINED", "NEGOTIATED"]),
});

// ---------------------------------------------------------------------------
// Helper: resolve tenant ID
// ---------------------------------------------------------------------------

async function resolveTenantId(ctx: { tenantId?: string | null; prisma: unknown }): Promise<string> {
  if (ctx.tenantId) return ctx.tenantId;
  const prismaClient = ctx.prisma as PrismaClient;
  const tenant = await prismaClient.tenant.findFirst({ select: { id: true } });
  if (!tenant) throw new TRPCError({ code: "UNAUTHORIZED", message: "No tenant found" });
  return tenant.id;
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const scopeRouter = createRouter({
  /**
   * Create a new project scope definition.
   */
  create: publicProcedure
    .input(createScopeSchema)
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenantId(ctx);

      const scope = await ctx.prisma.projectScope.create({
        data: {
          tenant_id: tenantId,
          project_id: input.projectId ?? null,
          job_id: input.jobId ?? null,
          title: input.title,
          original_description: input.originalDescription,
          deliverables: input.deliverables,
          exclusions: input.exclusions,
          milestones: input.milestones,
          agreed_budget: input.agreedBudget,
          agreed_timeline: input.agreedTimeline,
          revision_limit: input.revisionLimit,
          notes: input.notes,
        },
      });

      logger.info(`Scope created: ${scope.id} for project "${input.title}"`);
      return scope;
    }),

  /**
   * Update an existing scope.
   */
  update: publicProcedure
    .input(updateScopeSchema)
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenantId(ctx);
      const { id, ...data } = input;

      const existing = await ctx.prisma.projectScope.findFirst({
        where: { id, tenant_id: tenantId },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Scope not found" });
      }

      const scope = await ctx.prisma.projectScope.update({
        where: { id },
        data: {
          ...(data.title !== undefined && { title: data.title }),
          ...(data.originalDescription !== undefined && { original_description: data.originalDescription }),
          ...(data.deliverables !== undefined && { deliverables: data.deliverables }),
          ...(data.exclusions !== undefined && { exclusions: data.exclusions }),
          ...(data.milestones !== undefined && { milestones: data.milestones }),
          ...(data.agreedBudget !== undefined && { agreed_budget: data.agreedBudget }),
          ...(data.agreedTimeline !== undefined && { agreed_timeline: data.agreedTimeline }),
          ...(data.revisionLimit !== undefined && { revision_limit: data.revisionLimit }),
          ...(data.notes !== undefined && { notes: data.notes }),
        },
      });

      return scope;
    }),

  /**
   * Delete a scope and all its change requests.
   */
  delete: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenantId(ctx);

      const existing = await ctx.prisma.projectScope.findFirst({
        where: { id: input.id, tenant_id: tenantId },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Scope not found" });
      }

      await ctx.prisma.projectScope.delete({ where: { id: input.id } });
      return { success: true };
    }),

  /**
   * List all scopes for the tenant.
   */
  list: publicProcedure.query(async ({ ctx }) => {
    const tenantId = await resolveTenantId(ctx);

    const scopes = await ctx.prisma.projectScope.findMany({
      where: { tenant_id: tenantId },
      orderBy: { created_at: "desc" },
      include: {
        _count: { select: { change_requests: true } },
      },
    });

    return scopes;
  }),

  /**
   * Get a single scope with all its change requests.
   */
  getById: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const tenantId = await resolveTenantId(ctx);

      const scope = await ctx.prisma.projectScope.findFirst({
        where: { id: input.id, tenant_id: tenantId },
        include: {
          change_requests: {
            orderBy: { created_at: "desc" },
          },
        },
      });

      if (!scope) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Scope not found" });
      }

      return scope;
    }),

  /**
   * Detect scope creep – AI analyses a client message against the defined scope.
   */
  detectCreep: publicProcedure
    .input(detectCreepSchema)
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenantId(ctx);

      const scope = await ctx.prisma.projectScope.findFirst({
        where: { id: input.scopeId, tenant_id: tenantId },
      });

      if (!scope) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Scope not found" });
      }

      const aiService = getAiService();
      const { result } = await aiService.detectScopeCreep({
        projectTitle: scope.title,
        originalScope: scope.original_description,
        deliverables: scope.deliverables,
        exclusions: scope.exclusions,
        agreedBudget: scope.agreed_budget ? Number(scope.agreed_budget) : null,
        agreedTimeline: scope.agreed_timeline,
        revisionLimit: scope.revision_limit,
        clientMessage: input.clientMessage,
      });

      // Save as a change request
      const changeRequest = await ctx.prisma.scopeChangeRequest.create({
        data: {
          scope_id: scope.id,
          tenant_id: tenantId,
          client_message: input.clientMessage,
          is_out_of_scope: result.isOutOfScope,
          ai_analysis: result as unknown as object,
          status: "DETECTED",
          estimated_hours: result.impactAssessment.timeImpact
            ? null
            : null,
        },
      });

      // Also persist as an AiInsight
      await ctx.prisma.aiInsight.create({
        data: {
          tenant_id: tenantId,
          job_id: scope.job_id ?? undefined,
          insight_type: "SCOPE_CREEP_DETECTION",
          result: result as unknown as object,
        },
      });

      return {
        changeRequestId: changeRequest.id,
        ...result,
      };
    }),

  /**
   * Generate a diplomatic response for a detected scope creep request.
   */
  generateResponse: publicProcedure
    .input(generateResponseSchema)
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenantId(ctx);

      const changeRequest = await ctx.prisma.scopeChangeRequest.findFirst({
        where: { id: input.changeRequestId, tenant_id: tenantId },
        include: { scope: true },
      });

      if (!changeRequest) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Change request not found" });
      }

      if (!changeRequest.ai_analysis) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Run scope creep detection first" });
      }

      const scopeAnalysis = changeRequest.ai_analysis as unknown as import("@/server/ai/types").ScopeCreepDetectionResult;

      const aiService = getAiService();
      const { result } = await aiService.generateDiplomaticResponse({
        projectTitle: changeRequest.scope.title,
        clientMessage: changeRequest.client_message,
        scopeAnalysis,
        originalDeliverables: changeRequest.scope.deliverables,
        tone: input.tone,
        freelancerName: input.freelancerName,
      });

      // Update change request with the response
      await ctx.prisma.scopeChangeRequest.update({
        where: { id: changeRequest.id },
        data: { ai_response: result as unknown as object },
      });

      // Persist as AiInsight
      await ctx.prisma.aiInsight.create({
        data: {
          tenant_id: tenantId,
          job_id: changeRequest.scope.job_id ?? undefined,
          insight_type: "SCOPE_CREEP_RESPONSE",
          result: result as unknown as object,
        },
      });

      return result;
    }),

  /**
   * Generate a change order with pricing for out-of-scope work.
   */
  generateChangeOrder: publicProcedure
    .input(generateChangeOrderSchema)
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenantId(ctx);

      const changeRequest = await ctx.prisma.scopeChangeRequest.findFirst({
        where: { id: input.changeRequestId, tenant_id: tenantId },
        include: { scope: true },
      });

      if (!changeRequest) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Change request not found" });
      }

      if (!changeRequest.ai_analysis) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Run scope creep detection first" });
      }

      const scopeAnalysis = changeRequest.ai_analysis as unknown as import("@/server/ai/types").ScopeCreepDetectionResult;

      const aiService = getAiService();
      const { result } = await aiService.generateChangeOrder({
        projectTitle: changeRequest.scope.title,
        clientMessage: changeRequest.client_message,
        scopeAnalysis,
        originalBudget: changeRequest.scope.agreed_budget ? Number(changeRequest.scope.agreed_budget) : null,
        originalTimeline: changeRequest.scope.agreed_timeline,
        freelancerHourlyRate: input.freelancerHourlyRate,
      });

      // Update change request with the change order and cost estimate
      await ctx.prisma.scopeChangeRequest.update({
        where: { id: changeRequest.id },
        data: {
          change_order: result as unknown as object,
          estimated_cost: result.totalAdditionalCost,
          estimated_hours: result.totalAdditionalHours,
        },
      });

      // Persist as AiInsight
      await ctx.prisma.aiInsight.create({
        data: {
          tenant_id: tenantId,
          job_id: changeRequest.scope.job_id ?? undefined,
          insight_type: "CHANGE_ORDER",
          result: result as unknown as object,
        },
      });

      return result;
    }),

  /**
   * Update the status of a change request (accept, decline, negotiate).
   */
  updateChangeRequestStatus: publicProcedure
    .input(updateChangeRequestStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenantId(ctx);

      const changeRequest = await ctx.prisma.scopeChangeRequest.findFirst({
        where: { id: input.changeRequestId, tenant_id: tenantId },
      });

      if (!changeRequest) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Change request not found" });
      }

      const updated = await ctx.prisma.scopeChangeRequest.update({
        where: { id: input.changeRequestId },
        data: { status: input.status },
      });

      return updated;
    }),

  /**
   * Get all change requests for a scope.
   */
  changeRequests: publicProcedure
    .input(z.object({ scopeId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const tenantId = await resolveTenantId(ctx);

      const requests = await ctx.prisma.scopeChangeRequest.findMany({
        where: { scope_id: input.scopeId, tenant_id: tenantId },
        orderBy: { created_at: "desc" },
      });

      return requests;
    }),

  /**
   * Dashboard stats for scope shield.
   */
  stats: publicProcedure.query(async ({ ctx }) => {
    const tenantId = await resolveTenantId(ctx);

    const [totalScopes, totalRequests, outOfScope, inScope, grayArea] =
      await ctx.prisma.$transaction([
        ctx.prisma.projectScope.count({ where: { tenant_id: tenantId } }),
        ctx.prisma.scopeChangeRequest.count({ where: { tenant_id: tenantId } }),
        ctx.prisma.scopeChangeRequest.count({ where: { tenant_id: tenantId, is_out_of_scope: true } }),
        ctx.prisma.scopeChangeRequest.count({ where: { tenant_id: tenantId, is_out_of_scope: false } }),
        ctx.prisma.scopeChangeRequest.count({
          where: {
            tenant_id: tenantId,
            ai_analysis: { path: ["verdict"], equals: "GRAY_AREA" },
          },
        }),
      ]);

    const totalSaved = await ctx.prisma.scopeChangeRequest.aggregate({
      _sum: { estimated_cost: true },
      where: { tenant_id: tenantId, is_out_of_scope: true, status: { in: ["NEGOTIATED", "DECLINED"] } },
    });

    return {
      totalScopes,
      totalRequests,
      outOfScope,
      inScope,
      grayArea,
      moneySaved: totalSaved._sum?.estimated_cost ? Number(totalSaved._sum.estimated_cost) : 0,
    };
  }),
});

