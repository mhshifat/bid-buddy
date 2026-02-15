"use client";

/**
 * Activity Trends Card — shows a 30-day activity chart
 * using a simple bar/sparkline visualization (no chart library needed).
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
import { BarChart3, Briefcase, Send, Trophy } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { ErrorDisplay } from "@/components/shared/error-display";

export function ActivityTrendsCard() {
  const { data, isLoading, error, refetch } =
    trpc.dashboard.activityTrends.useQuery(undefined, {
      staleTime: 5 * 60_000,
      refetchOnWindowFocus: false,
    });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-500" /> Activity Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    const errorData = error.data as
      | { correlationId?: string; userMessage?: string }
      | undefined;
    return (
      <ErrorDisplay
        message={errorData?.userMessage ?? "Failed to load activity trends."}
        correlationId={errorData?.correlationId}
        onRetry={() => refetch()}
      />
    );
  }

  if (!data || data.days.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-500" /> Activity Trends
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <BarChart3 className="h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            No activity data yet
          </p>
          <p className="text-xs text-muted-foreground">
            Capture jobs and send proposals to see trends
          </p>
        </CardContent>
      </Card>
    );
  }

  const maxJobs = Math.max(...data.days.map((d) => d.jobs), 1);
  const maxProposals = Math.max(...data.days.map((d) => d.proposals), 1);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-blue-500" /> Activity Trends
        </CardTitle>
        <CardDescription className="text-xs">
          Last 30 days — jobs captured vs proposals sent
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Summary Row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-md border p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground mb-0.5">
              <Briefcase className="h-3 w-3" /> Jobs
            </div>
            <p className="text-sm font-bold">{data.totalJobsCaptured}</p>
          </div>
          <div className="rounded-md border p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground mb-0.5">
              <Send className="h-3 w-3" /> Sent
            </div>
            <p className="text-sm font-bold">{data.totalProposalsSent}</p>
          </div>
          <div className="rounded-md border p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground mb-0.5">
              <Trophy className="h-3 w-3" /> Won
            </div>
            <p className="text-sm font-bold text-emerald-600">
              {data.totalWon}
            </p>
          </div>
        </div>

        {/* Bar Chart */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge
              variant="outline"
              className="text-[9px] gap-1 px-1.5 py-0.5"
            >
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />
              Jobs
            </Badge>
            <Badge
              variant="outline"
              className="text-[9px] gap-1 px-1.5 py-0.5"
            >
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-500" />
              Proposals
            </Badge>
          </div>

          <div className="flex items-end gap-px h-32 overflow-hidden">
            {data.days.map((day) => (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center justify-end gap-px group relative min-w-0"
              >
                {/* Tooltip on hover */}
                <div className="absolute bottom-full mb-1 hidden group-hover:block z-10 pointer-events-none">
                  <div className="rounded bg-popover border shadow-md px-2 py-1 text-[9px] whitespace-nowrap">
                    <p className="font-medium">{day.label}</p>
                    <p className="text-muted-foreground">
                      {day.jobs} job{day.jobs !== 1 ? "s" : ""} ·{" "}
                      {day.proposals} proposal{day.proposals !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                {/* Job bar */}
                <div
                  className="w-full rounded-t-sm bg-blue-500/70 transition-all duration-300"
                  style={{
                    height: `${Math.max((day.jobs / maxJobs) * 100, day.jobs > 0 ? 4 : 0)}%`,
                  }}
                />
                {/* Proposal bar */}
                <div
                  className="w-full rounded-t-sm bg-cyan-500/70 transition-all duration-300"
                  style={{
                    height: `${Math.max((day.proposals / maxProposals) * 100, day.proposals > 0 ? 4 : 0)}%`,
                  }}
                />
              </div>
            ))}
          </div>

          {/* X-axis labels (every ~7 days) */}
          <div className="flex justify-between mt-1.5">
            {data.days
              .filter((_, i) => i % 7 === 0 || i === data.days.length - 1)
              .map((day) => (
                <span
                  key={day.date}
                  className="text-[9px] text-muted-foreground"
                >
                  {day.label}
                </span>
              ))}
          </div>
        </div>

        {/* Daily average */}
        <div className="flex items-center justify-between rounded-lg border p-3 text-xs">
          <span className="text-muted-foreground">Daily Avg</span>
          <div className="flex items-center gap-3">
            <span className="font-medium">
              {(data.totalJobsCaptured / 30).toFixed(1)} jobs/day
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="font-medium">
              {(data.totalProposalsSent / 30).toFixed(1)} proposals/day
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}



