"use client";

/**
 * AI Analysis Panel — renders analysis results and the "Run Analysis" action.
 * Displayed inside the AI Analysis tab of the job detail view.
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
  TrendingUp,
  Target,
  Shield,
  ThumbsUp,
  ThumbsDown,
  Zap,
  Brain,
  Loader2,
  RefreshCw,
  DollarSign,
  Clock,
  Lightbulb,
  AlertTriangle,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { ErrorDisplay } from "@/components/shared/error-display";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AnalysisData {
  id: string;
  analysisType: string;
  fitScore: number | null;
  fakeProbability: number | null;
  winProbability: number | null;
  recommendation: string | null;
  reasoning: string | null;
  strengths: string[];
  weaknesses: string[];
  suggestedRate: number | null;
  suggestedDuration: string | null;
  keyPoints: string[];
  redFlags: string[];
  matchedSkills: string[];
  missingSkills: string[];
  modelUsed: string | null;
  createdAt: Date;
}

interface AiAnalysisPanelProps {
  jobId: string;
  latestAnalysis: AnalysisData | null;
  onAnalysisComplete: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getScoreColor(score: number): string {
  if (score >= 70) return "text-emerald-600";
  if (score >= 40) return "text-amber-600";
  return "text-red-600";
}

function getScoreBg(score: number): string {
  if (score >= 70) return "bg-emerald-100 dark:bg-emerald-950";
  if (score >= 40) return "bg-amber-100 dark:bg-amber-950";
  return "bg-red-100 dark:bg-red-950";
}

function getRecommendationVariant(rec: string): "default" | "secondary" | "destructive" {
  if (rec === "BID") return "default";
  if (rec === "CAUTIOUS") return "secondary";
  return "destructive";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AiAnalysisPanel({
  jobId,
  latestAnalysis,
  onAnalysisComplete,
}: AiAnalysisPanelProps) {
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [correlationId, setCorrelationId] = useState<string | undefined>();

  const analyseMutation = trpc.ai.analyseJob.useMutation({
    onSuccess: () => {
      toast.success("AI analysis complete!", {
        description: "Job has been analysed successfully.",
      });
      setAnalysisError(null);
      onAnalysisComplete();
    },
    onError: (error) => {
      const errorData = error.data as
        | { correlationId?: string; userMessage?: string }
        | undefined;
      setCorrelationId(errorData?.correlationId);
      setAnalysisError(
        errorData?.userMessage ?? "Failed to run AI analysis. Please try again."
      );
      toast.error("Analysis failed", {
        description: errorData?.userMessage ?? "Something went wrong.",
      });
    },
  });

  const handleRunAnalysis = useCallback(() => {
    setAnalysisError(null);
    analyseMutation.mutate({ jobId });
  }, [jobId, analyseMutation]);

  // -------------------------------------------------------------------------
  // Error state
  // -------------------------------------------------------------------------
  if (analysisError) {
    return (
      <div className="space-y-4">
        <ErrorDisplay
          message={analysisError}
          correlationId={correlationId}
          onRetry={handleRunAnalysis}
        />
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------
  if (analyseMutation.isPending) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <h3 className="mt-4 text-sm font-semibold">Analysing job…</h3>
          <p className="mt-1 max-w-sm text-center text-xs text-muted-foreground">
            Our AI is evaluating job fit, authenticity, and win probability.
            This may take a few seconds.
          </p>
        </CardContent>
      </Card>
    );
  }

  // -------------------------------------------------------------------------
  // No analysis yet
  // -------------------------------------------------------------------------
  if (!latestAnalysis) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Brain className="h-10 w-10 text-muted-foreground" />
          <h3 className="mt-3 text-sm font-semibold">No analysis yet</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Run AI analysis to get job fit scores and recommendations.
          </p>
          <Button size="sm" className="mt-4" onClick={handleRunAnalysis}>
            <Zap className="mr-2 h-4 w-4" />
            Run Analysis
          </Button>
        </CardContent>
      </Card>
    );
  }

  // -------------------------------------------------------------------------
  // Analysis results
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-4">
      {/* Re-run button */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Analysed {new Date(latestAnalysis.createdAt).toLocaleString()}
          {latestAnalysis.modelUsed && (
            <span className="ml-1 font-mono text-[10px]">
              ({latestAnalysis.modelUsed})
            </span>
          )}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRunAnalysis}
          disabled={analyseMutation.isPending}
        >
          <RefreshCw className="mr-1 h-3.5 w-3.5" />
          Re-analyse
        </Button>
      </div>

      {/* Score cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        {latestAnalysis.fitScore !== null && (
          <ScoreCard
            icon={<TrendingUp className="h-5 w-5" />}
            score={latestAnalysis.fitScore}
            label="Fit Score"
          />
        )}
        {latestAnalysis.winProbability !== null && (
          <ScoreCard
            icon={<Target className="h-5 w-5" />}
            score={latestAnalysis.winProbability}
            label="Win Probability"
          />
        )}
        {latestAnalysis.fakeProbability !== null && (
          <ScoreCard
            icon={<Shield className="h-5 w-5" />}
            score={latestAnalysis.fakeProbability}
            label="Fake Probability"
            invertColor
          />
        )}
      </div>

      {/* Recommendation */}
      {latestAnalysis.recommendation && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">AI Recommendation</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge
              variant={getRecommendationVariant(latestAnalysis.recommendation)}
              className="text-sm"
            >
              {latestAnalysis.recommendation}
            </Badge>
            {latestAnalysis.reasoning && (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {latestAnalysis.reasoning}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Suggested Rate & Duration */}
      {(latestAnalysis.suggestedRate !== null || latestAnalysis.suggestedDuration) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {latestAnalysis.suggestedRate !== null && (
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-lg font-bold">${latestAnalysis.suggestedRate}</p>
                  <p className="text-xs text-muted-foreground">Suggested Rate</p>
                </div>
              </CardContent>
            </Card>
          )}
          {latestAnalysis.suggestedDuration && (
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-lg font-bold">{latestAnalysis.suggestedDuration}</p>
                  <p className="text-xs text-muted-foreground">Suggested Duration</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Strengths & Weaknesses */}
      <div className="grid gap-4 sm:grid-cols-2">
        {latestAnalysis.strengths.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-emerald-600">
                <ThumbsUp className="h-4 w-4" />
                Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {latestAnalysis.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-muted-foreground">
                    • {s}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
        {latestAnalysis.weaknesses.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-red-600">
                <ThumbsDown className="h-4 w-4" />
                Weaknesses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {latestAnalysis.weaknesses.map((w, i) => (
                  <li key={i} className="text-xs text-muted-foreground">
                    • {w}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Key Points */}
      {latestAnalysis.keyPoints.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Key Points for Proposal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {latestAnalysis.keyPoints.map((k, i) => (
                <li key={i} className="text-xs text-muted-foreground">
                  • {k}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Red Flags */}
      {latestAnalysis.redFlags.length > 0 && (
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-red-600">
              <AlertTriangle className="h-4 w-4" />
              Red Flags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {latestAnalysis.redFlags.map((f, i) => (
                <li key={i} className="text-xs text-red-600">
                  ⚠️ {f}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Skills Analysis */}
      {(latestAnalysis.matchedSkills.length > 0 ||
        latestAnalysis.missingSkills.length > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Skills Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {latestAnalysis.matchedSkills.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium text-emerald-600">
                  Matched Skills
                </p>
                <div className="flex flex-wrap gap-1">
                  {latestAnalysis.matchedSkills.map((s) => (
                    <Badge
                      key={s}
                      variant="outline"
                      className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {latestAnalysis.missingSkills.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium text-red-600">
                  Missing Skills
                </p>
                <div className="flex flex-wrap gap-1">
                  {latestAnalysis.missingSkills.map((s) => (
                    <Badge
                      key={s}
                      variant="outline"
                      className="border-red-200 bg-red-50 text-[10px] text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400"
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface ScoreCardProps {
  icon: React.ReactNode;
  score: number;
  label: string;
  /** When true, high scores get "bad" colors and low get "good" (for fake probability). */
  invertColor?: boolean;
}

function ScoreCard({ icon, score, label, invertColor }: ScoreCardProps) {
  const displayScore = invertColor ? 100 - score : score;
  return (
    <Card className={getScoreBg(displayScore)}>
      <CardContent className="p-4 text-center">
        <div className="mx-auto w-fit text-muted-foreground">{icon}</div>
        <p
          className={`mt-1 text-2xl font-bold ${getScoreColor(displayScore)}`}
        >
          {score}%
        </p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

