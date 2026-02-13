"use client";

/**
 * Contract Advisor Panel — AI-powered contract risk analysis and negotiation
 * strategies. Protects freelancers from scope creep, payment issues, and
 * unfavorable terms.
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
  Shield,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  DollarSign,
  FileCheck,
  XCircle,
  MessageSquare,
  Milestone,
  Lightbulb,
  Scale,
  Handshake,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { ErrorDisplay } from "@/components/shared/error-display";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NegotiationPoint {
  topic: string;
  currentRisk: string;
  suggestion: string;
  scriptExample: string;
}

interface PaymentMilestone {
  milestone: string;
  percent: number;
  trigger: string;
}

interface ContractData {
  overallRiskLevel: string;
  riskSummary: string;
  negotiationPoints: NegotiationPoint[];
  paymentStructure: PaymentMilestone[];
  scopeProtectionTips: string[];
  revisionPolicy: string;
  communicationTerms: string[];
  walkAwaySignals: string[];
  contractChecklist: string[];
  upworkSpecificTips: string[];
}

interface ContractAdvisorPanelProps {
  jobId: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const riskColors: Record<string, string> = {
  low: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  high: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
};

const riskBorderColors: Record<string, string> = {
  low: "border-emerald-200 dark:border-emerald-900",
  medium: "border-amber-200 dark:border-amber-900",
  high: "border-red-200 dark:border-red-900",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ContractAdvisorPanel({ jobId }: ContractAdvisorPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ContractData | null>(null);

  const mutation = trpc.ai.contractAdvisor.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setError(null);
      toast.success("Contract advice ready!", {
        description: `Risk level: ${data.overallRiskLevel.toUpperCase()}`,
      });
    },
    onError: (err) => {
      const errorData = err.data as { userMessage?: string } | undefined;
      setError(errorData?.userMessage ?? "Failed to generate contract advice.");
      toast.error("Contract advisor failed", {
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
          <h3 className="mt-4 text-sm font-semibold">Analysing contract risks…</h3>
          <p className="mt-1 max-w-sm text-center text-xs text-muted-foreground">
            AI is evaluating the job for scope creep potential, payment risks, and providing negotiation scripts.
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
          <Scale className="h-10 w-10 text-muted-foreground" />
          <h3 className="mt-3 text-sm font-semibold">Contract & Negotiation Advisor</h3>
          <p className="mt-1 max-w-xs text-center text-xs text-muted-foreground">
            AI will analyse contract risks, suggest payment milestones, provide negotiation scripts, and identify when to walk away.
          </p>
          <Button size="sm" className="mt-4" onClick={handleGenerate}>
            <Sparkles className="mr-2 h-4 w-4" />
            Get Contract Advice
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Results
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Contract & Negotiation Advice</p>
        <Button variant="ghost" size="sm" onClick={handleGenerate}>
          <Sparkles className="mr-1 h-3.5 w-3.5" />
          Re-analyse
        </Button>
      </div>

      {/* Overall Risk */}
      <Card className={riskBorderColors[result.overallRiskLevel] ?? ""}>
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-muted p-2.5">
              <Shield className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">Contract Risk</span>
                <Badge
                  variant="outline"
                  className={riskColors[result.overallRiskLevel] ?? ""}
                >
                  {result.overallRiskLevel.toUpperCase()}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                {result.riskSummary}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Structure */}
      {result.paymentStructure.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              Suggested Payment Milestones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {result.paymentStructure.map((ms, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                      {ms.percent}%
                    </span>
                    <div>
                      <p className="text-sm font-medium">{ms.milestone}</p>
                      <p className="text-xs text-muted-foreground">
                        {ms.trigger}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Negotiation Points */}
      {result.negotiationPoints.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Handshake className="h-4 w-4 text-primary" />
              Negotiation Points ({result.negotiationPoints.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {result.negotiationPoints.map((np, i) => (
                <NegotiationPointCard key={i} point={np} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revision Policy */}
      {result.revisionPolicy && (
        <Card className="border-blue-200 dark:border-blue-900">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-blue-600">
              <FileCheck className="h-4 w-4" />
              Suggested Revision Policy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RevisionPolicyContent policy={result.revisionPolicy} />
          </CardContent>
        </Card>
      )}

      {/* Scope Protection & Communication */}
      <div className="grid gap-4 sm:grid-cols-2">
        {result.scopeProtectionTips.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
                <Shield className="h-4 w-4" />
                Scope Protection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {result.scopeProtectionTips.map((tip, i) => (
                  <li key={i} className="text-xs text-muted-foreground">
                    🛡️ {tip}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {result.communicationTerms.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                Communication Terms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {result.communicationTerms.map((term, i) => (
                  <li key={i} className="text-xs text-muted-foreground">
                    📋 {term}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Walk Away Signals */}
      {result.walkAwaySignals.length > 0 && (
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-red-600">
              <XCircle className="h-4 w-4" />
              Walk Away If…
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {result.walkAwaySignals.map((signal, i) => (
                <li key={i} className="text-xs text-red-600 dark:text-red-400">
                  🚩 {signal}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Contract Checklist */}
      {result.contractChecklist.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileCheck className="h-4 w-4 text-emerald-600" />
              Pre-Start Checklist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {result.contractChecklist.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs text-muted-foreground"
                >
                  <span className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-sm border border-muted-foreground/30" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Upwork-Specific Tips */}
      {result.upworkSpecificTips.length > 0 && (
        <Card className="border-green-200 dark:border-green-900">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
              <Lightbulb className="h-4 w-4" />
              Upwork-Specific Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {result.upworkSpecificTips.map((tip, i) => (
                <li key={i} className="text-xs text-muted-foreground">
                  💚 {tip}
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

function NegotiationPointCard({ point }: { point: NegotiationPoint }) {
  const [expanded, setExpanded] = useState(false);
  const [scriptCopied, setScriptCopied] = useState(false);

  const handleCopyScript = useCallback(async () => {
    await navigator.clipboard.writeText(point.scriptExample);
    setScriptCopied(true);
    toast.success("Script copied!");
    setTimeout(() => setScriptCopied(false), 2000);
  }, [point.scriptExample]);

  return (
    <div className="rounded-md border p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-medium">{point.topic}</span>
            <Badge
              variant="outline"
              className={`text-[10px] ${riskColors[point.currentRisk] ?? ""}`}
            >
              {point.currentRisk} risk
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{point.suggestion}</p>
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
          <div className="rounded-md bg-muted/50 p-2.5">
            <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              What to say:
            </p>
            <p className="text-sm leading-relaxed italic text-foreground">
              &ldquo;{point.scriptExample}&rdquo;
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyScript}
          >
            {scriptCopied ? (
              <Check className="mr-1 h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="mr-1 h-3.5 w-3.5" />
            )}
            {scriptCopied ? "Copied!" : "Copy Script"}
          </Button>
        </div>
      )}
    </div>
  );
}

function RevisionPolicyContent({ policy }: { policy: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(policy);
    setCopied(true);
    toast.success("Revision policy copied!");
    setTimeout(() => setCopied(false), 2000);
  }, [policy]);

  return (
    <>
      <div className="rounded-md bg-muted/50 p-3">
        <p className="text-sm leading-relaxed text-foreground">{policy}</p>
      </div>
      <Button variant="ghost" size="sm" className="mt-2" onClick={handleCopy}>
        {copied ? (
          <Check className="mr-1 h-3.5 w-3.5 text-emerald-600" />
        ) : (
          <Copy className="mr-1 h-3.5 w-3.5" />
        )}
        {copied ? "Copied!" : "Copy Policy"}
      </Button>
    </>
  );
}

