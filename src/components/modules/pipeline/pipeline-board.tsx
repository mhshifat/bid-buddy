"use client";

/**
 * Pipeline Board — visual kanban-style view of all jobs across journey phases.
 */

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc/client";
import { EmptyState } from "@/components/shared/empty-state";
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
  Kanban,
  List,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Phase config
// ---------------------------------------------------------------------------

interface PhaseConfig {
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}

const PHASE_CONFIG: Record<string, PhaseConfig> = {
  DISCOVERED: { label: "Discovered", icon: Eye, color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-950", borderColor: "border-blue-200 dark:border-blue-800" },
  ANALYZED: { label: "Analyzed", icon: Brain, color: "text-indigo-600", bgColor: "bg-indigo-50 dark:bg-indigo-950", borderColor: "border-indigo-200 dark:border-indigo-800" },
  SHORTLISTED: { label: "Shortlisted", icon: Star, color: "text-yellow-600", bgColor: "bg-yellow-50 dark:bg-yellow-950", borderColor: "border-yellow-200 dark:border-yellow-800" },
  PROPOSAL_DRAFTED: { label: "Drafting", icon: FileEdit, color: "text-orange-600", bgColor: "bg-orange-50 dark:bg-orange-950", borderColor: "border-orange-200 dark:border-orange-800" },
  PROPOSAL_SENT: { label: "Bid Sent", icon: Send, color: "text-cyan-600", bgColor: "bg-cyan-50 dark:bg-cyan-950", borderColor: "border-cyan-200 dark:border-cyan-800" },
  INTERVIEWING: { label: "Interviewing", icon: MessageSquare, color: "text-teal-600", bgColor: "bg-teal-50 dark:bg-teal-950", borderColor: "border-teal-200 dark:border-teal-800" },
  OFFER_RECEIVED: { label: "Offer", icon: Gift, color: "text-pink-600", bgColor: "bg-pink-50 dark:bg-pink-950", borderColor: "border-pink-200 dark:border-pink-800" },
  WON: { label: "Won", icon: Trophy, color: "text-emerald-600", bgColor: "bg-emerald-50 dark:bg-emerald-950", borderColor: "border-emerald-200 dark:border-emerald-800" },
  PROJECT_STARTED: { label: "In Progress", icon: Rocket, color: "text-violet-600", bgColor: "bg-violet-50 dark:bg-violet-950", borderColor: "border-violet-200 dark:border-violet-800" },
  MILESTONE_COMPLETED: { label: "Milestone", icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-50 dark:bg-green-950", borderColor: "border-green-200 dark:border-green-800" },
  PROJECT_DELIVERED: { label: "Delivered", icon: CheckCircle, color: "text-emerald-700", bgColor: "bg-emerald-50 dark:bg-emerald-950", borderColor: "border-emerald-200 dark:border-emerald-800" },
  PAYMENT_RECEIVED: { label: "Paid", icon: DollarSign, color: "text-green-700", bgColor: "bg-green-50 dark:bg-green-950", borderColor: "border-green-200 dark:border-green-800" },
  FEEDBACK_RECEIVED: { label: "Reviewed", icon: ThumbsUp, color: "text-amber-700", bgColor: "bg-amber-50 dark:bg-amber-950", borderColor: "border-amber-200 dark:border-amber-800" },
  LOST: { label: "Lost", icon: XCircle, color: "text-red-600", bgColor: "bg-red-50 dark:bg-red-950", borderColor: "border-red-200 dark:border-red-800" },
  SKIPPED: { label: "Skipped", icon: SkipForward, color: "text-gray-500", bgColor: "bg-gray-50 dark:bg-gray-900", borderColor: "border-gray-200 dark:border-gray-800" },
  EXPIRED: { label: "Expired", icon: Clock, color: "text-gray-400", bgColor: "bg-gray-50 dark:bg-gray-900", borderColor: "border-gray-200 dark:border-gray-800" },
};

/** Phases in pipeline order for the active flow */
const ACTIVE_PHASES = [
  "DISCOVERED",
  "ANALYZED",
  "SHORTLISTED",
  "PROPOSAL_DRAFTED",
  "PROPOSAL_SENT",
  "INTERVIEWING",
  "WON",
  "PROJECT_STARTED",
  "PROJECT_DELIVERED",
  "PAYMENT_RECEIVED",
  "FEEDBACK_RECEIVED",
];

const CLOSED_PHASES = ["LOST", "SKIPPED", "EXPIRED"];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PipelineItem {
  jobId: string;
  title: string;
  jobStatus: string;
  phase: string;
  lastActivityAt: string;
  jobType: string;
  budgetMin: number | null;
  budgetMax: number | null;
  clientCountry: string | null;
  clientRating: number | null;
  postedAt: string | null;
  skillsRequired: string[];
  proposalId: string | null;
  proposalStatus: string | null;
  proposedRate: number | null;
  projectId: string | null;
  projectStatus: string | null;
  totalEarned: number | null;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function PipelineBoard() {
  const { data, isLoading, error } = trpc.pipeline.overview.useQuery();
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");

  const grouped = useMemo(() => {
    if (!data) return {};
    const groups: Record<string, PipelineItem[]> = {};
    for (const item of data) {
      const phase = item.phase;
      if (!groups[phase]) groups[phase] = [];
      groups[phase].push(item);
    }
    return groups;
  }, [data]);

  if (isLoading) {
    return <PipelineBoardSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Failed to load pipeline data.
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={Kanban}
        title="No jobs in pipeline"
        description="Capture jobs from Upwork to start tracking your journey."
      />
    );
  }

  return (
    <Tabs defaultValue="active" className="space-y-4">
      <div className="flex items-center justify-between">
        <TabsList>
          <TabsTrigger value="active">Active Pipeline</TabsTrigger>
          <TabsTrigger value="closed">
            Closed ({CLOSED_PHASES.reduce((sum, p) => sum + (grouped[p]?.length ?? 0), 0)})
          </TabsTrigger>
        </TabsList>
        <div className="flex gap-1 rounded-lg border p-1">
          <button
            onClick={() => setViewMode("kanban")}
            className={`rounded-md p-1.5 transition-colors ${viewMode === "kanban" ? "bg-muted" : "hover:bg-muted/50"}`}
            title="Kanban view"
          >
            <Kanban className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`rounded-md p-1.5 transition-colors ${viewMode === "list" ? "bg-muted" : "hover:bg-muted/50"}`}
            title="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      <TabsContent value="active">
        {viewMode === "kanban" ? (
          <KanbanView phases={ACTIVE_PHASES} grouped={grouped} />
        ) : (
          <ListView phases={ACTIVE_PHASES} grouped={grouped} />
        )}
      </TabsContent>

      <TabsContent value="closed">
        {viewMode === "kanban" ? (
          <KanbanView phases={CLOSED_PHASES} grouped={grouped} />
        ) : (
          <ListView phases={CLOSED_PHASES} grouped={grouped} />
        )}
      </TabsContent>
    </Tabs>
  );
}

// ---------------------------------------------------------------------------
// Kanban View
// ---------------------------------------------------------------------------

function KanbanView({ phases, grouped }: { phases: string[]; grouped: Record<string, PipelineItem[]> }) {
  const nonEmptyPhases = phases.filter((p) => (grouped[p]?.length ?? 0) > 0);

  if (nonEmptyPhases.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No jobs in this section.
        </CardContent>
      </Card>
    );
  }

  return (
    <ScrollArea className="w-full">
      <div className="flex gap-4 pb-4" style={{ minWidth: nonEmptyPhases.length * 280 }}>
        {nonEmptyPhases.map((phase) => {
          const config = PHASE_CONFIG[phase];
          const items = grouped[phase] ?? [];
          if (!config) return null;

          return (
            <div key={phase} className={`w-[270px] shrink-0 rounded-xl border ${config.borderColor} ${config.bgColor} p-3`}>
              <div className="flex items-center gap-2 mb-3">
                <config.icon className={`h-4 w-4 ${config.color}`} />
                <span className="text-sm font-semibold">{config.label}</span>
                <Badge variant="secondary" className="ml-auto text-[10px]">
                  {items.length}
                </Badge>
              </div>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {items.map((item) => (
                  <PipelineCard key={item.jobId} item={item} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

// ---------------------------------------------------------------------------
// List View
// ---------------------------------------------------------------------------

function ListView({ phases, grouped }: { phases: string[]; grouped: Record<string, PipelineItem[]> }) {
  const allItems = phases.flatMap((p) => grouped[p] ?? []);

  if (allItems.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No jobs in this section.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {allItems.map((item) => {
        const config = PHASE_CONFIG[item.phase];
        if (!config) return null;

        return (
          <Link
            key={item.jobId}
            href={`/jobs/${item.jobId}`}
            className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
          >
            <div className={`rounded-lg p-2 ${config.bgColor}`}>
              <config.icon className={`h-4 w-4 ${config.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.title}</p>
              <p className="text-xs text-muted-foreground">
                {config.label}
                {item.clientCountry && ` · ${item.clientCountry}`}
                {item.proposalStatus && ` · Proposal: ${item.proposalStatus}`}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {item.budgetMax && (
                <span className="text-xs font-medium">
                  ${item.budgetMax.toLocaleString()}
                </span>
              )}
              {item.totalEarned !== null && item.totalEarned > 0 && (
                <Badge variant="outline" className="text-[10px] bg-emerald-100 text-emerald-700">
                  ${item.totalEarned.toLocaleString()} earned
                </Badge>
              )}
              <span className="text-[10px] text-muted-foreground">
                {formatTimeAgo(item.lastActivityAt)}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pipeline Card (used in kanban)
// ---------------------------------------------------------------------------

function PipelineCard({ item }: { item: PipelineItem }) {
  return (
    <Link href={`/jobs/${item.jobId}`}>
      <Card className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.01]">
        <CardContent className="p-3">
          <p className="text-xs font-medium leading-snug line-clamp-2">
            {item.title}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1">
            {item.budgetMax && (
              <Badge variant="outline" className="text-[9px]">
                ${item.budgetMax.toLocaleString()}
              </Badge>
            )}
            {item.clientCountry && (
              <Badge variant="outline" className="text-[9px]">
                {item.clientCountry}
              </Badge>
            )}
            {item.clientRating !== null && item.clientRating > 0 && (
              <Badge variant="outline" className="text-[9px]">
                ★ {item.clientRating.toFixed(1)}
              </Badge>
            )}
          </div>
          {item.skillsRequired.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {item.skillsRequired.slice(0, 3).map((skill) => (
                <span
                  key={skill}
                  className="rounded-sm bg-muted px-1 py-0.5 text-[9px] text-muted-foreground"
                >
                  {skill}
                </span>
              ))}
              {item.skillsRequired.length > 3 && (
                <span className="text-[9px] text-muted-foreground">
                  +{item.skillsRequired.length - 3}
                </span>
              )}
            </div>
          )}
          <p className="mt-2 text-[10px] text-muted-foreground">
            {formatTimeAgo(item.lastActivityAt)}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function PipelineBoardSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="w-[270px] shrink-0 rounded-xl border bg-muted/30 p-3">
          <Skeleton className="h-5 w-24 mb-3" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, j) => (
              <Skeleton key={j} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimeAgo(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

