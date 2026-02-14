"use client";

/**
 * Weekly Digest Widget — bento card with grade badge, trend indicator,
 * glass-morphism, and AI-powered performance analysis.
 */

import { useState, useCallback, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, TrendingUp, TrendingDown, Minus, CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import type { WeeklyDigestResult } from "@/server/ai/types";

const gradeColors: Record<string, string> = {
  A: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300",
  B: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-500/20 dark:text-blue-300",
  C: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300",
  D: "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-500/20 dark:text-orange-300",
  F: "bg-red-100 text-red-700 border-red-300 dark:bg-red-500/20 dark:text-red-300",
};

const trendIcons: Record<string, React.ReactNode> = {
  improving: <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />,
  stable: <Minus className="h-3.5 w-3.5 text-amber-600" />,
  declining: <TrendingDown className="h-3.5 w-3.5 text-red-600" />,
};

export function WeeklyDigestWidget() {
  const [result, setResult] = useState<WeeklyDigestResult | null>(null);

  // Load cached result on mount
  const { data: cached } = trpc.ai.getCachedInsight.useQuery(
    { insightType: "WEEKLY_DIGEST" },
    { staleTime: Infinity, refetchOnWindowFocus: false }
  );

  useEffect(() => {
    if (cached?.result && !result) {
      setResult(cached.result as WeeklyDigestResult);
    }
  }, [cached, result]);

  const mutation = trpc.ai.weeklyDigest.useMutation({
    onSuccess: (data) => {
      setResult(data);
      toast.success("Weekly digest ready!", {
        description: `Grade: ${data.weeklyGrade} — ${data.trendDirection}`,
      });
    },
    onError: () => {
      toast.error("Failed to generate digest");
    },
  });

  const handleGenerate = useCallback(() => {
    setResult(null);
    mutation.mutate();
  }, [mutation]);

  if (mutation.isPending) {
    return (
      <div className="rounded-2xl border bg-card p-5">
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm font-medium">Generating your weekly digest…</p>
          <p className="mt-1 text-xs text-muted-foreground">Analysing proposals, jobs, and connects</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="relative overflow-hidden rounded-2xl border bg-card p-5">
        <div className="shimmer-bg pointer-events-none absolute inset-0 rounded-2xl" />
        <div className="relative z-10">
          <h3 className="text-base font-semibold flex items-center gap-2 mb-1">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 animate-float">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </div>
            Weekly Performance Digest
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            AI-powered analysis of your freelancing week
          </p>
          <div className="flex flex-col items-center py-4">
            <p className="text-sm text-muted-foreground mb-3">
              Get AI insights on your performance, win patterns, and action items
            </p>
            <Button size="sm" onClick={handleGenerate} className="rounded-xl">
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Digest
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl border bg-card p-5 transition-all duration-300 hover:shadow-lg hover:shadow-black/5">
      <div className="shimmer-bg pointer-events-none absolute inset-0 rounded-2xl" />
      <div className="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />

      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 animate-float">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </div>
            Weekly Digest
          </h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`rounded-md ${gradeColors[result.weeklyGrade]}`}>
              Grade: {result.weeklyGrade}
            </Badge>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              {trendIcons[result.trendDirection]}
              <span className="capitalize">{result.trendDirection}</span>
            </span>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">
          {result.summary}
        </p>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border p-2.5 text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/80">Win Rate</p>
            <p className="text-sm font-bold mt-0.5">{result.winRate}%</p>
          </div>
          <div className="rounded-xl border p-2.5 text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/80">Top Area</p>
            <p className="text-sm font-bold truncate mt-0.5">{result.topPerformingArea}</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Action Items</p>
          <ul className="space-y-1.5">
            {result.actionItems.map((item, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs">
                <CheckCircle className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs italic text-muted-foreground border-t pt-3">
          {result.motivationalNote}
        </p>

        <Button variant="ghost" size="sm" className="w-full rounded-xl" onClick={handleGenerate}>
          <Sparkles className="mr-1 h-3.5 w-3.5" /> Regenerate
        </Button>
      </div>
    </div>
  );
}
