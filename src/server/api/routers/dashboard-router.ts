/**
 * Dashboard tRPC router - aggregated stats for the dashboard.
 */

import type { Job } from "@prisma/client";
import { createRouter, publicProcedure } from "../trpc";

type RecentJob = Pick<
  Job,
  "id" | "title" | "status" | "job_type" | "posted_at" | "connects_required" | "budget_max"
>;

export const dashboardRouter = createRouter({
  overview: publicProcedure.query(async ({ ctx }) => {
    const [
      totalJobs,
      newJobs,
      shortlistedJobs,
      bidsSent,
      activeInterviews,
      acceptedJobs,
      totalProposals,
      draftProposals,
      activeProjects,
      completedProjects,
      totalClients,
      activeClients,
    ] = await ctx.prisma.$transaction([
      ctx.prisma.job.count(),
      ctx.prisma.job.count({ where: { status: "NEW" } }),
      ctx.prisma.job.count({ where: { status: "SHORTLISTED" } }),
      ctx.prisma.job.count({ where: { status: "BID_SENT" } }),
      ctx.prisma.job.count({ where: { status: "INTERVIEWING" } }),
      ctx.prisma.job.count({ where: { status: "ACCEPTED" } }),
      ctx.prisma.proposal.count(),
      ctx.prisma.proposal.count({ where: { status: "DRAFT" } }),
      ctx.prisma.project.count({ where: { status: "ACTIVE" } }),
      ctx.prisma.project.count({ where: { status: "COMPLETED" } }),
      ctx.prisma.client.count(),
      ctx.prisma.client.count({ where: { status: "ACTIVE" } }),
    ]);

    const earningsResult = await ctx.prisma.project.aggregate({
      _sum: { total_earned: true },
      where: { status: { in: ["ACTIVE", "COMPLETED"] } },
    });

    // Recent jobs
    const recentJobs: RecentJob[] = await ctx.prisma.job.findMany({
      take: 5,
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        job_type: true,
        posted_at: true,
        connects_required: true,
        budget_max: true,
      },
    });

    return {
      jobs: {
        total: totalJobs,
        new: newJobs,
        shortlisted: shortlistedJobs,
        bidsSent,
        interviewing: activeInterviews,
        accepted: acceptedJobs,
      },
      proposals: {
        total: totalProposals,
        drafts: draftProposals,
      },
      projects: {
        active: activeProjects,
        completed: completedProjects,
        totalEarnings: earningsResult._sum.total_earned
          ? Number(earningsResult._sum.total_earned)
          : 0,
      },
      clients: {
        total: totalClients,
        active: activeClients,
      },
      recentJobs: recentJobs.map((j: RecentJob) => ({
        id: j.id,
        title: j.title,
        status: j.status,
        jobType: j.job_type,
        postedAt: j.posted_at,
        connectsRequired: j.connects_required,
        budgetMax: j.budget_max ? Number(j.budget_max) : null,
      })),
    };
  }),
});
