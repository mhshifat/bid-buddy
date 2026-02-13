"use client";

import { useState, useCallback, useEffect } from "react";
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
  PenTool,
  Sparkles,
  Loader2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";

interface StylePattern {
  pattern: string;
  frequency: "always" | "often" | "sometimes";
  effectiveness: "high" | "medium" | "low";
  example: string;
}

interface StyleTrainerResult {
  overallStyle: string;
  toneProfile: string;
  sentenceStructure: string;
  vocabularyLevel: "simple" | "moderate" | "advanced";
  strengthPatterns: StylePattern[];
  weaknessPatterns: StylePattern[];
  signaturePhrases: string[];
  improvementSuggestions: string[];
  styleGuide: string;
}

const frequencyColors: Record<string, string> = {
  always: "bg-purple-100 text-purple-700",
  often: "bg-blue-100 text-blue-700",
  sometimes: "bg-slate-100 text-slate-700",
};

const effectivenessColors: Record<string, string> = {
  high: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-red-100 text-red-700",
};

const vocabColors: Record<string, string> = {
  simple: "text-blue-600",
  moderate: "text-amber-600",
  advanced: "text-purple-600",
};

export function StyleTrainerCard() {
  const [result, setResult] = useState<StyleTrainerResult | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load cached result on mount
  const { data: cached } = trpc.ai.getCachedInsight.useQuery(
    { insightType: "STYLE_TRAINER" },
    { staleTime: Infinity, refetchOnWindowFocus: false }
  );

  useEffect(() => {
    if (cached?.result && !result) {
      setResult(cached.result as StyleTrainerResult);
      setExpanded(true);
    }
  }, [cached, result]);

  const mutation = trpc.ai.styleTrainer.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setExpanded(true);
      toast.success("Writing style analysis complete!");
    },
    onError: (err) => {
      if (err.data?.code === "PRECONDITION_FAILED") {
        toast.error(err.message);
      } else {
        toast.error("Failed to analyze writing style");
      }
    },
  });

  const handleAnalyze = useCallback(() => {
    setResult(null);
    mutation.mutate();
  }, [mutation]);

  const handleCopyGuide = useCallback(async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.styleGuide);
    setCopied(true);
    toast.success("Style guide copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

  if (mutation.isPending) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm font-medium">Analyzing your writing style…</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Reading your proposals and identifying patterns
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <PenTool className="h-4 w-4 text-primary" /> Writing Style Trainer
          </CardTitle>
          <CardDescription>
            AI analyzes your past proposals to build a personalized writing style profile and guide.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center py-8">
          <p className="text-sm text-muted-foreground mb-3 text-center">
            Compares winning vs. losing proposals to identify effective patterns
          </p>
          <Button onClick={handleAnalyze}>
            <Sparkles className="mr-2 h-4 w-4" />
            Analyze My Style
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
            <PenTool className="h-4 w-4 text-primary" /> Writing Style Profile
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={`${vocabColors[result.vocabularyLevel]} bg-transparent border text-[10px]`}>
              {result.vocabularyLevel} vocabulary
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Always-visible summary */}
      <CardContent className="pt-0 pb-3">
        <p className="text-sm leading-relaxed">{result.overallStyle}</p>
      </CardContent>

      {expanded && (
        <CardContent className="space-y-5 pt-0">
          <Separator />

          {/* Tone & Structure */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-3">
              <p className="text-[10px] font-medium text-muted-foreground mb-1">Tone Profile</p>
              <p className="text-sm">{result.toneProfile}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-[10px] font-medium text-muted-foreground mb-1">Sentence Structure</p>
              <p className="text-sm">{result.sentenceStructure}</p>
            </div>
          </div>

          {/* Strength Patterns */}
          {result.strengthPatterns.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <ThumbsUp className="h-3 w-3 text-emerald-600" /> What Works
              </p>
              <div className="space-y-2">
                {result.strengthPatterns.map((p, i) => (
                  <div key={i} className="rounded-lg border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/10 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">{p.pattern}</p>
                      <div className="flex gap-1">
                        <Badge className={`${frequencyColors[p.frequency]} text-[8px] px-1 py-0`}>
                          {p.frequency}
                        </Badge>
                        <Badge className={`${effectivenessColors[p.effectiveness]} text-[8px] px-1 py-0`}>
                          {p.effectiveness}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground italic">&ldquo;{p.example}&rdquo;</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weakness Patterns */}
          {result.weaknessPatterns.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <ThumbsDown className="h-3 w-3 text-red-600" /> What Needs Work
              </p>
              <div className="space-y-2">
                {result.weaknessPatterns.map((p, i) => (
                  <div key={i} className="rounded-lg border border-red-200 bg-red-50/50 dark:bg-red-950/10 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">{p.pattern}</p>
                      <div className="flex gap-1">
                        <Badge className={`${frequencyColors[p.frequency]} text-[8px] px-1 py-0`}>
                          {p.frequency}
                        </Badge>
                        <Badge className={`${effectivenessColors[p.effectiveness]} text-[8px] px-1 py-0`}>
                          {p.effectiveness}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground italic">&ldquo;{p.example}&rdquo;</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Signature Phrases */}
          {result.signaturePhrases.length > 0 && (
            <div>
              <p className="text-[10px] font-medium text-muted-foreground mb-1.5">Your Signature Phrases</p>
              <div className="flex flex-wrap gap-1">
                {result.signaturePhrases.map((phrase, i) => (
                  <Badge key={i} variant="outline" className="text-[9px] font-normal">
                    &ldquo;{phrase}&rdquo;
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Improvement Suggestions */}
          {result.improvementSuggestions.length > 0 && (
            <div>
              <p className="text-[10px] font-medium text-muted-foreground mb-1.5">Actionable Improvements</p>
              <ul className="space-y-1">
                {result.improvementSuggestions.map((s, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Style Guide */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-primary">Your Personal Style Guide</p>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px]"
                onClick={handleCopyGuide}
              >
                {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{result.styleGuide}</p>
          </div>

          <Separator />
          <Button variant="ghost" size="sm" className="w-full" onClick={handleAnalyze}>
            <Sparkles className="mr-1 h-3.5 w-3.5" /> Re-analyze
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

