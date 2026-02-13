"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, TrendingUp, TrendingDown, Minus, CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import type { WeeklyDigestResult } from "@/server/ai/types";

const gradeColors: Record<string, string> = {
  A: "bg-emerald-100 text-emerald-700 border-emerald-300",
  B: "bg-blue-100 text-blue-700 border-blue-300",
  C: "bg-amber-100 text-amber-700 border-amber-300",
  D: "bg-orange-100 text-orange-700 border-orange-300",
  F: "bg-red-100 text-red-700 border-red-300",
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
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm font-medium">Generating your weekly digest…</p>
          <p className="mt-1 text-xs text-muted-foreground">Analysing proposals, jobs, and connects</p>
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Weekly Performance Digest
          </CardTitle>
          <CardDescription className="text-xs">
            AI-powered analysis of your freelancing week
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center py-6">
          <p className="text-sm text-muted-foreground mb-3">
            Get AI insights on your performance, win patterns, and action items
          </p>
          <Button size="sm" onClick={handleGenerate}>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Digest
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Weekly Digest
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={gradeColors[result.weeklyGrade]}>
              Grade: {result.weeklyGrade}
            </Badge>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              {trendIcons[result.trendDirection]}
              <span className="capitalize">{result.trendDirection}</span>
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {result.summary}
        </p>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md border p-2 text-center">
            <p className="text-xs text-muted-foreground">Win Rate</p>
            <p className="text-sm font-bold">{result.winRate}%</p>
          </div>
          <div className="rounded-md border p-2 text-center">
            <p className="text-xs text-muted-foreground">Top Area</p>
            <p className="text-sm font-bold truncate">{result.topPerformingArea}</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1.5">Action Items</p>
          <ul className="space-y-1">
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

        <Button variant="ghost" size="sm" className="w-full" onClick={handleGenerate}>
          <Sparkles className="mr-1 h-3.5 w-3.5" /> Regenerate
        </Button>
      </CardContent>
    </Card>
  );
}

