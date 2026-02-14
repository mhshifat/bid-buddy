"use client";

/**
 * Bid Strategy Panel — AI-generated competitive bidding strategy.
 * Provides pricing, positioning, and timing advice.
 */

import { useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DollarSign,
  Loader2,
  Target,
  Sparkles,
  TrendingUp,
  Clock,
  Zap,
  Shield,
  MessageSquare,
  ArrowUpRight,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { ErrorDisplay } from "@/components/shared/error-display";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BidStrategyData {
  recommendedRate: number;
  rateRangeMin: number;
  rateRangeMax: number;
  rateJustification: string;
  positioningStrategy: string;
  differentiators: string[];
  openingHook: string;
  competitiveAdvantages: string[];
  pricingTactics: string[];
  connectsWorth: boolean;
  connectsReasoning: string;
  urgencyLevel: "low" | "medium" | "high";
  urgencyReasoning: string;
  bestTimeToApply: string;
}

interface BidStrategyPanelProps {
  jobId: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const urgencyColors: Record<string, string> = {
  low: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  high: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
};

const urgencyLabels: Record<string, string> = {
  low: "Apply When Ready",
  medium: "Apply Soon",
  high: "Apply Now",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BidStrategyPanel({ jobId }: BidStrategyPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [hookCopied, setHookCopied] = useState(false);

  // Load cached result on mount
  const { data: cached } = trpc.ai.getCachedInsight.useQuery(
    { insightType: "BID_STRATEGY", jobId },
    { staleTime: Infinity, refetchOnWindowFocus: false }
  );

  const mutation = trpc.ai.bidStrategy.useMutation({
    onSuccess: () => {
      setError(null);
      toast.success("Bid strategy ready!");
    },
    onError: (err) => {
      const errorData = err.data as { userMessage?: string } | undefined;
      setError(errorData?.userMessage ?? "Failed to generate bid strategy.");
      toast.error("Bid strategy failed", {
        description: errorData?.userMessage ?? "Something went wrong.",
      });
    },
  });

  const result: BidStrategyData | null =
    (mutation.data as BidStrategyData | undefined) ??
    (cached?.result as BidStrategyData | undefined) ??
    null;

  const handleGenerate = useCallback(() => {
    setError(null);
    mutation.mutate({ jobId });
  }, [jobId, mutation]);

  const handleCopyHook = useCallback(async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.openingHook);
    setHookCopied(true);
    toast.success("Opening hook copied!");
    setTimeout(() => setHookCopied(false), 2000);
  }, [result]);

  // Error state
  if (error) {
    return <ErrorDisplay message={error} onRetry={handleGenerate} />;
  }

  // Loading state
  if (mutation.isPending) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <h3 className="mt-4 text-sm font-semibold">
            Crafting bid strategy…
          </h3>
          <p className="mt-1 max-w-sm text-center text-xs text-muted-foreground">
            AI is analysing the market, competition, and client profile to
            create an optimal bidding strategy.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!result) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Target className="h-10 w-10 text-muted-foreground" />
          <h3 className="mt-3 text-sm font-semibold">Bid Strategy</h3>
          <p className="mt-1 max-w-xs text-center text-xs text-muted-foreground">
            AI will generate a competitive bidding strategy with pricing,
            positioning, and timing advice.
          </p>
          <Button size="sm" className="mt-4" onClick={handleGenerate}>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Strategy
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Results
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Bid Strategy</p>
        <Button variant="ghost" size="sm" onClick={handleGenerate}>
          <Sparkles className="mr-1 h-3.5 w-3.5" />
          Regenerate
        </Button>
      </div>

      {/* Rate Recommendation */}
      <Card className="border-primary/20">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2.5">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">${result.recommendedRate}</p>
                <p className="text-xs text-muted-foreground">
                  Recommended Rate
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-muted-foreground">
                ${result.rateRangeMin} – ${result.rateRangeMax}
              </p>
              <p className="text-[10px] text-muted-foreground">
                Acceptable Range
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            {result.rateJustification}
          </p>
        </CardContent>
      </Card>

      {/* Urgency & Connects */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                Urgency
              </span>
            </div>
            <Badge
              variant="outline"
              className={`mt-2 ${urgencyColors[result.urgencyLevel] ?? ""}`}
            >
              {urgencyLabels[result.urgencyLevel] ?? result.urgencyLevel}
            </Badge>
            <p className="mt-2 text-xs text-muted-foreground">
              {result.urgencyReasoning}
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground italic">
              {result.bestTimeToApply}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                Connects
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              {result.connectsWorth ? (
                <Badge
                  variant="outline"
                  className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                >
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Worth It
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                >
                  <XCircle className="mr-1 h-3 w-3" />
                  Think Twice
                </Badge>
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {result.connectsReasoning}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Opening Hook */}
      <Card className="border-amber-200 dark:border-amber-900">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
            <MessageSquare className="h-4 w-4" />
            Opening Hook
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed italic text-foreground">
            &ldquo;{result.openingHook}&rdquo;
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={handleCopyHook}
          >
            {hookCopied ? (
              <CheckCircle className="mr-1 h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <ArrowUpRight className="mr-1 h-3.5 w-3.5" />
            )}
            {hookCopied ? "Copied!" : "Copy Hook"}
          </Button>
        </CardContent>
      </Card>

      {/* Positioning Strategy */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-primary" />
            Positioning Strategy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {result.positioningStrategy}
          </p>
        </CardContent>
      </Card>

      {/* Differentiators & Advantages */}
      <div className="grid gap-4 sm:grid-cols-2">
        {result.differentiators.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-emerald-600">
                <Shield className="h-4 w-4" />
                Differentiators
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {result.differentiators.map((d, i) => (
                  <li key={i} className="text-xs text-muted-foreground">
                    • {d}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {result.competitiveAdvantages.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-blue-600">
                <Target className="h-4 w-4" />
                Competitive Advantages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {result.competitiveAdvantages.map((a, i) => (
                  <li key={i} className="text-xs text-muted-foreground">
                    • {a}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pricing Tactics */}
      {result.pricingTactics.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-amber-500" />
              Pricing Tactics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {result.pricingTactics.map((t, i) => (
                <li key={i} className="text-xs text-muted-foreground">
                  {i + 1}. {t}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

