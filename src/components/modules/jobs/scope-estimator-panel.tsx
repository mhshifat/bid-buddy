"use client";

/**
 * Scope Estimator Panel — AI-powered project breakdown with tasks,
 * milestones, hour estimates, and risk analysis.
 * Helps freelancers avoid underquoting and scope creep.
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
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Loader2,
  Sparkles,
  ListChecks,
  Clock,
  DollarSign,
  AlertTriangle,
  Milestone,
  ChevronDown,
  ChevronUp,
  Shield,
  FileCheck,
  Info,
  Copy,
  Check,
  ShieldPlus,
  Zap,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { ErrorDisplay } from "@/components/shared/error-display";
import { toast } from "sonner";
import { DefineScopeDialog } from "@/components/modules/scope-shield/define-scope-dialog";
import type { ScopeInitialData } from "@/components/modules/scope-shield/define-scope-dialog";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ScopeTask {
  name: string;
  description: string;
  category: string;
  hoursMin: number;
  hoursMax: number;
  complexity: string;
  dependencies: string[];
  deliverable: string;
}

interface ScopeMilestoneData {
  name: string;
  tasks: string[];
  hoursEstimate: number;
  suggestedPaymentPercent: number;
  deliverables: string[];
}

interface ScopeData {
  tasks: ScopeTask[];
  milestones: ScopeMilestoneData[];
  totalHoursMin: number;
  totalHoursMax: number;
  riskBufferPercent: number;
  adjustedHoursMin: number;
  adjustedHoursMax: number;
  suggestedFixedPrice: number | null;
  suggestedHourlyRate: number | null;
  scopeRisks: string[];
  assumptions: string[];
  outOfScopeItems: string[];
  summary: string;
}

interface ScopeEstimatorPanelProps {
  jobId: string;
  jobTitle?: string;
  jobDescription?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const categoryColors: Record<string, string> = {
  setup: "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-400",
  development: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  design: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
  testing: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  deployment: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  communication: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-400",
  other: "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-400",
};

const complexityColors: Record<string, string> = {
  low: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  high: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ScopeEstimatorPanel({ jobId, jobTitle, jobDescription }: ScopeEstimatorPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScopeData | null>(null);
  const [scopeProtected, setScopeProtected] = useState(false);

  // Check if a scope already exists for this job
  const { data: existingScopes } = trpc.scope.list.useQuery(undefined, {
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (existingScopes?.some((s) => s.job_id === jobId)) {
      setScopeProtected(true);
    }
  }, [existingScopes, jobId]);

  // Load cached result on mount
  const { data: cached } = trpc.ai.getCachedInsight.useQuery(
    { insightType: "SCOPE_ESTIMATE", jobId },
    { staleTime: Infinity, refetchOnWindowFocus: false }
  );

  useEffect(() => {
    if (cached?.result && !result) {
      setResult(cached.result as ScopeData);
    }
  }, [cached, result]);

  // Quick-protect: auto-create scope from AI estimate in one click
  const quickProtectMutation = trpc.scope.createFromEstimate.useMutation({
    onSuccess: () => {
      setScopeProtected(true);
      toast.success("Scope Shield activated!", {
        description: "Project scope auto-created from AI estimate. Go to Scope Shield to manage it.",
      });
    },
    onError: () => {
      toast.error("Failed to create scope", {
        description: "Try using the manual 'Define Scope' dialog instead.",
      });
    },
  });

  /** Convert AI estimate result → DefineScopeDialog initialData */
  function buildInitialData(): ScopeInitialData | undefined {
    if (!result) return undefined;

    const deliverables = [
      ...new Set(result.tasks.map((t) => t.deliverable).filter(Boolean)),
    ];
    if (deliverables.length === 0) {
      result.milestones.forEach((ms) =>
        ms.deliverables.forEach((d) => {
          if (!deliverables.includes(d)) deliverables.push(d);
        })
      );
    }

    const milestones = result.milestones.map(
      (ms) => `${ms.name} (~${ms.hoursEstimate}h, ${ms.suggestedPaymentPercent}% payment)`
    );

    let budget: number | null = result.suggestedFixedPrice;
    if (!budget && result.suggestedHourlyRate) {
      budget = result.suggestedHourlyRate * result.adjustedHoursMax;
    }

    const weeksMin = Math.ceil(result.adjustedHoursMin / 40);
    const weeksMax = Math.ceil(result.adjustedHoursMax / 40);
    const timeline =
      weeksMin === weeksMax
        ? `${weeksMax} week${weeksMax > 1 ? "s" : ""}`
        : `${weeksMin}–${weeksMax} weeks`;

    const descParts = [result.summary];
    if (result.assumptions.length > 0) {
      descParts.push("\n\nAssumptions:\n" + result.assumptions.map((a) => `• ${a}`).join("\n"));
    }

    return {
      title: jobTitle ?? "Untitled Project",
      description: descParts.join(""),
      deliverables,
      exclusions: result.outOfScopeItems,
      milestones,
      budget,
      timeline,
    };
  }

  function handleQuickProtect() {
    if (!result) return;
    quickProtectMutation.mutate({
      jobId,
      jobTitle: jobTitle ?? "Untitled Project",
      jobDescription: jobDescription ?? "",
      estimate: result,
    });
  }

  const mutation = trpc.ai.scopeEstimate.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setError(null);
      toast.success("Scope estimate ready!", {
        description: `${data.tasks.length} tasks, ${data.totalHoursMin}–${data.totalHoursMax}h estimated.`,
      });
    },
    onError: (err) => {
      const errorData = err.data as { userMessage?: string } | undefined;
      setError(errorData?.userMessage ?? "Failed to estimate scope.");
      toast.error("Scope estimation failed", {
        description: errorData?.userMessage ?? "Something went wrong.",
      });
    },
  });

  const handleGenerate = useCallback(() => {
    setError(null);
    setResult(null);
    mutation.mutate({ jobId });
  }, [jobId, mutation]);

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
          <h3 className="mt-4 text-sm font-semibold">Estimating project scope…</h3>
          <p className="mt-1 max-w-sm text-center text-xs text-muted-foreground">
            AI is breaking down the job into tasks, milestones, and realistic hour estimates.
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
          <ListChecks className="h-10 w-10 text-muted-foreground" />
          <h3 className="mt-3 text-sm font-semibold">Project Scope Estimator</h3>
          <p className="mt-1 max-w-xs text-center text-xs text-muted-foreground">
            AI will break this job into tasks, estimate hours, suggest milestones, and identify scope risks — so you never underquote again.
          </p>
          <Button size="sm" className="mt-4" onClick={handleGenerate}>
            <Sparkles className="mr-2 h-4 w-4" />
            Estimate Scope
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Results
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Project Scope Estimate</p>
        <Button variant="ghost" size="sm" onClick={handleGenerate}>
          <Sparkles className="mr-1 h-3.5 w-3.5" />
          Re-estimate
        </Button>
      </div>

      {/* Scope Shield Integration */}
      {!scopeProtected ? (
        <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/30">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-emerald-100 p-2 dark:bg-emerald-900">
                <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Protect this scope</p>
                <p className="text-xs text-muted-foreground">
                  Activate Scope Shield to detect scope creep and generate change orders
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DefineScopeDialog
                jobId={jobId}
                initialData={buildInitialData()}
                onCreated={() => setScopeProtected(true)}
                trigger={
                  <Button variant="outline" size="sm">
                    <ShieldPlus className="mr-1.5 h-3.5 w-3.5" />
                    Customize & Protect
                  </Button>
                }
              />
              <Button
                size="sm"
                onClick={handleQuickProtect}
                disabled={quickProtectMutation.isPending}
              >
                {quickProtectMutation.isPending ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Zap className="mr-1.5 h-3.5 w-3.5" />
                )}
                Quick Protect
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/50">
          <CardContent className="flex items-center gap-3 p-4">
            <Check className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                Scope Shield Active
              </p>
              <p className="text-xs text-muted-foreground">
                Visit{" "}
                <a href="/scope-shield" className="underline hover:text-primary">
                  Scope Shield
                </a>{" "}
                to detect scope creep and manage change requests.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <Card className="border-primary/20">
        <CardContent className="p-5">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {result.summary}
          </p>
        </CardContent>
      </Card>

      {/* Hours & Price Overview */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="mx-auto h-5 w-5 text-blue-600" />
            <p className="mt-1 text-lg font-bold">
              {result.totalHoursMin}–{result.totalHoursMax}h
            </p>
            <p className="text-xs text-muted-foreground">Base Estimate</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200 dark:border-amber-900">
          <CardContent className="p-4 text-center">
            <Shield className="mx-auto h-5 w-5 text-amber-600" />
            <p className="mt-1 text-lg font-bold">
              {result.adjustedHoursMin}–{result.adjustedHoursMax}h
            </p>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  With {result.riskBufferPercent}% Buffer
                  <Info className="h-3 w-3" />
                </p>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Risk buffer accounts for scope creep, revision rounds, and communication overhead.</p>
              </TooltipContent>
            </Tooltip>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="mx-auto h-5 w-5 text-emerald-600" />
            <p className="mt-1 text-lg font-bold">
              {result.suggestedFixedPrice !== null
                ? `$${result.suggestedFixedPrice.toLocaleString()}`
                : result.suggestedHourlyRate !== null
                ? `$${result.suggestedHourlyRate}/hr`
                : "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              {result.suggestedFixedPrice !== null ? "Suggested Fixed Price" : "Suggested Rate"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Milestones */}
      {result.milestones.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Milestone className="h-4 w-4 text-primary" />
              Payment Milestones ({result.milestones.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {result.milestones.map((ms, i) => (
                <div key={i} className="rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium">{ms.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {ms.hoursEstimate}h
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {ms.suggestedPaymentPercent}% payment
                      </Badge>
                    </div>
                  </div>
                  {ms.deliverables.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {ms.deliverables.map((d, j) => (
                        <Badge key={j} variant="secondary" className="text-[10px]">
                          <FileCheck className="mr-1 h-2.5 w-2.5" />
                          {d}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task Breakdown */}
      {result.tasks.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ListChecks className="h-4 w-4 text-blue-600" />
              Task Breakdown ({result.tasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {result.tasks.map((task, i) => (
                <TaskRow key={i} task={task} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scope Risks & Out of Scope */}
      <div className="grid gap-4 sm:grid-cols-2">
        {result.scopeRisks.length > 0 && (
          <Card className="border-amber-200 dark:border-amber-900">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                Scope Risks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {result.scopeRisks.map((r, i) => (
                  <li key={i} className="text-xs text-muted-foreground">
                    ⚠️ {r}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {result.outOfScopeItems.length > 0 && (
          <Card className="border-red-200 dark:border-red-900">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-red-600">
                <Shield className="h-4 w-4" />
                Out of Scope
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {result.outOfScopeItems.map((item, i) => (
                  <li key={i} className="text-xs text-muted-foreground">
                    ✗ {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Assumptions */}
      {result.assumptions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Info className="h-4 w-4 text-muted-foreground" />
              Assumptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {result.assumptions.map((a, i) => (
                <li key={i} className="text-xs text-muted-foreground">
                  • {a}
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

function TaskRow({ task }: { task: ScopeTask }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-md border p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-medium">{task.name}</span>
            <Badge
              variant="outline"
              className={`text-[10px] ${categoryColors[task.category] ?? categoryColors.other}`}
            >
              {task.category}
            </Badge>
            <Badge
              variant="outline"
              className={`text-[10px] ${complexityColors[task.complexity] ?? ""}`}
            >
              {task.complexity}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{task.hoursMin}–{task.hoursMax}h</span>
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
        <div className="mt-2 space-y-2 border-t pt-2">
          <p className="text-xs text-muted-foreground">{task.description}</p>
          <div className="flex items-center gap-1 text-xs">
            <FileCheck className="h-3 w-3 text-emerald-600" />
            <span className="text-muted-foreground">Deliverable: </span>
            <span className="font-medium">{task.deliverable}</span>
          </div>
          {task.dependencies.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
              <span>Depends on: </span>
              {task.dependencies.map((dep, i) => (
                <Badge key={i} variant="secondary" className="text-[9px]">
                  {dep}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

