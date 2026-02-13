"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Sparkles,
  Loader2,
  ArrowUpRight,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";

interface WinPattern {
  pattern: string;
  confidence: "high" | "medium" | "low";
  impact: string;
  recommendation: string;
}

interface WinPatternResult {
  overallWinRate: number;
  patterns: WinPattern[];
  bestJobTypes: string[];
  bestSkillCombinations: string[];
  optimalRateRange: { min: number; max: number } | null;
  optimalProposalLength: string;
  topRecommendations: string[];
}

const confidenceColors: Record<string, string> = {
  high: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-gray-100 text-gray-700",
};

export function WinPatternsCard() {
  const [result, setResult] = useState<WinPatternResult | null>(null);

  // Load cached result on mount
  const { data: cached } = trpc.ai.getCachedInsight.useQuery(
    { insightType: "WIN_PATTERNS" },
    { staleTime: Infinity, refetchOnWindowFocus: false }
  );

  useEffect(() => {
    if (cached?.result && !result) {
      setResult(cached.result as WinPatternResult);
    }
  }, [cached, result]);

  const mutation = trpc.ai.winPatterns.useMutation({
    onSuccess: (data) => {
      setResult(data);
      toast.success("Win patterns analyzed!", { description: `${data.patterns.length} patterns found` });
    },
    onError: () => toast.error("Failed to analyze patterns"),
  });

  const handleAnalyze = useCallback(() => {
    setResult(null);
    mutation.mutate();
  }, [mutation]);

  if (mutation.isPending) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm font-medium">Analyzing your proposal patterns…</p>
          <p className="mt-1 text-xs text-muted-foreground">Comparing winning vs losing proposals</p>
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" /> Win Pattern Analyzer
          </CardTitle>
          <CardDescription>
            AI analyzes your winning vs losing proposals to find success patterns.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center py-8">
          <p className="text-sm text-muted-foreground mb-3">
            Discover what makes your winning proposals different from your losses.
          </p>
          <Button onClick={handleAnalyze}>
            <Sparkles className="mr-2 h-4 w-4" />
            Analyze My Patterns
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
            <Trophy className="h-4 w-4 text-amber-500" /> Win Patterns
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={handleAnalyze}>
            <Sparkles className="mr-1 h-3.5 w-3.5" /> Re-analyze
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Win Rate */}
        <div className="flex items-center justify-between rounded-lg border p-3">
          <span className="text-sm font-medium">Overall Win Rate</span>
          <span className="text-lg font-bold text-primary">{result.overallWinRate}%</span>
        </div>

        {/* Patterns */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Discovered Patterns ({result.patterns.length})
          </p>
          <div className="space-y-2">
            {result.patterns.map((p, i) => (
              <div key={i} className="rounded-lg border p-3 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{p.pattern}</p>
                  <Badge className={`${confidenceColors[p.confidence]} text-[10px] shrink-0`}>
                    {p.confidence}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{p.impact}</p>
                <p className="text-xs flex items-start gap-1">
                  <ArrowUpRight className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                  {p.recommendation}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Best Job Types & Skills */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md border p-2.5">
            <p className="text-[10px] font-medium text-muted-foreground mb-1.5">Best Job Types</p>
            <div className="flex flex-wrap gap-1">
              {result.bestJobTypes.map((t) => (
                <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
              ))}
            </div>
          </div>
          <div className="rounded-md border p-2.5">
            <p className="text-[10px] font-medium text-muted-foreground mb-1.5">Optimal Rate</p>
            <p className="text-sm font-medium">
              {result.optimalRateRange
                ? `$${result.optimalRateRange.min}–$${result.optimalRateRange.max}`
                : "Insufficient data"}
            </p>
          </div>
        </div>

        {/* Top Recommendations */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Top Recommendations</p>
          <ul className="space-y-1.5">
            {result.topRecommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs">
                <CheckCircle className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

