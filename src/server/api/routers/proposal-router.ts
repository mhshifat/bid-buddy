/**
 * Proposal tRPC router - handles proposal-related operations.
 */

import { z } from "zod";
import type { Proposal, Job } from "@prisma/client";
import { createRouter, publicProcedure } from "../trpc";

const proposalFilterSchema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
  status: z
    .enum([
      "DRAFT",
      "REVIEW",
      "READY",
      "SENT",
      "VIEWED",
      "SHORTLISTED",
      "ACCEPTED",
      "REJECTED",
      "WITHDRAWN",
    ])
    .optional(),
  jobId: z.string().optional(),
  sortBy: z.enum(["created_at", "sent_at", "status"]).default("created_at"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});

type ProposalWithJob = Proposal & {
  job: Pick<Job, "id" | "title" | "job_type" | "status">;
};

type ProposalWithJobDetail = Proposal & {
  job: Pick<Job, "id" | "title" | "job_type" | "description" | "skills_required">;
};

export const proposalRouter = createRouter({
  list: publicProcedure
    .input(proposalFilterSchema)
    .query(async ({ ctx, input }) => {
      const skip = (input.page - 1) * input.pageSize;

      const where: Record<string, unknown> = {};

      if (input.status) {
        where.status = input.status;
      }
      if (input.jobId) {
        where.job_id = input.jobId;
      }

      const [items, total] = await ctx.prisma.$transaction([
        ctx.prisma.proposal.findMany({
          where,
          skip,
          take: input.pageSize,
          orderBy: { [input.sortBy]: input.sortDirection },
          include: {
            job: {
              select: {
                id: true,
                title: true,
                job_type: true,
                status: true,
              },
            },
          },
        }),
        ctx.prisma.proposal.count({ where }),
      ]);

      const totalPages = Math.ceil(total / input.pageSize);

      return {
        items: (items as ProposalWithJob[]).map((p: ProposalWithJob) => ({
          id: p.id,
          jobId: p.job_id,
          jobTitle: p.job.title,
          jobType: p.job.job_type,
          jobStatus: p.job.status,
          coverLetter:
            p.cover_letter.length > 150
              ? `${p.cover_letter.substring(0, 150)}...`
              : p.cover_letter,
          proposedRate: p.proposed_rate ? Number(p.proposed_rate) : null,
          proposedDuration: p.proposed_duration,
          connectsUsed: p.connects_used,
          status: p.status,
          aiGenerated: p.ai_generated,
          sentAt: p.sent_at,
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

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const proposal = await ctx.prisma.proposal.findUnique({
        where: { id: input.id },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              job_type: true,
              description: true,
              skills_required: true,
            },
          },
        },
      });

      if (!proposal) return null;

      const p = proposal as ProposalWithJobDetail;

      return {
        id: p.id,
        jobId: p.job_id,
        job: {
          id: p.job.id,
          title: p.job.title,
          jobType: p.job.job_type,
          description: p.job.description,
          skillsRequired: p.job.skills_required,
        },
        coverLetter: p.cover_letter,
        proposedRate: p.proposed_rate
          ? Number(p.proposed_rate)
          : null,
        proposedDuration: p.proposed_duration,
        milestones: p.milestones,
        questionsAnswers: p.questions_answers,
        attachments: p.attachments,
        connectsUsed: p.connects_used,
        status: p.status,
        aiGenerated: p.ai_generated,
        aiVersion: p.ai_version,
        sentAt: p.sent_at,
        viewedAt: p.viewed_at,
        respondedAt: p.responded_at,
        createdAt: p.created_at,
      };
    }),

  stats: publicProcedure.query(async ({ ctx }) => {
    const [totalProposals, drafts, sent, accepted, rejected] =
      await ctx.prisma.$transaction([
        ctx.prisma.proposal.count(),
        ctx.prisma.proposal.count({ where: { status: "DRAFT" } }),
        ctx.prisma.proposal.count({ where: { status: "SENT" } }),
        ctx.prisma.proposal.count({ where: { status: "ACCEPTED" } }),
        ctx.prisma.proposal.count({ where: { status: "REJECTED" } }),
      ]);

    return {
      totalProposals,
      drafts,
      sent,
      accepted,
      rejected,
      successRate: sent > 0 ? Math.round((accepted / sent) * 100) : 0,
    };
  }),
});
