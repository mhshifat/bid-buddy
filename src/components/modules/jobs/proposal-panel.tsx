"use client";

/**
 * Proposal Panel — renders existing proposals and the "Generate Proposal" action.
 * Displayed inside the Proposals tab of the job detail view.
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
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  FileText,
  Loader2,
  Sparkles,
  Copy,
  Check,
  DollarSign,
  Clock,
  Lightbulb,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { ErrorDisplay } from "@/components/shared/error-display";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProposalData {
  id: string;
  status: string;
  coverLetter: string;
  proposedRate: number | null;
  proposedDuration: string | null;
  aiGenerated: boolean;
  createdAt: Date;
}

interface ProposalPanelProps {
  jobId: string;
  proposals: ProposalData[];
  onProposalGenerated: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProposalPanel({
  jobId,
  proposals,
  onProposalGenerated,
}: ProposalPanelProps) {
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [errorCorrelationId, setErrorCorrelationId] = useState<string | undefined>();
  const [generatedContent, setGeneratedContent] = useState<{
    coverLetter: string;
    proposedRate: number | null;
    proposedDuration: string | null;
    keySellingPoints: string[];
    questionsForClient: string[];
  } | null>(null);

  const generateMutation = trpc.ai.generateProposal.useMutation({
    onSuccess: (data) => {
      setGeneratedContent({
        coverLetter: data.coverLetter,
        proposedRate: data.proposedRate,
        proposedDuration: data.proposedDuration,
        keySellingPoints: data.keySellingPoints,
        questionsForClient: data.questionsForClient,
      });
      setGenerationError(null);
      onProposalGenerated();
      toast.success("Proposal generated!", {
        description: "A draft proposal has been created.",
      });
    },
    onError: (error) => {
      const errorData = error.data as
        | { correlationId?: string; userMessage?: string }
        | undefined;
      setErrorCorrelationId(errorData?.correlationId);
      setGenerationError(
        errorData?.userMessage ?? "Failed to generate proposal. Please try again."
      );
      toast.error("Proposal generation failed", {
        description: errorData?.userMessage ?? "Something went wrong.",
      });
    },
  });

  const handleGenerate = useCallback(() => {
    setGenerationError(null);
    setGeneratedContent(null);
    generateMutation.mutate({ jobId });
  }, [jobId, generateMutation]);

  // -------------------------------------------------------------------------
  // Error state
  // -------------------------------------------------------------------------
  if (generationError) {
    return (
      <div className="space-y-4">
        <ErrorDisplay
          message={generationError}
          correlationId={errorCorrelationId}
          onRetry={handleGenerate}
        />
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------
  if (generateMutation.isPending) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <h3 className="mt-4 text-sm font-semibold">Generating proposal…</h3>
          <p className="mt-1 max-w-sm text-center text-xs text-muted-foreground">
            AI is crafting a personalised cover letter and proposal details.
          </p>
        </CardContent>
      </Card>
    );
  }

  // -------------------------------------------------------------------------
  // Show generated result (freshly generated, with extra AI context)
  // -------------------------------------------------------------------------
  if (generatedContent) {
    return (
      <div className="space-y-4">
        <GeneratedProposalView
          content={generatedContent}
          onRegenerate={handleGenerate}
        />
        {proposals.length > 0 && (
          <>
            <Separator />
            <p className="text-sm font-medium text-muted-foreground">
              Previous Proposals
            </p>
            <ProposalsList proposals={proposals} />
          </>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Default — show existing proposals or empty state
  // -------------------------------------------------------------------------
  if (proposals.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-10 w-10 text-muted-foreground" />
          <h3 className="mt-3 text-sm font-semibold">No proposals yet</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Let AI generate a personalised cover letter for this job.
          </p>
          <Button size="sm" className="mt-4" onClick={handleGenerate}>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate AI Proposal
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          {proposals.length} proposal{proposals.length !== 1 ? "s" : ""}
        </p>
        <Button size="sm" variant="outline" onClick={handleGenerate}>
          <Sparkles className="mr-2 h-4 w-4" />
          Generate New
        </Button>
      </div>
      <ProposalsList proposals={proposals} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface GeneratedProposalViewProps {
  content: {
    coverLetter: string;
    proposedRate: number | null;
    proposedDuration: string | null;
    keySellingPoints: string[];
    questionsForClient: string[];
  };
  onRegenerate: () => void;
}

function GeneratedProposalView({
  content,
  onRegenerate,
}: GeneratedProposalViewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(content.coverLetter);
    setCopied(true);
    toast.success("Cover letter copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }, [content.coverLetter]);

  return (
    <div className="space-y-4">
      {/* Cover Letter */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              AI-Generated Cover Letter
            </CardTitle>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={handleCopy}>
                    {copied ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy to clipboard</TooltipContent>
              </Tooltip>
              <Button variant="ghost" size="sm" onClick={onRegenerate}>
                <Sparkles className="mr-1 h-3.5 w-3.5" />
                Regenerate
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {content.coverLetter}
          </p>
        </CardContent>
      </Card>

      {/* Rate & Duration */}
      {(content.proposedRate !== null || content.proposedDuration) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {content.proposedRate !== null && (
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-lg font-bold">${content.proposedRate}</p>
                  <p className="text-xs text-muted-foreground">Proposed Rate</p>
                </div>
              </CardContent>
            </Card>
          )}
          {content.proposedDuration && (
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-lg font-bold">{content.proposedDuration}</p>
                  <p className="text-xs text-muted-foreground">Proposed Duration</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Key Selling Points */}
      {content.keySellingPoints.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Key Selling Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {content.keySellingPoints.map((p, i) => (
                <li key={i} className="text-xs text-muted-foreground">
                  • {p}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Questions for Client */}
      {content.questionsForClient.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <HelpCircle className="h-4 w-4 text-blue-500" />
              Clarifying Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {content.questionsForClient.map((q, i) => (
                <li key={i} className="text-xs text-muted-foreground">
                  {i + 1}. {q}
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
// Saved Proposals List — shows full cover letter with expand/collapse
// ---------------------------------------------------------------------------

function ProposalsList({ proposals }: { proposals: ProposalData[] }) {
  return (
    <div className="space-y-3">
      {proposals.map((p) => (
        <SavedProposalCard key={p.id} proposal={p} />
      ))}
    </div>
  );
}

function SavedProposalCard({ proposal }: { proposal: ProposalData }) {
  const [expanded, setExpanded] = useState(proposals_shouldAutoExpand(proposal));
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(proposal.coverLetter);
    setCopied(true);
    toast.success("Cover letter copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }, [proposal.coverLetter]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <Badge variant="secondary" className="text-[10px]">
              {proposal.status}
            </Badge>
            {proposal.aiGenerated && (
              <Badge variant="outline" className="text-[10px]">
                <Sparkles className="mr-1 h-2.5 w-2.5" />
                AI
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {new Date(proposal.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {(proposal.proposedRate !== null || proposal.proposedDuration) && (
              <div className="flex items-center gap-2 mr-2">
                {proposal.proposedRate !== null && (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                    <DollarSign className="h-3 w-3" />
                    {proposal.proposedRate}
                  </span>
                )}
                {proposal.proposedDuration && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {proposal.proposedDuration}
                  </span>
                )}
              </div>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleCopy}>
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy cover letter</TooltipContent>
            </Tooltip>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-0">
          <Separator className="mb-3" />
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {proposal.coverLetter}
          </p>
        </CardContent>
      )}
      {!expanded && (
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground line-clamp-2">
            {proposal.coverLetter}
          </p>
        </CardContent>
      )}
    </Card>
  );
}

/** Auto-expand the first / most recent proposal for convenience. */
function proposals_shouldAutoExpand(proposal: ProposalData): boolean {
  // Auto-expand DRAFT proposals (most recently generated)
  return proposal.status === "DRAFT";
}
