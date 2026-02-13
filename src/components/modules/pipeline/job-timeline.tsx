"use client";

/**
 * Job Timeline — visual activity feed showing the full journey of a single job.
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";
import {
  Eye,
  Brain,
  Star,
  FileEdit,
  Send,
  MessageSquare,
  Gift,
  Trophy,
  Rocket,
  CheckCircle,
  DollarSign,
  ThumbsUp,
  XCircle,
  SkipForward,
  Clock,
  Activity,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Phase visual config
// ---------------------------------------------------------------------------

interface PhaseVisual {
  icon: React.ElementType;
  color: string;
  dotColor: string;
}

const PHASE_VISUALS: Record<string, PhaseVisual> = {
  DISCOVERED: { icon: Eye, color: "text-blue-600", dotColor: "bg-blue-500" },
  ANALYZED: { icon: Brain, color: "text-indigo-600", dotColor: "bg-indigo-500" },
  SHORTLISTED: { icon: Star, color: "text-yellow-600", dotColor: "bg-yellow-500" },
  PROPOSAL_DRAFTED: { icon: FileEdit, color: "text-orange-600", dotColor: "bg-orange-500" },
  PROPOSAL_SENT: { icon: Send, color: "text-cyan-600", dotColor: "bg-cyan-500" },
  INTERVIEWING: { icon: MessageSquare, color: "text-teal-600", dotColor: "bg-teal-500" },
  OFFER_RECEIVED: { icon: Gift, color: "text-pink-600", dotColor: "bg-pink-500" },
  WON: { icon: Trophy, color: "text-emerald-600", dotColor: "bg-emerald-500" },
  PROJECT_STARTED: { icon: Rocket, color: "text-violet-600", dotColor: "bg-violet-500" },
  MILESTONE_COMPLETED: { icon: CheckCircle, color: "text-green-600", dotColor: "bg-green-500" },
  PROJECT_DELIVERED: { icon: CheckCircle, color: "text-emerald-700", dotColor: "bg-emerald-600" },
  PAYMENT_RECEIVED: { icon: DollarSign, color: "text-green-700", dotColor: "bg-green-600" },
  FEEDBACK_RECEIVED: { icon: ThumbsUp, color: "text-amber-700", dotColor: "bg-amber-600" },
  LOST: { icon: XCircle, color: "text-red-600", dotColor: "bg-red-500" },
  SKIPPED: { icon: SkipForward, color: "text-gray-500", dotColor: "bg-gray-400" },
  EXPIRED: { icon: Clock, color: "text-gray-400", dotColor: "bg-gray-300" },
};

const DEFAULT_VISUAL: PhaseVisual = { icon: Activity, color: "text-gray-500", dotColor: "bg-gray-400" };

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface JobTimelineProps {
  jobId: string;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function JobTimeline({ jobId }: JobTimelineProps) {
  const { data, isLoading } = trpc.pipeline.jobTimeline.useQuery(
    { jobId },
    { staleTime: 30_000, refetchOnWindowFocus: false }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4" />
          Journey Timeline
        </CardTitle>
        <CardDescription>
          Track this job&apos;s progress from discovery to delivery.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <TimelineSkeleton />
        ) : !data || data.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No activity recorded yet.
          </div>
        ) : (
          <div className="relative pl-6">
            {/* Vertical line */}
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />

            <div className="space-y-4">
              {data.map((activity, idx) => {
                const visual = PHASE_VISUALS[activity.phase] ?? DEFAULT_VISUAL;
                const PhaseIcon = visual.icon;
                const isLatest = idx === data.length - 1;

                return (
                  <div key={activity.id} className="relative flex gap-3">
                    {/* Dot on the timeline */}
                    <div
                      className={`absolute -left-6 mt-1 flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-background ${visual.dotColor} ${isLatest ? "ring-2 ring-offset-2 ring-offset-background ring-primary/30" : ""}`}
                    >
                      <PhaseIcon className="h-3 w-3 text-white" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{activity.title}</span>
                        <Badge variant="outline" className="text-[9px] shrink-0">
                          {formatPhaseLabel(activity.phase)}
                        </Badge>
                      </div>
                      {activity.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                          {activity.description}
                        </p>
                      )}
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {formatDateTime(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function TimelineSkeleton() {
  return (
    <div className="space-y-4 pl-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="h-5 w-5 rounded-full shrink-0" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-60" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPhaseLabel(phase: string): string {
  return phase.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDateTime(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

