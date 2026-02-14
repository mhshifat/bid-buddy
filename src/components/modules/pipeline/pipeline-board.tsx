"use client";

/**
 * Pipeline Board — Immersive kanban / list view with glass-morphism columns,
 * geometric accent decorations, staggered card animations, and responsive layout.
 */

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
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
  MapPin,
  ArrowUpRight,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Phase config
// ---------------------------------------------------------------------------

interface PhaseConfig {
  label: string;
  icon: React.ElementType;
  color: string;
  iconBg: string;
  columnBg: string;
  columnBorder: string;
  glowColor: string;
}

const PHASE_CONFIG: Record<string, PhaseConfig> = {
  DISCOVERED: { label: "Discovered", icon: Eye, color: "text-blue-500", iconBg: "bg-blue-500", columnBg: "from-blue-500/5 to-transparent", columnBorder: "border-blue-200/60 dark:border-blue-800/40", glowColor: "shadow-blue-500/10" },
  ANALYZED: { label: "Analyzed", icon: Brain, color: "text-indigo-500", iconBg: "bg-indigo-500", columnBg: "from-indigo-500/5 to-transparent", columnBorder: "border-indigo-200/60 dark:border-indigo-800/40", glowColor: "shadow-indigo-500/10" },
  SHORTLISTED: { label: "Shortlisted", icon: Star, color: "text-yellow-500", iconBg: "bg-yellow-500", columnBg: "from-yellow-500/5 to-transparent", columnBorder: "border-yellow-200/60 dark:border-yellow-800/40", glowColor: "shadow-yellow-500/10" },
  PROPOSAL_DRAFTED: { label: "Drafting", icon: FileEdit, color: "text-orange-500", iconBg: "bg-orange-500", columnBg: "from-orange-500/5 to-transparent", columnBorder: "border-orange-200/60 dark:border-orange-800/40", glowColor: "shadow-orange-500/10" },
  PROPOSAL_SENT: { label: "Bid Sent", icon: Send, color: "text-cyan-500", iconBg: "bg-cyan-500", columnBg: "from-cyan-500/5 to-transparent", columnBorder: "border-cyan-200/60 dark:border-cyan-800/40", glowColor: "shadow-cyan-500/10" },
  INTERVIEWING: { label: "Interviewing", icon: MessageSquare, color: "text-teal-500", iconBg: "bg-teal-500", columnBg: "from-teal-500/5 to-transparent", columnBorder: "border-teal-200/60 dark:border-teal-800/40", glowColor: "shadow-teal-500/10" },
  OFFER_RECEIVED: { label: "Offer", icon: Gift, color: "text-pink-500", iconBg: "bg-pink-500", columnBg: "from-pink-500/5 to-transparent", columnBorder: "border-pink-200/60 dark:border-pink-800/40", glowColor: "shadow-pink-500/10" },
  WON: { label: "Won", icon: Trophy, color: "text-emerald-500", iconBg: "bg-emerald-500", columnBg: "from-emerald-500/5 to-transparent", columnBorder: "border-emerald-200/60 dark:border-emerald-800/40", glowColor: "shadow-emerald-500/10" },
  PROJECT_STARTED: { label: "In Progress", icon: Rocket, color: "text-violet-500", iconBg: "bg-violet-500", columnBg: "from-violet-500/5 to-transparent", columnBorder: "border-violet-200/60 dark:border-violet-800/40", glowColor: "shadow-violet-500/10" },
  MILESTONE_COMPLETED: { label: "Milestone", icon: CheckCircle, color: "text-green-500", iconBg: "bg-green-500", columnBg: "from-green-500/5 to-transparent", columnBorder: "border-green-200/60 dark:border-green-800/40", glowColor: "shadow-green-500/10" },
  PROJECT_DELIVERED: { label: "Delivered", icon: CheckCircle, color: "text-emerald-600", iconBg: "bg-emerald-600", columnBg: "from-emerald-500/5 to-transparent", columnBorder: "border-emerald-200/60 dark:border-emerald-800/40", glowColor: "shadow-emerald-500/10" },
  PAYMENT_RECEIVED: { label: "Paid", icon: DollarSign, color: "text-green-600", iconBg: "bg-green-600", columnBg: "from-green-500/5 to-transparent", columnBorder: "border-green-200/60 dark:border-green-800/40", glowColor: "shadow-green-500/10" },
  FEEDBACK_RECEIVED: { label: "Reviewed", icon: ThumbsUp, color: "text-amber-600", iconBg: "bg-amber-600", columnBg: "from-amber-500/5 to-transparent", columnBorder: "border-amber-200/60 dark:border-amber-800/40", glowColor: "shadow-amber-500/10" },
  LOST: { label: "Lost", icon: XCircle, color: "text-red-500", iconBg: "bg-red-500", columnBg: "from-red-500/5 to-transparent", columnBorder: "border-red-200/60 dark:border-red-800/40", glowColor: "shadow-red-500/10" },
  SKIPPED: { label: "Skipped", icon: SkipForward, color: "text-gray-400", iconBg: "bg-gray-400", columnBg: "from-gray-500/5 to-transparent", columnBorder: "border-gray-200/60 dark:border-gray-800/40", glowColor: "shadow-gray-500/10" },
  EXPIRED: { label: "Expired", icon: Clock, color: "text-gray-400", iconBg: "bg-gray-400", columnBg: "from-gray-500/5 to-transparent", columnBorder: "border-gray-200/60 dark:border-gray-800/40", glowColor: "shadow-gray-500/10" },
};

