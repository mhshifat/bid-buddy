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
  Github,
  Star,
  ExternalLink,
  Plus,
  Send,
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

interface RelevantRepoData {
  name: string;
  fullName: string;
  url: string;
  description: string | null;
  language: string | null;
  stars: number;
  relevanceReason: string;
  briefSummary: string;
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
  const [generatedProposalId, setGeneratedProposalId] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<{
    coverLetter: string;
    proposedRate: number | null;
    proposedDuration: string | null;
    keySellingPoints: string[];
    questionsForClient: string[];
    relevantRepos: RelevantRepoData[];
  } | null>(null);

  const generateMutation = trpc.ai.generateProposal.useMutation({
    onSuccess: (data) => {
      setGeneratedProposalId(data.proposalId);
      setGeneratedContent({
        coverLetter: data.coverLetter,
        proposedRate: data.proposedRate,
        proposedDuration: data.proposedDuration,
        keySellingPoints: data.keySellingPoints,
        questionsForClient: data.questionsForClient,
        relevantRepos: data.relevantRepos ?? [],
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

  const markSentMutation = trpc.proposal.updateStatus.useMutation({
    onSuccess: () => {
      onProposalGenerated(); // refetch job data to update statuses
      toast.success("Proposal marked as sent!", {
        description: "Job has advanced to 'Bid Sent' in your pipeline.",
      });
    },
    onError: () => {
      toast.error("Failed to mark proposal as sent");
    },
  });

  const handleGenerate = useCallback(() => {
    setGenerationError(null);
    setGeneratedContent(null);
    setGeneratedProposalId(null);
    generateMutation.mutate({ jobId });
  }, [jobId, generateMutation]);

  const handleAppendRepoToProposal = useCallback((repo: RelevantRepoData) => {
    setGeneratedContent((prev) => {
      if (!prev) return prev;
      const repoBlock = `\n\n📦 ${repo.name} — ${repo.url}\n${repo.briefSummary}`;
      return { ...prev, coverLetter: prev.coverLetter + repoBlock };
    });
    toast.success(`"${repo.name}" added to proposal!`);
  }, []);

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

  if (generatedContent) {
    return (
      <div className="space-y-4">
        <GeneratedProposalView
          content={generatedContent}
          proposalId={generatedProposalId}
          onRegenerate={handleGenerate}
          onAppendRepo={handleAppendRepoToProposal}
          onMarkSent={(id) => markSentMutation.mutate({ id, status: "SENT" })}
          isMarkingSent={markSentMutation.isPending}
        />
        {proposals.length > 0 && (
          <>
            <Separator />
            <p className="text-sm font-medium text-muted-foreground">
              Previous Proposals
            </p>
            <ProposalsList proposals={proposals} onStatusChanged={onProposalGenerated} />
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
      <ProposalsList proposals={proposals} onStatusChanged={onProposalGenerated} />
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
    relevantRepos: RelevantRepoData[];
  };
  proposalId: string | null;
  onRegenerate: () => void;
  onAppendRepo: (repo: RelevantRepoData) => void;
  onMarkSent: (proposalId: string) => void;
  isMarkingSent: boolean;
}

function GeneratedProposalView({
  content,
  proposalId,
  onRegenerate,
  onAppendRepo,
  onMarkSent,
  isMarkingSent,
}: GeneratedProposalViewProps) {
  const [copied, setCopied] = useState(false);
  const [markedSent, setMarkedSent] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(content.coverLetter);
    setCopied(true);
    toast.success("Cover letter copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }, [content.coverLetter]);

  const handleMarkSent = useCallback(() => {
    if (!proposalId) return;
    onMarkSent(proposalId);
    setMarkedSent(true);
  }, [proposalId, onMarkSent]);

  return (
    <div className="space-y-4">
      {/* Cover Letter */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              AI-Generated Cover Letter
              <Badge variant="secondary" className="text-[10px]">DRAFT</Badge>
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
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            <LinkedText text={content.coverLetter} />
          </div>
          {/* Mark as Sent CTA */}
          {proposalId && !markedSent && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-cyan-200 bg-cyan-50/50 px-4 py-3 dark:border-cyan-800/40 dark:bg-cyan-950/20">
              <Send className="h-4 w-4 shrink-0 text-cyan-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-cyan-900 dark:text-cyan-200">
                  Submitted on Upwork?
                </p>
                <p className="text-xs text-cyan-700/80 dark:text-cyan-400/80">
                  Mark as sent to advance your pipeline and track the journey.
                </p>
              </div>
              <Button
                size="sm"
                className="shrink-0 bg-cyan-600 text-white hover:bg-cyan-700"
                onClick={handleMarkSent}
                disabled={isMarkingSent}
              >
                {isMarkingSent ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                )}
                Mark as Sent
              </Button>
            </div>
          )}
          {markedSent && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-3 dark:border-emerald-800/40 dark:bg-emerald-950/20">
              <Check className="h-4 w-4 text-emerald-600" />
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                Proposal marked as sent — pipeline updated!
              </p>
            </div>
          )}
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

      {/* Relevant GitHub Repos */}
      {content.relevantRepos.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Github className="h-4 w-4 text-violet-500" />
              Relevant GitHub Repos to Showcase
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {content.relevantRepos.map((repo) => (
                <RelevantRepoCard
                  key={repo.fullName}
                  repo={repo}
                  onAddToProposal={onAppendRepo}
                />
              ))}
            </div>
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

function ProposalsList({
  proposals,
  onStatusChanged,
}: {
  proposals: ProposalData[];
  onStatusChanged: () => void;
}) {
  return (
    <div className="space-y-3">
      {proposals.map((p) => (
        <SavedProposalCard key={p.id} proposal={p} onStatusChanged={onStatusChanged} />
      ))}
    </div>
  );
}

function SavedProposalCard({
  proposal,
  onStatusChanged,
}: {
  proposal: ProposalData;
  onStatusChanged: () => void;
}) {
  const [expanded, setExpanded] = useState(proposals_shouldAutoExpand(proposal));
  const [copied, setCopied] = useState(false);

  const markSentMutation = trpc.proposal.updateStatus.useMutation({
    onSuccess: () => {
      onStatusChanged();
      toast.success("Proposal marked as sent!", {
        description: "Job has advanced to 'Bid Sent' in your pipeline.",
      });
    },
    onError: () => {
      toast.error("Failed to update proposal status");
    },
  });

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(proposal.coverLetter);
    setCopied(true);
    toast.success("Cover letter copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }, [proposal.coverLetter]);

  const isDraft = proposal.status === "DRAFT";

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <Badge
              variant="secondary"
              className={`text-[10px] ${
                proposal.status === "SENT"
                  ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400"
                  : ""
              }`}
            >
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
            {isDraft && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 px-2 text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 dark:hover:bg-cyan-950/30"
                    onClick={() => markSentMutation.mutate({ id: proposal.id, status: "SENT" })}
                    disabled={markSentMutation.isPending}
                  >
                    {markSentMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    <span className="text-[11px]">Mark Sent</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Mark as submitted on Upwork — advances pipeline</TooltipContent>
              </Tooltip>
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

// ---------------------------------------------------------------------------
// Linked Text — auto-detects URLs in plain text and makes them clickable
// ---------------------------------------------------------------------------

function LinkedText({ text }: { text: string }) {
  // Split on URLs — capturing group makes matched URLs appear at odd indices
  const parts = text.split(/(https?:\/\/[^\s)]+)/g);

  return (
    <>
      {parts.map((part, i) =>
        // Odd indices are the captured URL groups
        i % 2 === 1 ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-600 underline underline-offset-2 transition-colors hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300"
          >
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Relevant GitHub Repo Card
// ---------------------------------------------------------------------------

interface RelevantRepoCardProps {
  repo: RelevantRepoData;
  onAddToProposal: (repo: RelevantRepoData) => void;
}

function RelevantRepoCard({ repo, onAddToProposal }: RelevantRepoCardProps) {
  const [copied, setCopied] = useState(false);
  const [added, setAdded] = useState(false);

  /** Builds a formatted text block with name, link, and description. */
  const buildFormattedText = useCallback(() => {
    const lines = [
      `📦 ${repo.fullName}`,
      `🔗 ${repo.url}`,
    ];
    if (repo.language) {
      lines.push(`🛠 Language: ${repo.language}`);
    }
    if (repo.briefSummary) {
      lines.push(`📝 ${repo.briefSummary}`);
    }
    return lines.join("\n");
  }, [repo]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(buildFormattedText());
    setCopied(true);
    toast.success("Repo details copied!", {
      description: "Name, link, and description copied to clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
  }, [buildFormattedText]);

  const handleAddToProposal = useCallback(() => {
    onAddToProposal(repo);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }, [repo, onAddToProposal]);

  return (
    <div className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-card to-card p-4 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
      {/* Top accent */}
      <div className="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Repo name as clickable link + language badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <Github className="h-4 w-4 shrink-0 text-muted-foreground" />
            <a
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-sm font-semibold text-foreground underline decoration-violet-500/40 underline-offset-2 transition-colors hover:text-violet-600 dark:hover:text-violet-400"
            >
              {repo.fullName}
            </a>
            {repo.language && (
              <Badge variant="secondary" className="shrink-0 text-[10px]">
                {repo.language}
              </Badge>
            )}
            {repo.stars > 0 && (
              <span className="flex items-center gap-1 shrink-0 text-xs text-muted-foreground">
                <Star className="h-3 w-3 text-amber-500" />
                {repo.stars}
              </span>
            )}
          </div>

          {/* Clickable URL for easy copying / visibility */}
          <a
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground/70 transition-colors hover:text-violet-600 dark:hover:text-violet-400"
          >
            <ExternalLink className="h-3 w-3" />
            {repo.url}
          </a>

          {/* AI Brief Summary — what the repo actually does */}
          {repo.briefSummary && (
            <div className="mt-2.5 rounded-lg bg-muted/50 px-3 py-2">
              <p className="text-xs leading-relaxed text-foreground/80">
                {repo.briefSummary}
              </p>
            </div>
          )}

          {/* Relevance reason */}
          <p className="mt-2 text-xs font-medium text-violet-600 dark:text-violet-400">
            💡 {repo.relevanceReason}
          </p>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 flex-col gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </TooltipTrigger>
            <TooltipContent>Open on GitHub</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy name, link &amp; description</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={handleAddToProposal}
                disabled={added}
              >
                {added ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {added ? "Added!" : "Add to proposal"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

/** Auto-expand the first / most recent proposal for convenience. */
function proposals_shouldAutoExpand(proposal: ProposalData): boolean {
  // Auto-expand DRAFT proposals (most recently generated)
  return proposal.status === "DRAFT";
}
