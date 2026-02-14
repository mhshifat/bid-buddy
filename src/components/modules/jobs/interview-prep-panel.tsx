"use client";

/**
 * Interview Prep Panel — AI-generated interview questions with suggested answers.
 * Helps freelancers prepare for client discovery calls.
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
  MessageSquare,
  Loader2,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  GraduationCap,
  Users,
  Briefcase,
  Sparkles,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { ErrorDisplay } from "@/components/shared/error-display";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface InterviewQuestion {
  question: string;
  category: "technical" | "behavioral" | "situational" | "client-specific";
  difficulty: "easy" | "medium" | "hard";
  suggestedAnswer: string;
  tips: string;
}

interface InterviewPrepData {
  questions: InterviewQuestion[];
  overallTips: string[];
  communicationAdvice: string;
}

interface InterviewPrepPanelProps {
  jobId: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const categoryIcons: Record<string, React.ReactNode> = {
  technical: <GraduationCap className="h-3.5 w-3.5" />,
  behavioral: <Users className="h-3.5 w-3.5" />,
  situational: <Lightbulb className="h-3.5 w-3.5" />,
  "client-specific": <Briefcase className="h-3.5 w-3.5" />,
};

const categoryColors: Record<string, string> = {
  technical: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  behavioral: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
  situational: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  "client-specific": "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
};

const difficultyColors: Record<string, string> = {
  easy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  hard: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InterviewPrepPanel({ jobId }: InterviewPrepPanelProps) {
  const [error, setError] = useState<string | null>(null);

  // Load cached result on mount
  const { data: cached } = trpc.ai.getCachedInsight.useQuery(
    { insightType: "INTERVIEW_PREP", jobId },
    { staleTime: Infinity, refetchOnWindowFocus: false }
  );

  const mutation = trpc.ai.interviewPrep.useMutation({
    onSuccess: () => {
      setError(null);
      toast.success("Interview prep ready!");
    },
    onError: (err) => {
      const errorData = err.data as { userMessage?: string } | undefined;
      setError(errorData?.userMessage ?? "Failed to generate interview prep.");
      toast.error("Interview prep failed", {
        description: errorData?.userMessage ?? "Something went wrong.",
      });
    },
  });

  const result: InterviewPrepData | null =
    (mutation.data as InterviewPrepData | undefined) ??
    (cached?.result as InterviewPrepData | undefined) ??
    null;

  const handleGenerate = useCallback(() => {
    setError(null);
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
            Preparing interview questions…
          </h3>
          <p className="mt-1 max-w-sm text-center text-xs text-muted-foreground">
            AI is analysing the job to generate likely client questions and
            strategic answers.
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
          <MessageSquare className="h-10 w-10 text-muted-foreground" />
          <h3 className="mt-3 text-sm font-semibold">Interview Prep</h3>
          <p className="mt-1 max-w-xs text-center text-xs text-muted-foreground">
            AI will generate likely interview questions the client may ask,
            with strategic answers and tips.
          </p>
          <Button size="sm" className="mt-4" onClick={handleGenerate}>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Questions
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Results
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          {result.questions.length} Interview Questions
        </p>
        <Button variant="ghost" size="sm" onClick={handleGenerate}>
          <Sparkles className="mr-1 h-3.5 w-3.5" />
          Regenerate
        </Button>
      </div>

      {/* Questions */}
      <div className="space-y-3">
        {result.questions.map((q, i) => (
          <QuestionCard key={i} question={q} index={i} />
        ))}
      </div>

      {/* Communication Advice */}
      {result.communicationAdvice && (
        <Card className="border-blue-200 dark:border-blue-900">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-blue-600">
              <MessageSquare className="h-4 w-4" />
              Communication Style
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {result.communicationAdvice}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Overall Tips */}
      {result.overallTips.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              General Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {result.overallTips.map((tip, i) => (
                <li key={i} className="text-xs text-muted-foreground">
                  • {tip}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function QuestionCard({
  question: q,
  index,
}: {
  question: InterviewQuestion;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-muted-foreground">
                Q{index + 1}
              </span>
              <Badge
                variant="outline"
                className={`text-[10px] ${categoryColors[q.category] ?? ""}`}
              >
                {categoryIcons[q.category]}
                <span className="ml-1 capitalize">{q.category}</span>
              </Badge>
              <Badge
                variant="outline"
                className={`text-[10px] ${difficultyColors[q.difficulty] ?? ""}`}
              >
                {q.difficulty}
              </Badge>
            </div>
            <p className="text-sm font-medium">{q.question}</p>
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
            <div>
              <p className="mb-1 text-xs font-medium text-emerald-600">
                Suggested Answer
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {q.suggestedAnswer}
              </p>
            </div>
            <div className="rounded-md bg-amber-50 p-2.5 dark:bg-amber-950/30">
              <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                💡 Tip: {q.tips}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

