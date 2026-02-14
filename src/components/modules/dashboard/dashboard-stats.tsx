"use client";

/**
 * Dashboard Stats — bento grid of stat cards with staggered animations
 * and unique accent colors per metric.
 */

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
      <div className="animate-fade-in-up stagger-1">
        <StatCard
          title="New Jobs"
          value={data.jobs.new}
          description={`${data.jobs.total} total captured`}
          icon={Briefcase}
          iconBg="bg-blue-500"
        />
      </div>
      <div className="animate-fade-in-up stagger-2">
        <StatCard
          title="Bids Sent"
          value={data.jobs.bidsSent}
          description={`${data.jobs.interviewing} interviewing`}
          icon={Target}
          iconBg="bg-amber-500"
        />
      </div>
      <div className="animate-fade-in-up stagger-3">
        <StatCard
          title="Proposals"
          value={data.proposals.total}
          description={`${data.proposals.drafts} drafts`}
          icon={FileText}
          iconBg="bg-cyan-500"
        />
      </div>
      <div className="animate-fade-in-up stagger-4">
        <StatCard
          title="Active Projects"
          value={data.projects.active}
          description={`${data.projects.completed} completed`}
          icon={FolderKanban}
          iconBg="bg-emerald-500"
        />
      </div>
      <div className="animate-fade-in-up stagger-5">
        <StatCard
          title="Total Earnings"
          value={`$${data.projects.totalEarnings.toLocaleString()}`}
          description="From all projects"
          icon={DollarSign}
          iconBg="bg-green-600"
        />
      </div>
      <div className="animate-fade-in-up stagger-6">
        <StatCard
          title="Clients"
          value={data.clients.total}
          description={`${data.clients.active} active`}
          icon={Users}
          iconBg="bg-violet-500"
        />
      </div>
      <div className="animate-fade-in-up stagger-5">
        <StatCard
          title="Jobs Accepted"
          value={data.jobs.accepted}
          description="Successfully landed"
          icon={Zap}
          iconBg="bg-orange-500"
        />
      </div>
      <div className="animate-fade-in-up stagger-6">
        <StatCard
          title="Shortlisted"
          value={data.jobs.shortlisted}
          description="Ready to bid"
          icon={Clock}
          iconBg="bg-indigo-500"
        />
      </div>
    </div>
  );
}

function DashboardStatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-2xl border p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-14" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-10 w-10 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
