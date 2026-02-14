"use client";

/**
 * Earnings Pipeline Widget — bento card showing projected income
 * from active proposals with glass-morphism styling.
 */

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingUp, ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

const statusColors: Record<string, string> = {
  SENT: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  VIEWED: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300",
  SHORTLISTED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
};

export function EarningsPipelineWidget() {
  const { data, isLoading } = trpc.dashboard.pipeline.useQuery();

  if (isLoading) {
    return (
      <div className="rounded-2xl border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-6 w-6 rounded-lg" />
          <Skeleton className="h-4 w-36" />
        </div>
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    );
  }

  if (!data || data.activeProposals === 0) {
    return (
      <div className="rounded-2xl border bg-card p-5">
        <h3 className="text-base font-semibold flex items-center gap-2 mb-4">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10">
            <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          Earnings Pipeline
        </h3>
        <div className="flex flex-col items-center justify-center py-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/50 mb-3 animate-float">
            <DollarSign className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No active proposals in pipeline</p>
          <p className="text-xs text-muted-foreground">Submit proposals to see your projected earnings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl border bg-card p-5 transition-all duration-300 hover:shadow-lg hover:shadow-black/5">
      <div className="shimmer-bg pointer-events-none absolute inset-0 rounded-2xl" />
      <div className="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

      <div className="relative z-10">
        <div className="mb-4">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 animate-float">
              <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            Earnings Pipeline
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Projected income from {data.activeProposals} active proposals
          </p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-xl border p-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/80">If All Win</p>
            <p className="text-lg font-bold text-emerald-600 mt-0.5">
              ${data.totalEstimated.toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/80">Expected</p>
            <p className="text-lg font-bold text-primary mt-0.5">
              ${data.totalExpected.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Pipeline Items */}
        <div className="space-y-1.5">
          {data.items.slice(0, 5).map((item) => (
            <Link
              key={item.proposalId}
              href={`/jobs/${item.jobId}`}
              className="flex items-center justify-between rounded-xl border px-3 py-2 text-xs transition-all duration-200 hover:bg-muted/50 hover:border-primary/20"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Badge variant="outline" className={`text-[9px] shrink-0 rounded-md ${statusColors[item.status] ?? ""}`}>
                  {item.status}
                </Badge>
                <span className="truncate font-medium">{item.jobTitle}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="text-muted-foreground">
                  ${item.estimatedValue.toLocaleString()}
                </span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium flex items-center gap-0.5">
                  <TrendingUp className="h-3 w-3 text-emerald-600" />
                  ${item.expectedValue.toLocaleString()}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {data.items.length > 5 && (
          <Link
            href="/proposals"
            className="block text-center text-xs text-muted-foreground hover:text-foreground mt-3 transition-colors"
          >
            View all {data.items.length} proposals →
          </Link>
        )}
      </div>
    </div>
  );
}
