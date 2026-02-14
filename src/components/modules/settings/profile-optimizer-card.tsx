"use client";

import { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  UserCog,
  Sparkles,
  Loader2,
  Copy,
  Check,
  ArrowUp,
  ArrowDown,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";

interface ProfileImprovement {
  area: string;
  current: string;
  suggested: string;
  impact: "high" | "medium" | "low";
}

interface ProfileOptimizerResult {
  overallScore: number;
  suggestedTitle: string;
  suggestedBio: string;
  skillsToAdd: string[];
  skillsToRemove: string[];
  skillsToReorder: string[];
  portfolioSuggestions: string[];
  keywordOptimizations: string[];
  nicheSuggestion: string;
  improvements: ProfileImprovement[];
}

const impactColors: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-blue-100 text-blue-700",
};

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  if (score >= 40) return "text-orange-600";
  return "text-red-600";
}

export function ProfileOptimizerCard() {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Load cached result on mount
  const { data: cached } = trpc.ai.getCachedInsight.useQuery(
    { insightType: "PROFILE_OPTIMIZER" },
    { staleTime: Infinity, refetchOnWindowFocus: false }
  );

  const mutation = trpc.ai.profileOptimizer.useMutation({
    onSuccess: (data) => {
      setExpanded(true);
      toast.success("Profile analysis complete!", {
        description: `Score: ${data.overallScore}/100`,
      });
    },
    onError: () => toast.error("Failed to analyze profile"),
  });

  const result: ProfileOptimizerResult | null =
    (mutation.data as ProfileOptimizerResult | undefined) ??
    (cached?.result as ProfileOptimizerResult | undefined) ??
    null;

  const handleOptimize = useCallback(() => {
    mutation.mutate();
  }, [mutation]);

  const handleCopy = useCallback(async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  if (mutation.isPending) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm font-medium">Analyzing your profile…</p>
          <p className="mt-1 text-xs text-muted-foreground">Checking skills, bio, portfolio, and positioning</p>
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserCog className="h-4 w-4 text-primary" /> AI Profile Optimizer
          </CardTitle>
          <CardDescription>
            Get AI-powered suggestions to optimize your Upwork profile for more clients and invites.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center py-8">
          <p className="text-sm text-muted-foreground mb-3 text-center">
            Analyzes your title, bio, skills, and win history to suggest improvements
          </p>
          <Button onClick={handleOptimize}>
            <Sparkles className="mr-2 h-4 w-4" />
            Optimize My Profile
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
            <UserCog className="h-4 w-4 text-primary" /> Profile Score
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold ${getScoreColor(result.overallScore)}`}>
              {result.overallScore}
            </span>
            <span className="text-sm text-muted-foreground">/100</span>
            <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-5">
          {/* Suggested Title */}
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-muted-foreground">Suggested Title</p>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px]"
                onClick={() => handleCopy(result.suggestedTitle, "Title")}
              >
                {copied === "Title" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
            <p className="text-sm font-medium">{result.suggestedTitle}</p>
          </div>

          {/* Suggested Bio */}
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-muted-foreground">Suggested Bio</p>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px]"
                onClick={() => handleCopy(result.suggestedBio, "Bio")}
              >
                {copied === "Bio" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{result.suggestedBio}</p>
          </div>

          {/* Skills Suggestions */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-[10px] font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                <Plus className="h-3 w-3 text-emerald-600" /> Add
              </p>
              <div className="flex flex-wrap gap-1">
                {result.skillsToAdd.map((s) => (
                  <Badge key={s} className="bg-emerald-100 text-emerald-700 text-[9px]">{s}</Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                <Minus className="h-3 w-3 text-red-600" /> Remove
              </p>
              <div className="flex flex-wrap gap-1">
                {result.skillsToRemove.map((s) => (
                  <Badge key={s} className="bg-red-100 text-red-700 text-[9px]">{s}</Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                <ArrowUp className="h-3 w-3 text-blue-600" /> Reorder
              </p>
              <div className="flex flex-wrap gap-1">
                {result.skillsToReorder.map((s) => (
                  <Badge key={s} className="bg-blue-100 text-blue-700 text-[9px]">{s}</Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Niche Suggestion */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <p className="text-xs font-medium text-primary mb-1">Niche Strategy</p>
            <p className="text-sm">{result.nicheSuggestion}</p>
          </div>

          {/* Improvements */}
          {result.improvements.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Before & After Improvements</p>
              <div className="space-y-2">
                {result.improvements.map((imp, i) => (
                  <div key={i} className="rounded-lg border p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">{imp.area}</span>
                      <Badge className={`${impactColors[imp.impact]} text-[9px]`}>
                        {imp.impact} impact
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded bg-red-50 p-2 dark:bg-red-950/20">
                        <p className="text-[10px] text-red-600 font-medium mb-0.5">Before</p>
                        <p className="text-xs text-muted-foreground">{imp.current}</p>
                      </div>
                      <div className="rounded bg-emerald-50 p-2 dark:bg-emerald-950/20">
                        <p className="text-[10px] text-emerald-600 font-medium mb-0.5">After</p>
                        <p className="text-xs">{imp.suggested}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Keywords & Portfolio */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-medium text-muted-foreground mb-1.5">Keywords to Include</p>
              <div className="flex flex-wrap gap-1">
                {result.keywordOptimizations.map((k) => (
                  <Badge key={k} variant="outline" className="text-[9px]">{k}</Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-medium text-muted-foreground mb-1.5">Portfolio Ideas</p>
              <ul className="space-y-0.5">
                {result.portfolioSuggestions.map((s, i) => (
                  <li key={i} className="text-[10px] text-muted-foreground">• {s}</li>
                ))}
              </ul>
            </div>
          </div>

          <Separator />
          <Button variant="ghost" size="sm" className="w-full" onClick={handleOptimize}>
            <Sparkles className="mr-1 h-3.5 w-3.5" /> Re-analyze
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

