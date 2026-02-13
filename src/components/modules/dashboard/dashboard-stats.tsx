"use client";

import {
  Briefcase,
  FileText,
  FolderKanban,
  Users,
  DollarSign,
  Zap,
  Clock,
  Target,
} from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";
import { ErrorDisplay } from "@/components/shared/error-display";

export function DashboardStats() {
  const { data, isLoading, error, refetch } =
    trpc.dashboard.overview.useQuery();

  if (isLoading) {
    return <DashboardStatsSkeleton />;
  }

  if (error) {
    const errorData = error.data as
      | { correlationId?: string; userMessage?: string }
      | undefined;
    return (
      <ErrorDisplay
        message={errorData?.userMessage ?? "Failed to load dashboard stats."}
        correlationId={errorData?.correlationId}
        onRetry={() => refetch()}
      />
    );
  }

  if (!data) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="New Jobs"
        value={data.jobs.new}
        description={`${data.jobs.total} total captured`}
        icon={Briefcase}
      />
      <StatCard
        title="Bids Sent"
        value={data.jobs.bidsSent}
        description={`${data.jobs.interviewing} interviewing`}
        icon={Target}
      />
      <StatCard
        title="Proposals"
        value={data.proposals.total}
        description={`${data.proposals.drafts} drafts`}
        icon={FileText}
      />
      <StatCard
        title="Active Projects"
        value={data.projects.active}
        description={`${data.projects.completed} completed`}
        icon={FolderKanban}
      />
      <StatCard
        title="Total Earnings"
        value={`$${data.projects.totalEarnings.toLocaleString()}`}
        description="From all projects"
        icon={DollarSign}
      />
      <StatCard
        title="Clients"
        value={data.clients.total}
        description={`${data.clients.active} active`}
        icon={Users}
      />
      <StatCard
        title="Jobs Accepted"
        value={data.jobs.accepted}
        description="Successfully landed"
        icon={Zap}
      />
      <StatCard
        title="Shortlisted"
        value={data.jobs.shortlisted}
        description="Ready to bid"
        icon={Clock}
      />
    </div>
  );
}

function DashboardStatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-lg border p-6">
          <div className="flex items-center justify-between pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4 rounded" />
          </div>
          <Skeleton className="mt-2 h-8 w-16" />
          <Skeleton className="mt-2 h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