const ACTIVE_PHASES = [
  "DISCOVERED", "ANALYZED", "SHORTLISTED",
  "PROPOSAL_DRAFTED", "PROPOSAL_SENT", "INTERVIEWING",
  "WON", "PROJECT_STARTED", "PROJECT_DELIVERED",
  "PAYMENT_RECEIVED", "FEEDBACK_RECEIVED",
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
      if (!groups[item.phase]) groups[item.phase] = [];
      groups[item.phase].push(item);
    }
    return groups;
  }, [data]);

  if (isLoading) return <PipelineBoardSkeleton />;

  if (error) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Failed to load pipeline data. Please try again.
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

  const closedCount = CLOSED_PHASES.reduce((sum, p) => sum + (grouped[p]?.length ?? 0), 0);

  return (
    <div className="space-y-4 animate-fade-in-up stagger-3">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <Tabs defaultValue="active" className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList className="rounded-xl bg-muted/50 backdrop-blur-sm">
              <TabsTrigger value="active" className="rounded-lg data-[state=active]:shadow-sm">
                Active Pipeline
              </TabsTrigger>
              <TabsTrigger value="closed" className="rounded-lg data-[state=active]:shadow-sm">
                Closed
                {closedCount > 0 && (
                  <Badge variant="secondary" className="ml-1.5 h-5 text-[10px] px-1.5">
                    {closedCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-1 rounded-xl border bg-card/50 backdrop-blur-sm p-1">
              <button
                onClick={() => setViewMode("kanban")}
                className={`rounded-lg p-2 transition-all duration-200 ${
                  viewMode === "kanban"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                }`}
                title="Kanban view"
              >
                <Kanban className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`rounded-lg p-2 transition-all duration-200 ${
                  viewMode === "list"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                }`}
                title="List view"
              >
                <List className="h-3.5 w-3.5" />
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
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Kanban View — glass-morphism columns with staggered card entrance
// ---------------------------------------------------------------------------

function KanbanView({ phases, grouped }: { phases: string[]; grouped: Record<string, PipelineItem[]> }) {
  // Show ALL phases so users see the complete funnel — even empty stages
  const visiblePhases = phases.filter((p) => !!PHASE_CONFIG[p]);

  if (visiblePhases.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-muted/20 py-16 text-center">
        <p className="text-sm text-muted-foreground">No jobs in this section.</p>
      </div>
    );
  }

  return (
    // <div className="w-full overflow-x-auto max-w-[calc(100vw-(255px+64px))]">
    <div className="w-full">
      <ScrollArea className="w-full -mx-1 px-1">
        <div className="flex gap-3 pb-4" style={{ minWidth: visiblePhases.length * 260 }}>
          {visiblePhases.map((phase, colIdx) => {
            const config = PHASE_CONFIG[phase];
            const items = grouped[phase] ?? [];
            if (!config) return null;
            const PhaseIcon = config.icon;
            const isEmpty = items.length === 0;

            return (
              <div
                key={phase}
                className={`
                  animate-fade-in-up stagger-${Math.min(colIdx + 1, 6)}
                  w-[250px] shrink-0 rounded-2xl border
                  ${config.columnBorder}
                  bg-gradient-to-b ${config.columnBg}
                  backdrop-blur-sm p-3
                  transition-shadow duration-300
                  ${isEmpty ? "opacity-60" : ""}
                `}
              >
                {/* Column header */}
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-lg ${isEmpty ? "bg-muted" : config.iconBg} shadow-sm transition-colors`}>
                    <PhaseIcon className={`h-3 w-3 ${isEmpty ? "text-muted-foreground" : "text-white"}`} />
                  </div>
                  <span className={`text-sm font-semibold tracking-tight ${isEmpty ? "text-muted-foreground" : ""}`}>{config.label}</span>
                  <Badge
                    variant="secondary"
                    className={`ml-auto h-5 min-w-[20px] justify-center rounded-full text-[10px] font-bold px-1.5 ${isEmpty ? "opacity-50" : ""}`}
                  >
                    {items.length}
                  </Badge>
                </div>

                {isEmpty ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="rounded-full bg-muted/50 p-2.5 mb-2">
                      <PhaseIcon className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                    <p className="text-[10px] text-muted-foreground/50">No jobs yet</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[58vh] overflow-y-auto pr-1 scrollbar-thin">
                    {items.map((item, cardIdx) => (
                      <PipelineCard
                        key={item.jobId}
                        item={item}
                        config={config}
                        staggerIndex={cardIdx}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pipeline Card — glass card with hover micro-interactions
// ---------------------------------------------------------------------------

function PipelineCard({
  item,
  config,
  staggerIndex,
}: {
  item: PipelineItem;
  config: PhaseConfig;
  staggerIndex: number;
}) {
  return (
    <Link
      href={`/jobs/${item.jobId}`}
      className="block"
      style={{ animationDelay: `${staggerIndex * 60}ms` }}
    >
      <div
        className={`
          animate-fade-in-up
          group relative overflow-hidden rounded-xl border border-border/50
          bg-card/80 backdrop-blur-sm p-3
          transition-all duration-300 ease-out
          hover:bg-card hover:shadow-md hover:-translate-y-0.5 hover:border-border
        `}
      >
        {/* Hover gradient accent */}
        <div className={`absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-br ${config.columnBg}`} />

        <div className="relative z-10">
          {/* Title + arrow */}
          <div className="flex items-start gap-2">
            <p className="flex-1 text-xs font-medium leading-snug line-clamp-2 group-hover:text-foreground transition-colors">
              {item.title}
            </p>
            <ArrowUpRight className="h-3 w-3 shrink-0 text-muted-foreground/0 transition-all duration-200 group-hover:text-muted-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>

          {/* Meta badges */}
          <div className="mt-2 flex flex-wrap items-center gap-1">
            {item.budgetMax !== null && item.budgetMax > 0 && (
              <Badge variant="outline" className="text-[9px] font-semibold border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400">
                ${item.budgetMax.toLocaleString()}
              </Badge>
            )}
            {item.clientCountry && (
              <Badge variant="outline" className="text-[9px] gap-0.5">
                <MapPin className="h-2 w-2" />
                {item.clientCountry}
              </Badge>
            )}
            {item.clientRating !== null && item.clientRating > 0 && (
              <Badge variant="outline" className="text-[9px] gap-0.5 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400">
                <Star className="h-2 w-2 fill-current" />
                {item.clientRating.toFixed(1)}
              </Badge>
            )}
          </div>

          {/* Skills chips */}
          {item.skillsRequired.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {item.skillsRequired.slice(0, 2).map((skill) => (
                <span
                  key={skill}
                  className="rounded-md bg-muted/80 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground transition-colors group-hover:bg-muted"
                >
                  {skill}
                </span>
              ))}
              {item.skillsRequired.length > 2 && (
                <span className="rounded-md bg-muted/50 px-1.5 py-0.5 text-[9px] text-muted-foreground">
                  +{item.skillsRequired.length - 2}
                </span>
              )}
            </div>
          )}

          {/* Time ago */}
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground/70">
              {formatTimeAgo(item.lastActivityAt)}
            </span>
            {item.totalEarned !== null && item.totalEarned > 0 && (
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 animate-scale-in">
                ${item.totalEarned.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// List View — clean rows with phase indicators
// ---------------------------------------------------------------------------

function ListView({ phases, grouped }: { phases: string[]; grouped: Record<string, PipelineItem[]> }) {
  const allItems = phases.flatMap((p) => grouped[p] ?? []);

  if (allItems.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-muted/20 py-16 text-center">
        <p className="text-sm text-muted-foreground">No jobs in this section.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {allItems.map((item, idx) => {
        const config = PHASE_CONFIG[item.phase];
        if (!config) return null;
        const PhaseIcon = config.icon;

        return (
          <Link
            key={item.jobId}
            href={`/jobs/${item.jobId}`}
            className={`
              animate-fade-in-up
              group flex items-center gap-3 rounded-xl border border-border/50
              bg-card/60 backdrop-blur-sm p-3.5
              transition-all duration-200
              hover:bg-card hover:shadow-sm hover:border-border hover:-translate-x-0.5
            `}
            style={{ animationDelay: `${idx * 40}ms` }}
          >
            {/* Phase icon */}
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.iconBg} shadow-sm transition-transform duration-200 group-hover:scale-110`}>
              <PhaseIcon className="h-3.5 w-3.5 text-white" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate group-hover:text-foreground transition-colors">
                {item.title}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className="text-[9px] h-4 px-1.5">
                  {config.label}
                </Badge>
                {item.clientCountry && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <MapPin className="h-2.5 w-2.5" /> {item.clientCountry}
                  </span>
                )}
                {item.proposalStatus && (
                  <span className="text-[10px] text-muted-foreground">
                    Proposal: {item.proposalStatus}
                  </span>
                )}
              </div>
            </div>

            {/* Right side meta */}
            <div className="flex items-center gap-3 shrink-0">
              {item.budgetMax !== null && item.budgetMax > 0 && (
                <span className="text-xs font-semibold text-foreground/80">
                  ${item.budgetMax.toLocaleString()}
                </span>
              )}
              {item.totalEarned !== null && item.totalEarned > 0 && (
                <Badge className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border-0">
                  ${item.totalEarned.toLocaleString()} earned
                </Badge>
              )}
              <span className="text-[10px] text-muted-foreground/60 w-12 text-right">
                {formatTimeAgo(item.lastActivityAt)}
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/0 transition-all duration-200 group-hover:text-muted-foreground" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function PipelineBoardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-52 rounded-xl" />
        <Skeleton className="h-9 w-20 rounded-xl" />
      </div>
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-[270px] shrink-0 rounded-2xl border bg-muted/10 p-3">
            <div className="flex items-center gap-2 mb-3">
              <Skeleton className="h-6 w-6 rounded-lg" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimeAgo(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}
