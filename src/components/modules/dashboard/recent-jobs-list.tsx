"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";
import { ErrorDisplay } from "@/components/shared/error-display";
import { EmptyState } from "@/components/shared/empty-state";
import { Briefcase, ExternalLink } from "lucide-react";

const statusColorMap: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  ANALYZED:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  SHORTLISTED:
    "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  BIDDING:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  BID_SENT:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  INTERVIEWING:
    "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
  ACCEPTED:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  EXPIRED: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  SKIPPED: "bg-gray-100 text-gray-500 dark:bg-gray-900 dark:text-gray-400",
  FLAGGED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

function formatTimeAgo(date: Date | null): string {
  if (!date) return "Unknown";
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 7)}w ago`;
}

export function RecentJobsList() {
  const { data, isLoading, error, refetch } =
    trpc.dashboard.overview.useQuery();

  if (isLoading) {
    return <RecentJobsSkeleton />;
  }

  if (error) {
    const errorData = error.data as
      | { correlationId?: string; userMessage?: string }
      | undefined;
    return (
      <ErrorDisplay
        message={errorData?.userMessage ?? "Failed to load recent jobs."}
        correlationId={errorData?.correlationId}
        onRetry={() => refetch()}
      />
    );
  }

  if (!data || data.recentJobs.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <EmptyState
            icon={Briefcase}
            title="No jobs captured yet"
            description="Install the browser extension and browse Upwork to start capturing jobs."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Recent Jobs</CardTitle>
        <Link
          href="/jobs"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          View all →
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.recentJobs.map((job) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium leading-tight line-clamp-1">
                    {job.title}
                  </p>
                  <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{job.jobType === "HOURLY" ? "Hourly" : "Fixed"}</span>
                  {job.connectsRequired && (
                    <>
                      <span>·</span>
                      <span>{job.connectsRequired} connects</span>
                    </>
                  )}
                  {job.budgetMax && (
                    <>
                      <span>·</span>
                      <span>${job.budgetMax.toLocaleString()}</span>
                    </>
                  )}
                  <span>·</span>
                  <span>{formatTimeAgo(job.postedAt)}</span>
                </div>
              </div>
              <Badge
                variant="secondary"
                className={`ml-3 shrink-0 text-[10px] ${statusColorMap[job.status] ?? ""}`}
              >
                {job.status.replace(/_/g, " ")}
              </Badge>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RecentJobsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-28" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-2">
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

