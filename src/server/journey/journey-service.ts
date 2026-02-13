/**
 * Journey Service — tracks the full lifecycle of a job from discovery to delivery.
 *
 * Centralises:
 *  - Activity logging (JobActivity records)
 *  - Auto status transitions (e.g. proposal sent → job moves to BID_SENT)
 *  - Phase calculations
 */

import type { PrismaClient, JourneyPhase, JobStatus, ProposalStatus, ProjectStatus } from "@prisma/client";
import { logger } from "@/server/lib/logger";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LogActivityParams {
  tenantId: string;
  jobId: string;
  proposalId?: string | null;
  projectId?: string | null;
  phase: JourneyPhase;
  title: string;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
}

/** Maps a ProposalStatus to the auto-target JobStatus (or null = no auto-transition). */
const PROPOSAL_TO_JOB_STATUS: Partial<Record<ProposalStatus, JobStatus>> = {
  DRAFT: "BIDDING",
  SENT: "BID_SENT",
  SHORTLISTED: "INTERVIEWING",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
};

/** Maps a ProposalStatus to the JourneyPhase for activity logging. */
const PROPOSAL_STATUS_PHASE: Partial<Record<ProposalStatus, JourneyPhase>> = {
  DRAFT: "PROPOSAL_DRAFTED",
  REVIEW: "PROPOSAL_DRAFTED",
  READY: "PROPOSAL_DRAFTED",
  SENT: "PROPOSAL_SENT",
  VIEWED: "PROPOSAL_SENT",
  SHORTLISTED: "INTERVIEWING",
  ACCEPTED: "WON",
  REJECTED: "LOST",
  WITHDRAWN: "SKIPPED",
};

/** Maps a JobStatus to the JourneyPhase. */
const JOB_STATUS_PHASE: Record<JobStatus, JourneyPhase> = {
  NEW: "DISCOVERED",
  ANALYZED: "ANALYZED",
  SHORTLISTED: "SHORTLISTED",
  BIDDING: "PROPOSAL_DRAFTED",
  BID_SENT: "PROPOSAL_SENT",
  INTERVIEWING: "INTERVIEWING",
  ACCEPTED: "WON",
  REJECTED: "LOST",
  EXPIRED: "EXPIRED",
  SKIPPED: "SKIPPED",
  FLAGGED: "DISCOVERED",
};

