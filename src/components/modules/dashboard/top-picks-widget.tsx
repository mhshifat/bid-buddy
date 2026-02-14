"use client";

/**
 * Top Picks Widget — bento card showing highest-scored jobs
 * with staggered list animations and glass-morphism.
 */

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, TrendingUp, Sparkles, MapPin } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { EmptyState } from "@/components/shared/empty-state";

function getScoreColor(score: number): string {
  if (score >= 70) return "text-emerald-600";
  if (score >= 40) return "text-amber-600";
  return "text-red-600";
}

function getScoreBg(score: number): string {
  if (score >= 70) return "bg-emerald-500/10";
  if (score >= 40) return "bg-amber-500/10";
  return "bg-red-500/10";
}

function getRecBadge(rec: string | null) {
  if (rec === "BID") return <Badge className="bg-emerald-100 text-emerald-700 text-[10px] rounded-md dark:bg-emerald-500/20 dark:text-emerald-300">BID</Badge>;
  if (rec === "CAUTIOUS") return <Badge className="bg-amber-100 text-amber-700 text-[10px] rounded-md dark:bg-amber-500/20 dark:text-amber-300">CAUTIOUS</Badge>;
  if (rec === "SKIP") return <Badge className="bg-red-100 text-red-700 text-[10px] rounded-md dark:bg-red-500/20 dark:text-red-300">SKIP</Badge>;
  return null;
}

export function TopPicksWidget() {
  const { data, isLoading } = trpc.dashboard.topPicks.useQuery();

  if (isLoading) {
    return (
      <div className="rounded-2xl border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-5 w-5 rounded-lg" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border p-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="mt-2 h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl border bg-card p-5">
        <h3 className="text-base font-semibold flex items-center gap-2 mb-4">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10">
            <Target className="h-3.5 w-3.5 text-primary" />
          </div>
          Today&apos;s Top Picks
        </h3>
        <EmptyState
          icon={Sparkles}
          title="No scored jobs yet"
          description="Run AI analysis on captured jobs to see your top picks here."
        />
      </div>
    );
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl border bg-card p-5 transition-all duration-300 hover:shadow-lg hover:shadow-black/5">
      <div className="shimmer-bg pointer-events-none absolute inset-0 rounded-2xl" />
      <div className="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 animate-float">
              <Target className="h-3.5 w-3.5 text-primary" />
            </div>
            Today&apos;s Top Picks
          </h3>
          <Link href="/jobs" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            View all →
          </Link>
        </div>

        <div className="space-y-2">
          {data.map((job, index) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className={`
                animate-fade-in-up stagger-${Math.min(index + 1, 6)}
                flex items-center justify-between rounded-xl border p-3 
                transition-all duration-200 hover:bg-muted/50 hover:border-primary/20
              `}
            >
              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-primary/10 text-[10px] font-bold text-primary">
                    {index + 1}
                  </span>
                  <p className="text-sm font-medium leading-tight truncate">{job.title}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground pl-7">
                  {job.skillsRequired.slice(0, 3).map((s) => (
                    <Badge key={s} variant="outline" className="text-[9px] font-normal rounded-md border-primary/20 bg-primary/5">
                      {s}
                    </Badge>
                  ))}
                  {job.clientCountry && (
                    <span className="flex items-center gap-0.5">
                      <MapPin className="h-2.5 w-2.5" /> {job.clientCountry}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex flex-col items-end gap-1">
                  <div className={`flex items-center gap-1 rounded-lg px-2 py-0.5 ${getScoreBg(job.fitScore)}`}>
                    <span className={`text-sm font-bold ${getScoreColor(job.fitScore)}`}>
                      {job.fitScore}%
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <TrendingUp className="h-2.5 w-2.5" /> {job.winProbability}% win
                  </span>
                </div>
                {getRecBadge(job.recommendation)}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
