/**
 * Dashboard tRPC router - aggregated stats for the dashboard.
 */

import type { Job, AiAnalysis } from "@prisma/client";
import { createRouter, publicProcedure } from "../trpc";

type RecentJob = Pick<
  Job,
  "id" | "title" | "status" | "job_type" | "posted_at" | "connects_required" | "budget_max"
>;

type TopPickJob = Job & {
  analyses: Pick<AiAnalysis, "fit_score" | "win_probability" | "recommendation">[];
};

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

  /**
   * Top Picks — highest-scoring jobs that still need proposals.
   */
  topPicks: publicProcedure.query(async ({ ctx }) => {
    const jobs = await ctx.prisma.job.findMany({
      where: {
        status: { in: ["NEW", "ANALYZED", "SHORTLISTED"] },
        analyses: { some: { fit_score: { not: null } } },
      },
      include: {
        analyses: {
          take: 1,
          orderBy: { created_at: "desc" },
          select: { fit_score: true, win_probability: true, recommendation: true },
        },
      },
      orderBy: { created_at: "desc" },
      take: 50,
    });

    const scored = (jobs as TopPickJob[])
      .map((j) => {
        const a = j.analyses[0];
        return {
          id: j.id,
          title: j.title,
          jobType: j.job_type,
          budgetMax: j.budget_max ? Number(j.budget_max) : null,
          hourlyRateMax: j.hourly_rate_max ? Number(j.hourly_rate_max) : null,
          clientCountry: j.client_country,
          skillsRequired: j.skills_required,
          postedAt: j.posted_at,
          fitScore: a?.fit_score ?? 0,
          winProbability: a?.win_probability ?? 0,
          recommendation: a?.recommendation ?? null,
        };
      })
      .sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0))
      .slice(0, 5);

    return scored;
  }),

  /**
   * Earnings Pipeline — forecast based on active proposals.
   */
  pipeline: publicProcedure.query(async ({ ctx }) => {
    const proposals = await ctx.prisma.proposal.findMany({
      where: { status: { in: ["SENT", "VIEWED", "SHORTLISTED"] } },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            budget_max: true,
            hourly_rate_max: true,
            job_type: true,
            estimated_duration: true,
            analyses: {
              take: 1,
              orderBy: { created_at: "desc" },
              select: { win_probability: true },
            },
          },
        },
      },
    });

    type PipelineProposal = typeof proposals[number];

    const pipelineItems = proposals.map((p: PipelineProposal) => {
      const winProb = p.job.analyses?.[0]?.win_probability ?? 30;
      const estimatedValue = p.proposed_rate
        ? Number(p.proposed_rate)
        : p.job.budget_max
          ? Number(p.job.budget_max)
          : 0;
      return {
        proposalId: p.id,
        jobId: p.job.id,
        jobTitle: p.job.title,
        status: p.status,
        estimatedValue,
        winProbability: winProb,
        expectedValue: Math.round(estimatedValue * (winProb / 100)),
        createdAt: p.created_at,
      };
    });

    const totalEstimated = pipelineItems.reduce((sum, i) => sum + i.estimatedValue, 0);
    const totalExpected = pipelineItems.reduce((sum, i) => sum + i.expectedValue, 0);

    return {
      items: pipelineItems,
      totalEstimated,
      totalExpected,
      activeProposals: pipelineItems.length,
    };
  }),

  /**
   * Connects ROI — tracks connects efficiency.
   */
  connectsRoi: publicProcedure.query(async ({ ctx }) => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Only count proposals that were actually submitted (not drafts/reviews)
    const proposals = await ctx.prisma.proposal.findMany({
      where: {
        created_at: { gte: thirtyDaysAgo },
        status: { in: ["SENT", "VIEWED", "SHORTLISTED", "ACCEPTED", "REJECTED", "WITHDRAWN"] },
      },
      select: { status: true, connects_used: true, job: { select: { job_type: true, category: true } } },
    });

    const byCategory: Record<string, { spent: number; sent: number; won: number }> = {};

    for (const p of proposals) {
      const cat = p.job.category ?? p.job.job_type;
      if (!byCategory[cat]) byCategory[cat] = { spent: 0, sent: 0, won: 0 };
      byCategory[cat].sent += 1;
      byCategory[cat].spent += p.connects_used ?? 0;
      if (p.status === "ACCEPTED") byCategory[cat].won += 1;
    }

    const categories = Object.entries(byCategory).map(([category, data]) => ({
      category,
      connectsSpent: data.spent,
      proposalsSent: data.sent,
      proposalsWon: data.won,
      winRate: data.sent > 0 ? Math.round((data.won / data.sent) * 100) : 0,
      costPerWin: data.won > 0 ? Math.round(data.spent / data.won) : null,
    }));

    const totalSpent = categories.reduce((s, c) => s + c.connectsSpent, 0);
    const totalSent = categories.reduce((s, c) => s + c.proposalsSent, 0);
    const totalWon = categories.reduce((s, c) => s + c.proposalsWon, 0);

    return {
      categories,
      totalConnectsSpent: totalSpent,
      totalProposalsSent: totalSent,
      totalProposalsWon: totalWon,
      overallWinRate: totalSent > 0 ? Math.round((totalWon / totalSent) * 100) : 0,
      avgCostPerWin: totalWon > 0 ? Math.round(totalSpent / totalWon) : null,
    };
  }),

  /**
   * Activity Trends — daily job capture + proposal counts for the last 30 days.
   */
  activityTrends: publicProcedure.query(async ({ ctx }) => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [jobs, proposals] = await ctx.prisma.$transaction([
      ctx.prisma.job.findMany({
        where: { created_at: { gte: thirtyDaysAgo } },
        select: { created_at: true },
        orderBy: { created_at: "asc" },
      }),
      ctx.prisma.proposal.findMany({
        where: {
          created_at: { gte: thirtyDaysAgo },
          status: { notIn: ["DRAFT", "REVIEW", "READY"] },
        },
        select: { created_at: true, status: true },
        orderBy: { created_at: "asc" },
      }),
    ]);

    // Build a map of day → counts
    const dayMap: Record<string, { jobs: number; proposals: number; won: number }> = {};

    // Initialise all 30 days so there are no gaps
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      dayMap[key] = { jobs: 0, proposals: 0, won: 0 };
    }

    for (const j of jobs) {
      const key = j.created_at.toISOString().slice(0, 10);
      if (dayMap[key]) dayMap[key].jobs += 1;
    }

    for (const p of proposals) {
      const key = p.created_at.toISOString().slice(0, 10);
      if (dayMap[key]) {
        dayMap[key].proposals += 1;
        if (p.status === "ACCEPTED") dayMap[key].won += 1;
      }
    }

    const days = Object.entries(dayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({
        date,
        label: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        ...counts,
      }));

    // Summary stats
    const totalJobsCaptured = days.reduce((s, d) => s + d.jobs, 0);
    const totalProposalsSent = days.reduce((s, d) => s + d.proposals, 0);
    const totalWon = days.reduce((s, d) => s + d.won, 0);

    return {
      days,
      totalJobsCaptured,
      totalProposalsSent,
      totalWon,
    };
  }),
});
