"use client";

/**
 * Realtime Toast Provider — auto-shows toast notifications for important events.
 *
 * Listens to the SSE event stream and fires Sonner toasts for
 * user-facing events. System/heartbeat events are silent.
 *
 * Also invalidates relevant tRPC queries so data refreshes automatically.
 */

import { useCallback } from "react";
import { toast } from "sonner";
import {
  Briefcase,
  Brain,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { useRealtimeEvents } from "@/hooks/use-realtime-events";
import { trpc } from "@/lib/trpc/client";
import type { RealtimeEvent } from "@/server/events/types";

/** Events that should trigger a visible toast */
const TOAST_EVENTS = new Set([
  "job:captured",
  "job:statusChanged",
  "ai:analysisComplete",
  "ai:analysisFailed",
  "proposal:generated",
  "proposal:statusChanged",
]);

export function RealtimeToastProvider() {
  const utils = trpc.useUtils();

  const handleEvent = useCallback(
    (event: RealtimeEvent) => {
      // Auto-invalidate relevant tRPC queries
      invalidateQueries(event, utils);

      // Only toast for user-facing events
      if (!TOAST_EVENTS.has(event.event)) return;

      switch (event.event) {
        case "job:captured":
          showJobCapturedToast(event);
          break;
        case "job:statusChanged":
          showJobStatusToast(event);
          break;
        case "ai:analysisComplete":
          showAiCompleteToast(event);
          break;
        case "ai:analysisFailed":
          showAiFailedToast(event);
          break;
        case "proposal:generated":
          showProposalToast(event);
          break;
        case "proposal:statusChanged":
          showProposalStatusToast(event);
          break;
      }
    },
    [utils],
  );

  // Connect the hook — the onEvent callback fires for every event
  useRealtimeEvents({
    autoConnect: true,
    onEvent: handleEvent,
  });

  // This component renders nothing — it only produces side effects (toasts)
  return null;
}

// ============================================================================
// Toast Functions
// ============================================================================

function showJobCapturedToast(event: RealtimeEvent): void {
  const data = event.data as { title: string; jobType: string };
  toast.success("New Job Captured", {
    description: `"${truncate(data.title, 60)}" (${data.jobType === "HOURLY" ? "Hourly" : "Fixed"})`,
    icon: <Briefcase className="h-4 w-4" />,
    duration: 5_000,
    action: {
      label: "View",
      onClick: () => {
        const jobData = event.data as { jobId: string };
        window.location.href = `/jobs/${jobData.jobId}`;
      },
    },
  });
}

function showJobStatusToast(event: RealtimeEvent): void {
  const data = event.data as { title: string; newStatus: string };
  toast.info("Job Status Updated", {
    description: `"${truncate(data.title, 50)}" → ${formatStatus(data.newStatus)}`,
    icon: <Briefcase className="h-4 w-4" />,
    duration: 4_000,
  });
}

function showAiCompleteToast(event: RealtimeEvent): void {
  const data = event.data as {
    jobTitle: string;
    recommendation: string | null;
    fitScore: number | null;
  };

  const detail = data.recommendation
    ? `Recommendation: ${data.recommendation}${data.fitScore ? ` (${data.fitScore}% fit)` : ""}`
    : "Analysis complete.";

  toast.success("AI Analysis Ready", {
    description: `"${truncate(data.jobTitle, 45)}" — ${detail}`,
    icon: <Brain className="h-4 w-4" />,
    duration: 6_000,
    action: {
      label: "View",
      onClick: () => {
        const jobData = event.data as { jobId: string };
        window.location.href = `/jobs/${jobData.jobId}`;
      },
    },
  });
}

function showAiFailedToast(event: RealtimeEvent): void {
  const data = event.data as {
    jobTitle: string;
    error: string;
    correlationId: string;
  };

  toast.error("AI Analysis Failed", {
    description: `"${truncate(data.jobTitle, 45)}" — ${data.error}`,
    icon: <AlertTriangle className="h-4 w-4" />,
    duration: 8_000,
    action: {
      label: "Copy ID",
      onClick: () => {
        navigator.clipboard.writeText(data.correlationId).catch(() => {
          // clipboard not available
        });
      },
    },
  });
}

function showProposalToast(event: RealtimeEvent): void {
  const data = event.data as {
    jobTitle: string;
    aiGenerated: boolean;
  };

  toast.success("Proposal Generated", {
    description: `${data.aiGenerated ? "AI-generated p" : "P"}roposal for "${truncate(data.jobTitle, 50)}"`,
    icon: <FileText className="h-4 w-4" />,
    duration: 5_000,
  });
}

function showProposalStatusToast(event: RealtimeEvent): void {
  const data = event.data as {
    jobTitle: string;
    newStatus: string;
  };

  toast.info("Proposal Updated", {
    description: `Proposal for "${truncate(data.jobTitle, 45)}" → ${formatStatus(data.newStatus)}`,
    icon: <FileText className="h-4 w-4" />,
    duration: 4_000,
  });
}

// ============================================================================
// Query Invalidation
// ============================================================================

function invalidateQueries(
  event: RealtimeEvent,
  utils: ReturnType<typeof trpc.useUtils>,
): void {
  switch (event.event) {
    case "job:captured":
    case "job:statusChanged":
      void utils.job.list.invalidate();
      void utils.job.stats.invalidate();
      void utils.dashboard.overview.invalidate();
      break;
    case "ai:analysisComplete":
    case "ai:analysisFailed": {
      const aiData = event.data as { jobId: string };
      void utils.job.getById.invalidate({ id: aiData.jobId });
      void utils.job.list.invalidate();
      break;
    }
    case "proposal:generated":
    case "proposal:statusChanged":
      void utils.proposal.list.invalidate();
      void utils.dashboard.overview.invalidate();
      break;
  }
}

// ============================================================================
// Helpers
// ============================================================================

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

function formatStatus(status: string): string {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

