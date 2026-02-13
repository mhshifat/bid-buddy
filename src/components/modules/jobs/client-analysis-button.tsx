"use client";

/**
 * Client Analysis Button — triggers AI client trustworthiness analysis.
 * Used in the job detail sidebar.
 */

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserSearch, Shield, AlertTriangle } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";

interface ClientAnalysisButtonProps {
  jobId: string;
  onComplete: () => void;
}

interface ClientResult {
  trustScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  insights: string[];
  redFlags: string[];
  recommendation: string;
}

function getRiskVariant(level: string): "default" | "secondary" | "destructive" {
  if (level === "LOW") return "default";
  if (level === "MEDIUM") return "secondary";
  return "destructive";
}

export function ClientAnalysisButton({
  jobId,
  onComplete,
}: ClientAnalysisButtonProps) {
  const [result, setResult] = useState<ClientResult | null>(null);

  const analyseMutation = trpc.ai.analyseClient.useMutation({
    onSuccess: (data) => {
      setResult({
        trustScore: data.trustScore,
        riskLevel: data.riskLevel,
        insights: data.insights,
        redFlags: data.redFlags,
        recommendation: data.recommendation,
      });
      onComplete();
      toast.success("Client analysis complete!");
    },
    onError: (error) => {
      const errorData = error.data as
        | { userMessage?: string }
        | undefined;
      toast.error("Client analysis failed", {
        description: errorData?.userMessage ?? "Something went wrong.",
      });
    },
  });

  const handleAnalyse = useCallback(() => {
    setResult(null);
    analyseMutation.mutate({ jobId });
  }, [jobId, analyseMutation]);

  if (result) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4" />
            Client Trust Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Trust Score</span>
            <span className="text-lg font-bold">{result.trustScore}/100</span>
          </div>
          <Badge variant={getRiskVariant(result.riskLevel)} className="text-xs">
            {result.riskLevel} RISK
          </Badge>
          {result.insights.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Insights
              </p>
              <ul className="space-y-0.5">
                {result.insights.map((ins, i) => (
                  <li key={i} className="text-[11px] text-muted-foreground">
                    • {ins}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.redFlags.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-red-600">Red Flags</p>
              <ul className="space-y-0.5">
                {result.redFlags.map((flag, i) => (
                  <li key={i} className="text-[11px] text-red-600">
                    <AlertTriangle className="mr-1 inline h-3 w-3" />
                    {flag}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-xs text-muted-foreground italic">
            {result.recommendation}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Button
      variant="outline"
      className="w-full justify-start"
      size="sm"
      onClick={handleAnalyse}
      disabled={analyseMutation.isPending}
    >
      {analyseMutation.isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <UserSearch className="mr-2 h-4 w-4" />
      )}
      {analyseMutation.isPending ? "Analysing Client…" : "Analyse Client"}
    </Button>
  );
}

