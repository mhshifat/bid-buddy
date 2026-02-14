"use client";

/**
 * Discovery Questions Panel — AI-generated strategic questions to ask the
 * client before committing. Uncovers hidden scope, risks, and expectations.
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
  Loader2,
  Sparkles,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  MessageSquare,
  XCircle,
  Shield,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { ErrorDisplay } from "@/components/shared/error-display";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DiscoveryQuestion {
  question: string;
  category: string;
  priority: string;
  whyItMatters: string;
  idealAnswer: string;
  redFlagAnswer: string;
}

interface DiscoveryData {
  questions: DiscoveryQuestion[];
  messagingTips: string[];
  dealBreakers: string[];
  greenFlags: string[];
  suggestedMessageTemplate: string;
}

interface DiscoveryQuestionsPanelProps {
  jobId: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const categoryColors: Record<string, string> = {
  scope: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  timeline: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
  budget: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  communication: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-400",
  technical: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400",
  expectations: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  "red-flag": "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
};

const priorityColors: Record<string, string> = {
  "must-ask": "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  "should-ask": "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  "nice-to-ask": "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DiscoveryQuestionsPanel({ jobId }: DiscoveryQuestionsPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [templateCopied, setTemplateCopied] = useState(false);

  // Load cached result on mount
  const { data: cached } = trpc.ai.getCachedInsight.useQuery(
    { insightType: "DISCOVERY_QUESTIONS", jobId },
    { staleTime: Infinity, refetchOnWindowFocus: false }
  );

  const mutation = trpc.ai.discoveryQuestions.useMutation({
    onSuccess: () => {
      setError(null);
      toast.success("Discovery questions ready!");
    },
    onError: (err) => {
      const errorData = err.data as { userMessage?: string } | undefined;
      setError(errorData?.userMessage ?? "Failed to generate discovery questions.");
      toast.error("Discovery questions failed", {
        description: errorData?.userMessage ?? "Something went wrong.",
      });
    },
  });

  const result: DiscoveryData | null =
    (mutation.data as DiscoveryData | undefined) ??
    (cached?.result as DiscoveryData | undefined) ??
    null;

  const handleGenerate = useCallback(() => {
    setError(null);
    mutation.mutate({ jobId });
  }, [jobId, mutation]);

  const handleCopyTemplate = useCallback(async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.suggestedMessageTemplate);
    setTemplateCopied(true);
    toast.success("Message template copied!");
    setTimeout(() => setTemplateCopied(false), 2000);
  }, [result]);

  // Error
  if (error) {
    return <ErrorDisplay message={error} onRetry={handleGenerate} />;
  }

  // Loading
  if (mutation.isPending) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <h3 className="mt-4 text-sm font-semibold">Crafting discovery questions…</h3>
          <p className="mt-1 max-w-sm text-center text-xs text-muted-foreground">
            AI is analysing the job for ambiguities, risks, and hidden scope to generate strategic questions.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Empty
  if (!result) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <HelpCircle className="h-10 w-10 text-muted-foreground" />
          <h3 className="mt-3 text-sm font-semibold">Client Discovery Questions</h3>
          <p className="mt-1 max-w-xs text-center text-xs text-muted-foreground">
            AI will generate smart questions to ask the client before you commit — uncover hidden scope, payment risks, and unclear expectations.
          </p>
          <Button size="sm" className="mt-4" onClick={handleGenerate}>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Questions
          </Button>
        </CardContent>
      </Card>
    );
  }

  const mustAsk = result.questions.filter((q) => q.priority === "must-ask");
  const shouldAsk = result.questions.filter((q) => q.priority === "should-ask");
  const niceToAsk = result.questions.filter((q) => q.priority === "nice-to-ask");

  // Results
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          {result.questions.length} Discovery Questions
        </p>
        <Button variant="ghost" size="sm" onClick={handleGenerate}>
          <Sparkles className="mr-1 h-3.5 w-3.5" />
          Regenerate
        </Button>
      </div>

      {/* Message Template */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <MessageSquare className="h-4 w-4 text-primary" />
            Ready-to-Send Message
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-muted/50 p-3">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {result.suggestedMessageTemplate}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={handleCopyTemplate}
          >
            {templateCopied ? (
              <Check className="mr-1 h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="mr-1 h-3.5 w-3.5" />
            )}
            {templateCopied ? "Copied!" : "Copy Message"}
          </Button>
        </CardContent>
      </Card>

      {/* Must-Ask Questions */}
      {mustAsk.length > 0 && (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-medium text-red-600">
            <AlertTriangle className="h-4 w-4" />
            Must Ask ({mustAsk.length})
          </h3>
          {mustAsk.map((q, i) => (
            <QuestionCard key={`must-${i}`} question={q} />
          ))}
        </div>
      )}

      {/* Should-Ask Questions */}
      {shouldAsk.length > 0 && (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-medium text-amber-600">
            <Lightbulb className="h-4 w-4" />
            Should Ask ({shouldAsk.length})
          </h3>
          {shouldAsk.map((q, i) => (
            <QuestionCard key={`should-${i}`} question={q} />
          ))}
        </div>
      )}

      {/* Nice-to-Ask Questions */}
      {niceToAsk.length > 0 && (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-medium text-blue-600">
            <HelpCircle className="h-4 w-4" />
            Nice to Ask ({niceToAsk.length})
          </h3>
          {niceToAsk.map((q, i) => (
            <QuestionCard key={`nice-${i}`} question={q} />
          ))}
        </div>
      )}

      {/* Deal Breakers & Green Flags */}
      <div className="grid gap-4 sm:grid-cols-2">
        {result.dealBreakers.length > 0 && (
          <Card className="border-red-200 dark:border-red-900">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-red-600">
                <XCircle className="h-4 w-4" />
                Deal Breakers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {result.dealBreakers.map((d, i) => (
                  <li key={i} className="text-xs text-red-600 dark:text-red-400">
                    ✗ {d}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {result.greenFlags.length > 0 && (
          <Card className="border-emerald-200 dark:border-emerald-900">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-emerald-600">
                <CheckCircle className="h-4 w-4" />
                Green Flags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {result.greenFlags.map((g, i) => (
                  <li key={i} className="text-xs text-emerald-600 dark:text-emerald-400">
                    ✓ {g}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Messaging Tips */}
      {result.messagingTips.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-muted-foreground" />
              Messaging Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {result.messagingTips.map((tip, i) => (
                <li key={i} className="text-xs text-muted-foreground">
                  💡 {tip}
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

function QuestionCard({ question: q }: { question: DiscoveryQuestion }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(q.question);
    setCopied(true);
    toast.success("Question copied!");
    setTimeout(() => setCopied(false), 2000);
  }, [q.question]);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge
                variant="outline"
                className={`text-[10px] ${categoryColors[q.category] ?? ""}`}
              >
                {q.category}
              </Badge>
              <Badge
                variant="outline"
                className={`text-[10px] ${priorityColors[q.priority] ?? ""}`}
              >
                {q.priority}
              </Badge>
            </div>
            <p className="text-sm font-medium">{q.question}</p>
            <p className="text-xs text-muted-foreground italic">
              {q.whyItMatters}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button variant="ghost" size="sm" onClick={handleCopy}>
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {expanded && (
          <div className="mt-3 space-y-3 border-t pt-3">
            <div className="rounded-md bg-emerald-50 p-2.5 dark:bg-emerald-950/30">
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                ✓ Ideal Answer: {q.idealAnswer}
              </p>
            </div>
            <div className="rounded-md bg-red-50 p-2.5 dark:bg-red-950/30">
              <p className="text-xs font-medium text-red-700 dark:text-red-400">
                ⚠️ Red Flag Answer: {q.redFlagAnswer}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