/** Maps a ProjectStatus to the JourneyPhase. */
const PROJECT_STATUS_PHASE: Partial<Record<ProjectStatus, JourneyPhase>> = {
  PENDING: "WON",
  ACTIVE: "PROJECT_STARTED",
  COMPLETED: "PROJECT_DELIVERED",
  CANCELLED: "LOST",
};

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class JourneyService {
  constructor(private readonly prisma: PrismaClient) {}

  // -----------------------------------------------------------------------
  // Core: log activity
  // -----------------------------------------------------------------------

  async logActivity(params: LogActivityParams): Promise<string> {
    try {
      const activity = await this.prisma.jobActivity.create({
        data: {
          tenant_id: params.tenantId,
          job_id: params.jobId,
          proposal_id: params.proposalId ?? null,
          project_id: params.projectId ?? null,
          phase: params.phase,
          title: params.title,
          description: params.description ?? null,
          metadata: params.metadata
            ? JSON.parse(JSON.stringify(params.metadata))
            : undefined,
        },
      });
      return activity.id;
    } catch (error) {
      logger.error("Failed to log job activity", error instanceof Error ? error : undefined);
      // Don't throw — activity logging is non-critical
      return "";
    }
  }

  // -----------------------------------------------------------------------
  // Auto transitions: when proposal status changes
  // -----------------------------------------------------------------------

  async onProposalStatusChanged(params: {
    tenantId: string;
    proposalId: string;
    jobId: string;
    oldStatus: ProposalStatus;
    newStatus: ProposalStatus;
    jobTitle: string;
  }): Promise<void> {
    // 1. Log activity
    const phase = PROPOSAL_STATUS_PHASE[params.newStatus];
    if (phase) {
      await this.logActivity({
        tenantId: params.tenantId,
        jobId: params.jobId,
        proposalId: params.proposalId,
        phase,
        title: `Proposal ${params.newStatus.toLowerCase().replace(/_/g, " ")}`,
        description: `Proposal for "${params.jobTitle}" moved to ${params.newStatus}.`,
        metadata: { oldStatus: params.oldStatus, newStatus: params.newStatus },
      });
    }

    // 2. Auto-update job status
    const targetJobStatus = PROPOSAL_TO_JOB_STATUS[params.newStatus];
    if (targetJobStatus) {
      try {
        const job = await this.prisma.job.findUnique({
          where: { id: params.jobId },
          select: { status: true },
        });
        // Only advance forward, don't regress
        if (job && this.shouldAdvanceJobStatus(job.status, targetJobStatus)) {
          await this.prisma.job.update({
            where: { id: params.jobId },
            data: { status: targetJobStatus },
          });
          logger.info(`Auto-advanced job ${params.jobId} to ${targetJobStatus} (proposal ${params.newStatus})`);
        }
      } catch (error) {
        logger.error("Failed to auto-advance job status", error instanceof Error ? error : undefined);
      }
    }
  }

  // -----------------------------------------------------------------------
  // Auto transitions: when job status changes
  // -----------------------------------------------------------------------

  async onJobStatusChanged(params: {
    tenantId: string;
    jobId: string;
    oldStatus: JobStatus;
    newStatus: JobStatus;
    jobTitle: string;
  }): Promise<void> {
    const phase = JOB_STATUS_PHASE[params.newStatus];
    await this.logActivity({
      tenantId: params.tenantId,
      jobId: params.jobId,
      phase,
      title: `Status → ${params.newStatus.replace(/_/g, " ")}`,
      description: `Job "${params.jobTitle}" moved from ${params.oldStatus} to ${params.newStatus}.`,
      metadata: { oldStatus: params.oldStatus, newStatus: params.newStatus },
    });
  }

  // -----------------------------------------------------------------------
  // Auto transitions: when project status changes
  // -----------------------------------------------------------------------

  async onProjectStatusChanged(params: {
    tenantId: string;
    jobId: string;
    projectId: string;
    oldStatus: ProjectStatus;
    newStatus: ProjectStatus;
    projectTitle: string;
  }): Promise<void> {
    const phase = PROJECT_STATUS_PHASE[params.newStatus];
    if (phase) {
      await this.logActivity({
        tenantId: params.tenantId,
        jobId: params.jobId,
        projectId: params.projectId,
        phase,
        title: `Project ${params.newStatus.toLowerCase().replace(/_/g, " ")}`,
        description: `Project "${params.projectTitle}" moved to ${params.newStatus}.`,
        metadata: { oldStatus: params.oldStatus, newStatus: params.newStatus },
      });
    }
  }

  // -----------------------------------------------------------------------
  // Milestone event
  // -----------------------------------------------------------------------

  async onMilestoneCompleted(params: {
    tenantId: string;
    jobId: string;
    projectId: string;
    milestoneTitle: string;
    milestoneAmount?: number | null;
  }): Promise<void> {
    await this.logActivity({
      tenantId: params.tenantId,
      jobId: params.jobId,
      projectId: params.projectId,
      phase: "MILESTONE_COMPLETED",
      title: `Milestone completed: ${params.milestoneTitle}`,
      description: params.milestoneAmount
        ? `$${params.milestoneAmount.toLocaleString()} milestone approved.`
        : `Milestone "${params.milestoneTitle}" approved.`,
      metadata: { milestoneTitle: params.milestoneTitle, amount: params.milestoneAmount },
    });
  }

  // -----------------------------------------------------------------------
  // Job captured (initial phase)
  // -----------------------------------------------------------------------

  async onJobCaptured(params: {
    tenantId: string;
    jobId: string;
    jobTitle: string;
    source: string;
  }): Promise<void> {
    await this.logActivity({
      tenantId: params.tenantId,
      jobId: params.jobId,
      phase: "DISCOVERED",
      title: "Job discovered",
      description: `"${params.jobTitle}" captured from ${params.source}.`,
      metadata: { source: params.source },
    });
  }

  // -----------------------------------------------------------------------
  // Get full timeline for a job
  // -----------------------------------------------------------------------

  async getJobTimeline(jobId: string) {
    return this.prisma.jobActivity.findMany({
      where: { job_id: jobId },
      orderBy: { created_at: "asc" },
    });
  }

  // -----------------------------------------------------------------------
  // Get pipeline overview (all jobs grouped by phase)
  // -----------------------------------------------------------------------

  async getPipeline(tenantId: string) {
    // Get latest phase per job
    const jobs = await this.prisma.job.findMany({
      where: { tenant_id: tenantId, is_duplicate: false },
      select: {
        id: true,
        title: true,
        status: true,
        job_type: true,
        budget_min: true,
        budget_max: true,
        hourly_rate_min: true,
        hourly_rate_max: true,
        client_country: true,
        client_rating: true,
        posted_at: true,
        created_at: true,
        skills_required: true,
        proposals: {
          select: {
            id: true,
            status: true,
            proposed_rate: true,
          },
          orderBy: { created_at: "desc" },
          take: 1,
        },
        projects: {
          select: {
            id: true,
            status: true,
            total_earned: true,
          },
          take: 1,
        },
        activities: {
          orderBy: { created_at: "desc" },
          take: 1,
          select: {
            phase: true,
            created_at: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return jobs.map((j) => {
      const latestPhase = j.activities[0]?.phase ?? JOB_STATUS_PHASE[j.status];
      const lastActivityAt = j.activities[0]?.created_at ?? j.created_at;
      const proposal = j.proposals[0] ?? null;
      const project = j.projects[0] ?? null;

      return {
        jobId: j.id,
        title: j.title,
        jobStatus: j.status,
        phase: latestPhase,
        lastActivityAt: lastActivityAt.toISOString(),
        jobType: j.job_type,
        budgetMin: j.budget_min ? Number(j.budget_min) : null,
        budgetMax: j.budget_max ? Number(j.budget_max) : null,
        clientCountry: j.client_country,
        clientRating: j.client_rating ? Number(j.client_rating) : null,
        postedAt: j.posted_at?.toISOString() ?? null,
        skillsRequired: j.skills_required,
        proposalId: proposal?.id ?? null,
        proposalStatus: proposal?.status ?? null,
        proposedRate: proposal?.proposed_rate ? Number(proposal.proposed_rate) : null,
        projectId: project?.id ?? null,
        projectStatus: project?.status ?? null,
        totalEarned: project?.total_earned ? Number(project.total_earned) : null,
      };
    });
  }

  // -----------------------------------------------------------------------
  // Pipeline stats (counts by phase)
  // -----------------------------------------------------------------------

  async getPipelineStats(tenantId: string) {
    const pipeline = await this.getPipeline(tenantId);

    const phases: JourneyPhase[] = [
      "DISCOVERED",
      "ANALYZED",
      "SHORTLISTED",
      "PROPOSAL_DRAFTED",
      "PROPOSAL_SENT",
      "INTERVIEWING",
      "WON",
      "PROJECT_STARTED",
      "MILESTONE_COMPLETED",
      "PROJECT_DELIVERED",
      "PAYMENT_RECEIVED",
      "FEEDBACK_RECEIVED",
      "LOST",
      "SKIPPED",
      "EXPIRED",
    ];

    const counts: Record<string, number> = {};
    for (const p of phases) {
      counts[p] = 0;
    }
    for (const item of pipeline) {
      counts[item.phase] = (counts[item.phase] ?? 0) + 1;
    }

    // Calculate conversion rates
    const totalJobs = pipeline.length;
    const proposalsSent = pipeline.filter((p) => this.phaseOrder(p.phase) >= this.phaseOrder("PROPOSAL_SENT")).length;
    const won = pipeline.filter((p) => this.phaseOrder(p.phase) >= this.phaseOrder("WON")).length;
    const delivered = pipeline.filter((p) => this.phaseOrder(p.phase) >= this.phaseOrder("PROJECT_DELIVERED")).length;

    return {
      totalJobs,
      phaseCounts: counts,
      conversionRates: {
        discoveredToProposal: totalJobs > 0 ? Math.round((proposalsSent / totalJobs) * 100) : 0,
        proposalToWon: proposalsSent > 0 ? Math.round((won / proposalsSent) * 100) : 0,
        wonToDelivered: won > 0 ? Math.round((delivered / won) * 100) : 0,
      },
    };
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  private shouldAdvanceJobStatus(current: JobStatus, target: JobStatus): boolean {
    const order: JobStatus[] = [
      "NEW",
      "ANALYZED",
      "SHORTLISTED",
      "BIDDING",
      "BID_SENT",
      "INTERVIEWING",
      "ACCEPTED",
    ];
    const currentIdx = order.indexOf(current);
    const targetIdx = order.indexOf(target);
    // If either status isn't in the linear chain, skip auto-advance
    if (currentIdx === -1 || targetIdx === -1) return false;
    return targetIdx > currentIdx;
  }

  private phaseOrder(phase: JourneyPhase): number {
    const order: JourneyPhase[] = [
      "DISCOVERED",
      "ANALYZED",
      "SHORTLISTED",
      "PROPOSAL_DRAFTED",
      "PROPOSAL_SENT",
      "INTERVIEWING",
      "OFFER_RECEIVED",
      "WON",
      "PROJECT_STARTED",
      "MILESTONE_COMPLETED",
      "PROJECT_DELIVERED",
      "PAYMENT_RECEIVED",
      "FEEDBACK_RECEIVED",
      "LOST",
      "SKIPPED",
      "EXPIRED",
    ];
    return order.indexOf(phase);
  }
}

