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
import {
  Sparkles,
  Loader2,
  Copy,
  Check,
  MessageSquare,
  Briefcase,
  Code2,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";

interface ProposalVariation {
  tone: "professional" | "conversational" | "technical";
  toneDescription: string;
  coverLetter: string;
  proposedRate: number | null;
  keyAngle: string;
  bestFor: string;
}

interface ProposalVariationsResult {
  variations: ProposalVariation[];
  recommendation: string;
}

const toneConfig = {
  professional: {
    icon: Briefcase,
    color: "bg-blue-100 text-blue-700",
    borderColor: "border-blue-200",
  },
  conversational: {
    icon: MessageSquare,
    color: "bg-emerald-100 text-emerald-700",
    borderColor: "border-emerald-200",
  },
  technical: {
    icon: Code2,
    color: "bg-purple-100 text-purple-700",
    borderColor: "border-purple-200",
  },
};

interface ProposalVariationsPanelProps {
  jobId: string;
}

export function ProposalVariationsPanel({ jobId }: ProposalVariationsPanelProps) {
  const [result, setResult] = useState<ProposalVariationsResult | null>(null);

  // Load cached result on mount
  const { data: cached } = trpc.ai.getCachedInsight.useQuery(
    { insightType: "PROPOSAL_VARIATIONS", jobId },
    { staleTime: Infinity, refetchOnWindowFocus: false }
  );

  useEffect(() => {
    if (cached?.result && !result) {
      setResult(cached.result as ProposalVariationsResult);
    }
  }, [cached, result]);

  const mutation = trpc.ai.proposalVariations.useMutation({
    onSuccess: (data) => {
      setResult(data);
      toast.success("Proposal variations generated!", {
        description: `${data.variations.length} tone variations created`,
      });
    },
    onError: () => toast.error("Failed to generate variations"),
  });

  const handleGenerate = useCallback(() => {
    setResult(null);
    mutation.mutate({ jobId });
  }, [mutation, jobId]);

  if (mutation.isPending) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm font-medium">Crafting 3 unique proposal styles…</p>
          <p className="mt-1 text-xs text-muted-foreground">Professional · Conversational · Technical</p>
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> Proposal Tone Variations
          </CardTitle>
          <CardDescription>
            Generate 3 distinct proposals with different tones — choose the best fit for the client.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center py-8">
          <p className="text-sm text-muted-foreground mb-3">
            Professional, conversational, and technical — each takes a unique angle.
          </p>
          <Button onClick={handleGenerate}>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate 3 Variations
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Proposal Variations
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={handleGenerate}>
              <Sparkles className="mr-1 h-3.5 w-3.5" /> Regenerate
            </Button>
          </div>
          <CardDescription className="text-xs">
            💡 {result.recommendation}
          </CardDescription>
        </CardHeader>
      </Card>

      {result.variations.map((variation, index) => (
        <VariationCard key={index} variation={variation} />
      ))}
    </div>
  );
}

function VariationCard({ variation }: { variation: ProposalVariation }) {
  const [copied, setCopied] = useState(false);
  const config = toneConfig[variation.tone];
  const Icon = config.icon;

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(variation.coverLetter);
    setCopied(true);
    toast.success(`${variation.tone} variation copied!`);
    setTimeout(() => setCopied(false), 2000);
  }, [variation]);

  return (
    <Card className={`border ${config.borderColor}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className={`${config.color} text-xs capitalize`}>
                <Icon className="mr-1 h-3 w-3" />
                {variation.tone}
              </Badge>
              {variation.proposedRate && (
                <Badge variant="outline" className="text-[10px]">
                  ${variation.proposedRate}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{variation.toneDescription}</p>
          </div>
          <Button variant="ghost" size="sm" className="h-7" onClick={handleCopy}>
            {copied ? (
              <Check className="mr-1 h-3 w-3 text-emerald-600" />
            ) : (
              <Copy className="mr-1 h-3 w-3" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {variation.coverLetter}
        </p>
        <div className="flex items-center gap-3 rounded-md bg-muted/50 p-2 text-xs">
          <span className="font-medium">Angle:</span>
          <span className="text-muted-foreground">{variation.keyAngle}</span>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Best for: {variation.bestFor}
        </p>
      </CardContent>
    </Card>
  );
}

