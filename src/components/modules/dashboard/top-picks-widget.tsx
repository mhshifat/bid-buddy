"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

function getRecBadge(rec: string | null) {
  if (rec === "BID") return <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">BID</Badge>;
  if (rec === "CAUTIOUS") return <Badge className="bg-amber-100 text-amber-700 text-[10px]">CAUTIOUS</Badge>;
  if (rec === "SKIP") return <Badge className="bg-red-100 text-red-700 text-[10px]">SKIP</Badge>;
  return null;
}

export function TopPicksWidget() {
  const { data, isLoading } = trpc.dashboard.topPicks.useQuery();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" /> Today&apos;s Top Picks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="mt-2 h-3 w-1/2" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" /> Today&apos;s Top Picks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Sparkles}
            title="No scored jobs yet"
            description="Run AI analysis on captured jobs to see your top picks here."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" /> Today&apos;s Top Picks
        </CardTitle>
        <Link href="/jobs" className="text-xs text-muted-foreground hover:text-foreground">
          View all →
        </Link>
      </CardHeader>
      <CardContent className="space-y-2">
        {data.map((job, index) => (
          <Link
            key={job.id}
            href={`/jobs/${job.id}`}
            className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
          >
            <div className="flex-1 space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                  {index + 1}
                </span>
                <p className="text-sm font-medium leading-tight truncate">{job.title}</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground pl-7">
                {job.skillsRequired.slice(0, 3).map((s) => (
                  <Badge key={s} variant="outline" className="text-[9px] font-normal">
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
              <div className="flex flex-col items-end gap-0.5">
                <span className={`text-sm font-bold ${getScoreColor(job.fitScore)}`}>
                  {job.fitScore}%
                </span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <TrendingUp className="h-2.5 w-2.5" /> {job.winProbability}% win
                </span>
              </div>
              {getRecBadge(job.recommendation)}
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

