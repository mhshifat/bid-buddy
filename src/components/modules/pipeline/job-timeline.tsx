"use client";

/**
 * Job Timeline — Immersive vertical timeline with animated connectors,
 * glowing phase dots, staggered card entry, and geometric accents.
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
  dotGlow: string;
  bgColor: string;
}

const PHASE_VISUALS: Record<string, PhaseVisual> = {
  DISCOVERED: { icon: Eye, color: "text-blue-500", dotColor: "bg-blue-500", dotGlow: "shadow-blue-500/40", bgColor: "bg-blue-500/5" },
  ANALYZED: { icon: Brain, color: "text-indigo-500", dotColor: "bg-indigo-500", dotGlow: "shadow-indigo-500/40", bgColor: "bg-indigo-500/5" },
  SHORTLISTED: { icon: Star, color: "text-yellow-500", dotColor: "bg-yellow-500", dotGlow: "shadow-yellow-500/40", bgColor: "bg-yellow-500/5" },
  PROPOSAL_DRAFTED: { icon: FileEdit, color: "text-orange-500", dotColor: "bg-orange-500", dotGlow: "shadow-orange-500/40", bgColor: "bg-orange-500/5" },
  PROPOSAL_SENT: { icon: Send, color: "text-cyan-500", dotColor: "bg-cyan-500", dotGlow: "shadow-cyan-500/40", bgColor: "bg-cyan-500/5" },
  INTERVIEWING: { icon: MessageSquare, color: "text-teal-500", dotColor: "bg-teal-500", dotGlow: "shadow-teal-500/40", bgColor: "bg-teal-500/5" },
  OFFER_RECEIVED: { icon: Gift, color: "text-pink-500", dotColor: "bg-pink-500", dotGlow: "shadow-pink-500/40", bgColor: "bg-pink-500/5" },
  WON: { icon: Trophy, color: "text-emerald-500", dotColor: "bg-emerald-500", dotGlow: "shadow-emerald-500/40", bgColor: "bg-emerald-500/5" },
  PROJECT_STARTED: { icon: Rocket, color: "text-violet-500", dotColor: "bg-violet-500", dotGlow: "shadow-violet-500/40", bgColor: "bg-violet-500/5" },
  MILESTONE_COMPLETED: { icon: CheckCircle, color: "text-green-500", dotColor: "bg-green-500", dotGlow: "shadow-green-500/40", bgColor: "bg-green-500/5" },
  PROJECT_DELIVERED: { icon: CheckCircle, color: "text-emerald-600", dotColor: "bg-emerald-600", dotGlow: "shadow-emerald-600/40", bgColor: "bg-emerald-500/5" },
  PAYMENT_RECEIVED: { icon: DollarSign, color: "text-green-600", dotColor: "bg-green-600", dotGlow: "shadow-green-600/40", bgColor: "bg-green-500/5" },
  FEEDBACK_RECEIVED: { icon: ThumbsUp, color: "text-amber-600", dotColor: "bg-amber-600", dotGlow: "shadow-amber-600/40", bgColor: "bg-amber-500/5" },
  LOST: { icon: XCircle, color: "text-red-500", dotColor: "bg-red-500", dotGlow: "shadow-red-500/40", bgColor: "bg-red-500/5" },
  SKIPPED: { icon: SkipForward, color: "text-gray-400", dotColor: "bg-gray-400", dotGlow: "shadow-gray-400/20", bgColor: "bg-gray-500/5" },
  EXPIRED: { icon: Clock, color: "text-gray-400", dotColor: "bg-gray-400", dotGlow: "shadow-gray-400/20", bgColor: "bg-gray-500/5" },
};

const DEFAULT_VISUAL: PhaseVisual = {
  icon: Activity,
  color: "text-gray-500",
  dotColor: "bg-gray-400",
  dotGlow: "shadow-gray-400/20",
  bgColor: "bg-gray-500/5",
};

// ---------------------------------------------------------------------------
// Decorative SVG accent for timeline header
// ---------------------------------------------------------------------------

function TimelineHeaderSvg() {
  return (
    <svg
      className="absolute right-0 top-0 h-full w-32 text-primary/5 pointer-events-none"
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="100" cy="20" r="60" stroke="currentColor" strokeWidth="0.5" />
      <circle cx="100" cy="20" r="40" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
      <circle cx="100" cy="20" r="20" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
    </svg>
  );
}

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
    <Card className="overflow-hidden border-border/50">
      <CardHeader className="relative pb-4">
        <TimelineHeaderSvg />
        <div className="relative z-10">
          <CardTitle className="flex items-center gap-2.5 text-base">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <Activity className="h-3.5 w-3.5 text-primary" />
            </div>
            Journey Timeline
          </CardTitle>
          <CardDescription className="mt-1">
            Track this job&apos;s progress from discovery to delivery.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pb-6">
        {isLoading ? (
          <TimelineSkeleton />
        ) : !data || data.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/50">
              <Activity className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
          </div>
        ) : (
          <div className="relative pl-8">
            {/* Animated vertical connector line */}
            <div className="absolute left-[15px] top-1 bottom-1 w-px">
              <div className="h-full w-full bg-gradient-to-b from-primary/30 via-border to-border/50" />
            </div>

            <div className="space-y-0">
              {data.map((activity, idx) => {
                const visual = PHASE_VISUALS[activity.phase] ?? DEFAULT_VISUAL;
                const PhaseIcon = visual.icon;
                const isLatest = idx === data.length - 1;
                const isFirst = idx === 0;

                return (
                  <div
                    key={activity.id}
                    className="animate-slide-in-left relative flex gap-3 pb-6 last:pb-0"
                    style={{ animationDelay: `${idx * 80}ms` }}
                  >
                    {/* Timeline dot — with glow on latest */}
                    <div
                      className={`
                        absolute -left-8 mt-0.5 flex h-[30px] w-[30px] items-center justify-center
                        rounded-full border-[3px] border-background
                        ${visual.dotColor}
                        shadow-lg ${isLatest ? visual.dotGlow : ""}
                        ${isLatest ? "animate-glow-pulse" : ""}
                        transition-all duration-300
                      `}
                    >
                      <PhaseIcon className="h-3.5 w-3.5 text-white" />
                    </div>

                    {/* Content card */}
                    <div
                      className={`
                        group flex-1 min-w-0 rounded-xl border border-border/40
                        ${visual.bgColor} p-3.5
                        transition-all duration-200 hover:border-border/70 hover:shadow-sm
                        ${isFirst ? "ring-1 ring-primary/10" : ""}
                      `}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold tracking-tight">
                              {activity.title}
                            </span>
                            {isFirst && (
                              <Badge className="text-[9px] px-1.5 py-0 h-4 bg-primary/10 text-primary hover:bg-primary/20 border-0 animate-scale-in">
                                Latest
                              </Badge>
                            )}
                          </div>
                          {activity.description && (
                            <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                              {activity.description}
                            </p>
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className="text-[9px] shrink-0 h-5 px-1.5 border-border/50"
                        >
                          {formatPhaseLabel(activity.phase)}
                        </Badge>
                      </div>

                      {/* Timestamp with dot indicator */}
                      <div className="mt-2 flex items-center gap-1.5">
                        <div className={`h-1 w-1 rounded-full ${visual.dotColor} opacity-60`} />
                        <time className="text-[10px] text-muted-foreground/70">
                          {formatDateTime(activity.createdAt)}
                        </time>
                      </div>
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
    <div className="relative pl-8 space-y-4">
      <div className="absolute left-[15px] top-1 bottom-1 w-px bg-border/50" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="relative flex gap-3">
          <Skeleton className="absolute -left-8 h-[30px] w-[30px] rounded-full" />
          <div className="flex-1 rounded-xl border border-border/30 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-48" />
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
