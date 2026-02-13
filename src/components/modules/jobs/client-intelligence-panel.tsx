"use client";

/**
 * Client Intelligence Panel — AI-powered client relationship analysis.
 * Builds a comprehensive profile from the job's embedded client data.
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Users,
  Shield,
  MessageCircle,
  DollarSign,
  ThumbsUp,
  AlertTriangle,
  Lightbulb,
  Repeat,
  UserCheck,
  Copy,
  Check,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ClientIntelligenceResult {
  trustScore: number;
  communicationStyle: string;
  paymentBehavior: string;
  workPreferences: string[];
  strengths: string[];
  risks: string[];
  bestApproach: string;
  repeatWorkPotential: "high" | "medium" | "low";
  negotiationTips: string[];
  idealFreelancerProfile: string;
}

interface ClientIntelligencePanelProps {
  jobId: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getRepeatBadgeVariant(
  potential: "high" | "medium" | "low"
): "default" | "secondary" | "outline" {
  if (potential === "high") return "default";
  if (potential === "medium") return "secondary";
  return "outline";
}

function getTrustColor(score: number): string {
  if (score >= 75) return "text-emerald-600";
  if (score >= 50) return "text-amber-600";
  return "text-red-600";
}

function getTrustBg(score: number): string {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-red-500";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ClientIntelligencePanel({ jobId }: ClientIntelligencePanelProps) {
  const [result, setResult] = useState<ClientIntelligenceResult | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Load cached result on mount
  const { data: cached } = trpc.ai.getCachedInsight.useQuery(
    { insightType: "CLIENT_INTELLIGENCE", jobId },
    { staleTime: Infinity, refetchOnWindowFocus: false }
  );

  useEffect(() => {
    if (cached?.result && !result) {
      setResult(cached.result as ClientIntelligenceResult);
    }
  }, [cached, result]);

  const mutation = trpc.ai.clientIntelligenceFromJob.useMutation({
    onSuccess: (data) => {
      setResult(data);
      toast.success("Client intelligence report ready!");
    },
    onError: (error) => {
      const errorData = error.data as { userMessage?: string } | undefined;
      toast.error("Client intelligence failed", {
        description: errorData?.userMessage ?? "Something went wrong.",
      });
    },
  });

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // Empty state
  if (!result) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Users className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <h3 className="mb-1 text-sm font-semibold">
            Client Relationship Intelligence
          </h3>
          <p className="mb-6 max-w-sm text-center text-xs text-muted-foreground">
            Build a comprehensive client profile with communication style analysis,
            payment behavior assessment, and personalised negotiation strategies.
          </p>
          <Button
            onClick={() => mutation.mutate({ jobId })}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Users className="mr-2 h-4 w-4" />
            )}
            {mutation.isPending ? "Analysing Client…" : "Build Client Profile"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Trust Score Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold">Client Trust Score</h3>
              <p className="text-xs text-muted-foreground">
                Based on spending history, payment verification, and hiring patterns
              </p>
            </div>
            <div className="text-right">
              <span className={`text-3xl font-bold ${getTrustColor(result.trustScore)}`}>
                {result.trustScore}
              </span>
              <span className="text-sm text-muted-foreground">/100</span>
            </div>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${getTrustBg(result.trustScore)}`}
              style={{ width: `${result.trustScore}%` }}
            />
          </div>
          <div className="mt-3 flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Repeat className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Repeat Work Potential:</span>
              <Badge variant={getRepeatBadgeVariant(result.repeatWorkPotential)} className="text-[10px]">
                {result.repeatWorkPotential.toUpperCase()}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Communication Style */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <MessageCircle className="h-4 w-4 text-blue-500" />
              Communication Style
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {result.communicationStyle}
            </p>
          </CardContent>
        </Card>

        {/* Payment Behavior */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              Payment Behavior
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {result.paymentBehavior}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Best Approach */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <UserCheck className="h-4 w-4 text-purple-500" />
              Recommended Approach
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => handleCopy(result.bestApproach, "approach")}
            >
              {copiedSection === "approach" ? (
                <Check className="mr-1 h-3 w-3" />
              ) : (
                <Copy className="mr-1 h-3 w-3" />
              )}
              {copiedSection === "approach" ? "Copied" : "Copy"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {result.bestApproach}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Work Preferences */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Work Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {result.workPreferences.map((pref, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                  {pref}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Strengths */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ThumbsUp className="h-4 w-4 text-emerald-500" />
              Client Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {result.strengths.map((str, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                  {str}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Risks */}
      {result.risks.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              Potential Risks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {result.risks.map((risk, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                  {risk}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Negotiation Tips */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Negotiation Tips
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => handleCopy(result.negotiationTips.map((t, i) => `${i + 1}. ${t}`).join("\n"), "tips")}
            >
              {copiedSection === "tips" ? (
                <Check className="mr-1 h-3 w-3" />
              ) : (
                <Copy className="mr-1 h-3 w-3" />
              )}
              {copiedSection === "tips" ? "Copied" : "Copy All"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2">
            {result.negotiationTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  {i + 1}
                </span>
                {tip}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Ideal Freelancer Profile */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-indigo-500" />
            Ideal Freelancer This Client Wants
          </CardTitle>
          <CardDescription className="text-xs">
            Position yourself to match this profile in your communications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {result.idealFreelancerProfile}
          </p>
        </CardContent>
      </Card>

      {/* Re-run */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => mutation.mutate({ jobId })}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Users className="mr-2 h-4 w-4" />
          )}
          {mutation.isPending ? "Re-analysing…" : "Re-analyse Client"}
        </Button>
      </div>
    </div>
  );
}

