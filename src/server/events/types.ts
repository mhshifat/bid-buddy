/**
 * Typed event definitions for the real-time notification system.
 *
 * All events flowing through the EventBus must be defined here.
 * The client-side hook uses the same types for type-safe consumption.
 */

// ============================================================================
// Event Categories
// ============================================================================

export type EventCategory = "job" | "ai" | "proposal" | "project" | "system" | "alert";

// ============================================================================
// Event Payloads
// ============================================================================

export interface JobCapturedPayload {
  jobId: string;
  title: string;
  jobType: "HOURLY" | "FIXED_PRICE";
  jobUrl: string;
  skillsRequired: string[];
  capturedAt: string;
}

export interface JobStatusChangedPayload {
  jobId: string;
  title: string;
  previousStatus: string;
  newStatus: string;
}

export interface AiAnalysisStartedPayload {
  jobId: string;
  jobTitle: string;
  analysisType: string;
}

export interface AiAnalysisCompletePayload {
  jobId: string;
  jobTitle: string;
  analysisType: string;
  analysisId: string;
  fitScore: number | null;
  fakeProbability: number | null;
  winProbability: number | null;
  recommendation: string | null;
}

export interface AiAnalysisFailedPayload {
  jobId: string;
  jobTitle: string;
  analysisType: string;
  error: string;
  correlationId: string;
}

export interface ProposalGeneratedPayload {
  proposalId: string;
  jobId: string;
  jobTitle: string;
  aiGenerated: boolean;
}

export interface ProposalStatusChangedPayload {
  proposalId: string;
  jobId: string;
  jobTitle: string;
  previousStatus: string;
  newStatus: string;
}

export interface SystemConnectedPayload {
  connectedAt: string;
  serverVersion: string;
}

export interface SystemHeartbeatPayload {
  timestamp: string;
}

export interface JobMatchAlertPayload {
  jobId: string;
  title: string;
  body: string;
  matchPercentage: number;
  jobUrl: string;
}

// ============================================================================
// Event Map — maps event names to their payload types
// ============================================================================

export interface EventMap {
  "job:captured": JobCapturedPayload;
  "job:statusChanged": JobStatusChangedPayload;
  "ai:analysisStarted": AiAnalysisStartedPayload;
  "ai:analysisComplete": AiAnalysisCompletePayload;
  "ai:analysisFailed": AiAnalysisFailedPayload;
  "proposal:generated": ProposalGeneratedPayload;
  "proposal:statusChanged": ProposalStatusChangedPayload;
  "system:connected": SystemConnectedPayload;
  "system:heartbeat": SystemHeartbeatPayload;
  "alert:jobMatch": JobMatchAlertPayload;
}

export type EventName = keyof EventMap;

// ============================================================================
// Wire format — the shape sent over SSE
// ============================================================================

export interface RealtimeEvent<T extends EventName = EventName> {
  id: string;
  event: T;
  data: EventMap[T];
  timestamp: string;
  tenantId?: string;
}

// ============================================================================
// Client-side notification shape
// ============================================================================

export interface NotificationItem {
  id: string;
  event: EventName;
  title: string;
  description: string;
  category: EventCategory;
  timestamp: string;
  read: boolean;
  href?: string;
}

/**
 * Map a RealtimeEvent to a user-friendly NotificationItem.
 */
export function eventToNotification(evt: RealtimeEvent): NotificationItem {
  const base = {
    id: evt.id,
    event: evt.event,
    timestamp: evt.timestamp,
    read: false,
  };

  switch (evt.event) {
    case "job:captured": {
      const d = evt.data as JobCapturedPayload;
      return {
        ...base,
        title: "New Job Captured",
        description: `"${truncate(d.title, 60)}" was captured from Upwork.`,
        category: "job",
        href: `/jobs/${d.jobId}`,
      };
    }
    case "job:statusChanged": {
      const d = evt.data as JobStatusChangedPayload;
      return {
        ...base,
        title: "Job Status Updated",
        description: `"${truncate(d.title, 50)}" moved to ${formatStatus(d.newStatus)}.`,
        category: "job",
        href: `/jobs/${d.jobId}`,
      };
    }
    case "ai:analysisStarted": {
      const d = evt.data as AiAnalysisStartedPayload;
      return {
        ...base,
        title: "AI Analysis Started",
        description: `Analyzing "${truncate(d.jobTitle, 50)}" (${formatAnalysisType(d.analysisType)}).`,
        category: "ai",
        href: `/jobs/${d.jobId}`,
      };
    }
    case "ai:analysisComplete": {
      const d = evt.data as AiAnalysisCompletePayload;
      const rec = d.recommendation ? ` — ${d.recommendation}` : "";
      return {
        ...base,
        title: "AI Analysis Complete",
        description: `"${truncate(d.jobTitle, 45)}" analysis done${rec}.`,
        category: "ai",
        href: `/jobs/${d.jobId}`,
      };
    }
    case "ai:analysisFailed": {
      const d = evt.data as AiAnalysisFailedPayload;
      return {
        ...base,
        title: "AI Analysis Failed",
        description: `Analysis of "${truncate(d.jobTitle, 50)}" failed: ${d.error}`,
        category: "ai",
        href: `/jobs/${d.jobId}`,
      };
    }
    case "proposal:generated": {
      const d = evt.data as ProposalGeneratedPayload;
      return {
        ...base,
        title: "Proposal Generated",
        description: `${d.aiGenerated ? "AI-generated p" : "P"}roposal for "${truncate(d.jobTitle, 50)}".`,
        category: "proposal",
        href: `/jobs/${d.jobId}`,
      };
    }
    case "proposal:statusChanged": {
      const d = evt.data as ProposalStatusChangedPayload;
      return {
        ...base,
        title: "Proposal Status Updated",
        description: `Proposal for "${truncate(d.jobTitle, 45)}" → ${formatStatus(d.newStatus)}.`,
        category: "proposal",
        href: `/jobs/${d.jobId}`,
      };
    }
    case "system:connected": {
      return {
        ...base,
        title: "Connected",
        description: "Real-time updates are active.",
        category: "system",
      };
    }
    case "system:heartbeat": {
      return {
        ...base,
        title: "Heartbeat",
        description: "Connection alive.",
        category: "system",
      };
    }
    case "alert:jobMatch": {
      const d = evt.data as JobMatchAlertPayload;
      return {
        ...base,
        title: d.title,
        description: d.body,
        category: "alert",
        href: d.jobUrl || `/jobs/${d.jobId}`,
      };
    }
    default:
      return {
        ...base,
        title: "Notification",
        description: "Something happened.",
        category: "system",
      };
  }
}

// ============================================================================
// Helpers
// ============================================================================

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

function formatStatus(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatAnalysisType(type: string): string {
  const map: Record<string, string> = {
    JOB_FIT: "Job Fit",
    FAKE_DETECTION: "Fake Detection",
    DUPLICATE_CHECK: "Duplicate Check",
    PROPOSAL_REVIEW: "Proposal Review",
    CLIENT_ANALYSIS: "Client Analysis",
  };
  return map[type] ?? type;
}

