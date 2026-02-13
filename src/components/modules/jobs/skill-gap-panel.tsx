"use client";

/**
 * Skill Gap Panel — AI-powered skill gap analysis with learning resources.
 * Shows readiness level, specific gaps, and a learning plan.
 */

import { useState, useCallback, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  Sparkles,
  BookOpen,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Star,
  Clock,
  ExternalLink,
  TrendingUp,
  Lightbulb,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { ErrorDisplay } from "@/components/shared/error-display";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SkillGapItem {
  skill: string;
  currentLevel: string;
  requiredLevel: string;
  importance: "critical" | "important" | "nice-to-have";
  estimatedLearningTime: string;
  resources: { title: string; type: string; url?: string }[];
  quickWin: string;
}

interface SkillGapData {
  overallReadiness: number;
  readyToApply: boolean;
  summary: string;
  gaps: SkillGapItem[];
  strengthsToHighlight: string[];
  learningPlan: string;
}

interface SkillGapPanelProps {
  jobId: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getReadinessColor(score: number): string {
  if (score >= 75) return "text-emerald-600";
  if (score >= 50) return "text-amber-600";
  return "text-red-600";
}

function getReadinessBg(score: number): string {
  if (score >= 75) return "bg-emerald-100 dark:bg-emerald-950";
  if (score >= 50) return "bg-amber-100 dark:bg-amber-950";
  return "bg-red-100 dark:bg-red-950";
}

const importanceColors: Record<string, string> = {
  critical: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  important: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  "nice-to-have": "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
};

const levelLabels: Record<string, string> = {
  none: "None",
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  expert: "Expert",
};

const levelOrder: Record<string, number> = {
  none: 0,
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4,
};

const resourceTypeIcons: Record<string, React.ReactNode> = {
  course: <GraduationCap className="h-3 w-3" />,
  docs: <BookOpen className="h-3 w-3" />,
  tutorial: <Lightbulb className="h-3 w-3" />,
  practice: <Star className="h-3 w-3" />,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SkillGapPanel({ jobId }: SkillGapPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SkillGapData | null>(null);

  // Load cached result on mount
  const { data: cached } = trpc.ai.getCachedInsight.useQuery(
    { insightType: "SKILL_GAP", jobId },
    { staleTime: Infinity, refetchOnWindowFocus: false }
  );

  useEffect(() => {
    if (cached?.result && !result) {
      setResult(cached.result as SkillGapData);
    }
  }, [cached, result]);

  const mutation = trpc.ai.skillGap.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setError(null);
      toast.success("Skill gap analysis complete!", {
        description: `Overall readiness: ${data.overallReadiness}%`,
      });
    },
    onError: (err) => {
      const errorData = err.data as { userMessage?: string } | undefined;
      setError(
        errorData?.userMessage ?? "Failed to run skill gap analysis."
      );
      toast.error("Skill gap analysis failed", {
        description: errorData?.userMessage ?? "Something went wrong.",
      });
    },
  });

  const handleGenerate = useCallback(() => {
    setError(null);
    setResult(null);
    mutation.mutate({ jobId });
  }, [jobId, mutation]);

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
            Analysing skill gaps…
          </h3>
          <p className="mt-1 max-w-sm text-center text-xs text-muted-foreground">
            AI is comparing your skills against the job requirements and
            identifying gaps with learning paths.
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
          <BookOpen className="h-10 w-10 text-muted-foreground" />
          <h3 className="mt-3 text-sm font-semibold">Skill Gap Analysis</h3>
          <p className="mt-1 max-w-xs text-center text-xs text-muted-foreground">
            AI will analyse your skills against this job&apos;s requirements,
            identify gaps, and suggest learning resources.
          </p>
          <Button size="sm" className="mt-4" onClick={handleGenerate}>
            <Sparkles className="mr-2 h-4 w-4" />
            Analyse Skills
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Results
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Skill Gap Analysis</p>
        <Button variant="ghost" size="sm" onClick={handleGenerate}>
          <Sparkles className="mr-1 h-3.5 w-3.5" />
          Re-analyse
        </Button>
      </div>

      {/* Readiness Score */}
      <Card className={getReadinessBg(result.overallReadiness)}>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-full border-4 ${
                  result.overallReadiness >= 75
                    ? "border-emerald-500"
                    : result.overallReadiness >= 50
                    ? "border-amber-500"
                    : "border-red-500"
                } bg-background`}
              >
                <span
                  className={`text-xl font-bold ${getReadinessColor(
                    result.overallReadiness
                  )}`}
                >
                  {result.overallReadiness}%
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold">Overall Readiness</p>
                <div className="mt-1 flex items-center gap-1.5">
                  {result.readyToApply ? (
                    <Badge
                      variant="outline"
                      className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                    >
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Ready to Apply
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                    >
                      <TrendingUp className="mr-1 h-3 w-3" />
                      Upskill Recommended
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            {result.summary}
          </p>
        </CardContent>
      </Card>

      {/* Skill Gaps */}
      {result.gaps.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">
            Skill Gaps ({result.gaps.length})
          </h3>
          {result.gaps.map((gap, i) => (
            <SkillGapCard key={i} gap={gap} />
          ))}
        </div>
      )}

      {/* Strengths to Highlight */}
      {result.strengthsToHighlight.length > 0 && (
        <Card className="border-emerald-200 dark:border-emerald-900">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-emerald-600">
              <Star className="h-4 w-4" />
              Strengths to Highlight
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {result.strengthsToHighlight.map((s, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
                >
                  {s}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Learning Plan */}
      {result.learningPlan && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <GraduationCap className="h-4 w-4 text-blue-600" />
              Learning Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {result.learningPlan}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SkillGapCard({ gap }: { gap: SkillGapItem }) {
  const [expanded, setExpanded] = useState(false);

  const currentNum = levelOrder[gap.currentLevel] ?? 0;
  const requiredNum = levelOrder[gap.requiredLevel] ?? 0;
  const isMet = currentNum >= requiredNum;

  return (
    <Card className={isMet ? "border-emerald-200 dark:border-emerald-900" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {isMet ? (
                <CheckCircle className="h-4 w-4 text-emerald-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm font-medium">{gap.skill}</span>
              <Badge
                variant="outline"
                className={`text-[10px] ${
                  importanceColors[gap.importance] ?? ""
                }`}
              >
                {gap.importance}
              </Badge>
            </div>

            {/* Level Bar */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>
                {levelLabels[gap.currentLevel] ?? gap.currentLevel}
              </span>
              <span className="text-muted-foreground">→</span>
              <span className="font-medium">
                {levelLabels[gap.requiredLevel] ?? gap.requiredLevel}
              </span>
              <span className="ml-auto flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {gap.estimatedLearningTime}
              </span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="shrink-0"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        {expanded && (
          <div className="mt-3 space-y-3 border-t pt-3">
            {/* Quick Win */}
            <div className="rounded-md bg-amber-50 p-2.5 dark:bg-amber-950/30">
              <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                ⚡ Quick Win: {gap.quickWin}
              </p>
            </div>

            {/* Resources */}
            {gap.resources.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                  Learning Resources
                </p>
                <div className="space-y-1.5">
                  {gap.resources.map((res, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                      {resourceTypeIcons[res.type] ?? (
                        <BookOpen className="h-3 w-3" />
                      )}
                      {res.url ? (
                        <a
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          {res.title}
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      ) : (
                        <span>{res.title}</span>
                      )}
                      <Badge
                        variant="outline"
                        className="ml-auto text-[9px]"
                      >
                        {res.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

