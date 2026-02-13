"use client";

/**
 * Job Detail View — comprehensive view of a single job.
 * Integrates AI analysis, proposal generation, and client analysis actions.
 */

import Link from "next/link";
import { useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ExternalLink,
  MapPin,
  Star,
  DollarSign,
  Zap,
  Shield,
  Clock,
  AlertTriangle,
  ArrowLeft,
  FileText,
  Brain,
  Sparkles,
  Loader2,
  MessageSquare,
  Target,
  BookOpen,
  ListChecks,
  HelpCircle,
  Scale,
  Users,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { ErrorDisplay } from "@/components/shared/error-display";
import { JobStatusBadge } from "./job-status-badge";
import { AiAnalysisPanel } from "./ai-analysis-panel";
import { ProposalPanel } from "./proposal-panel";
import { ClientAnalysisButton } from "./client-analysis-button";
import { InterviewPrepPanel } from "./interview-prep-panel";
import { BidStrategyPanel } from "./bid-strategy-panel";
import { SkillGapPanel } from "./skill-gap-panel";
import { ScopeEstimatorPanel } from "./scope-estimator-panel";
import { DiscoveryQuestionsPanel } from "./discovery-questions-panel";
import { ContractAdvisorPanel } from "./contract-advisor-panel";
import { ProposalVariationsPanel } from "./proposal-variations-panel";
import { ClientIntelligencePanel } from "./client-intelligence-panel";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface JobDetailViewProps {
  jobId: string;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function JobDetailView({ jobId }: JobDetailViewProps) {
  const { data: job, isLoading, error, refetch } = trpc.job.getById.useQuery({
    id: jobId,
  });

  const analyseMutation = trpc.ai.analyseJob.useMutation({
    onSuccess: () => {
      toast.success("AI analysis complete!");
      refetch();
    },
    onError: (err) => {
      const errorData = err.data as { userMessage?: string } | undefined;
      toast.error("Analysis failed", {
        description: errorData?.userMessage ?? "Something went wrong.",
      });
    },
  });

  const proposalMutation = trpc.ai.generateProposal.useMutation({
    onSuccess: () => {
      toast.success("Proposal generated!");
      refetch();
    },
    onError: (err) => {
      const errorData = err.data as { userMessage?: string } | undefined;
      toast.error("Proposal generation failed", {
        description: errorData?.userMessage ?? "Something went wrong.",
      });
    },
  });

  const handleRefetch = useCallback(() => {
    refetch();
  }, [refetch]);

  // -------------------------------------------------------------------------
  // States
  // -------------------------------------------------------------------------

  if (isLoading) {
    return <JobDetailSkeleton />;
  }

  if (error) {
    const errorData = error.data as
      | { correlationId?: string; userMessage?: string }
      | undefined;
    return (
      <ErrorDisplay
        message={errorData?.userMessage ?? "Failed to load job details."}
        correlationId={errorData?.correlationId}
        onRetry={handleRefetch}
      />
    );
  }

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-lg font-semibold">Job not found</h2>
        <p className="text-sm text-muted-foreground">
          This job may have been removed.
        </p>
        <Button asChild className="mt-4">
          <Link href="/jobs">Back to Jobs</Link>
        </Button>
      </div>
    );
  }

  const latestAnalysis = job.analyses[0] ?? null;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/jobs"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Jobs
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold">{job.title}</h1>
            <JobStatusBadge status={job.status} />
            {job.isFlaggedFake && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="mr-1 h-3 w-3" />
                Possibly Fake
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>
              {job.jobType === "HOURLY" ? "Hourly" : "Fixed Price"}
            </span>
            {job.experienceLevel && (
              <>
                <span>·</span>
                <span>{job.experienceLevel}</span>
              </>
            )}
            {job.category && (
              <>
                <span>·</span>
                <span>{job.category}</span>
              </>
            )}
            {job.estimatedDuration && (
              <>
                <span>·</span>
                <span>{job.estimatedDuration}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <a
              href={job.jobUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View on Upwork
            </a>
          </Button>
          <Button
            size="sm"
            onClick={() => proposalMutation.mutate({ jobId })}
            disabled={proposalMutation.isPending}
          >
            {proposalMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {proposalMutation.isPending
              ? "Generating…"
              : "Generate Proposal"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="description">
            <TabsList className="flex-wrap">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="analysis">
                <Brain className="mr-1 h-3.5 w-3.5" />
                AI Analysis
              </TabsTrigger>
              <TabsTrigger value="proposals">
                Proposals ({job.proposals.length})
              </TabsTrigger>
              <TabsTrigger value="interview">
                <MessageSquare className="mr-1 h-3.5 w-3.5" />
                Interview Prep
              </TabsTrigger>
              <TabsTrigger value="bidstrategy">
                <Target className="mr-1 h-3.5 w-3.5" />
                Bid Strategy
              </TabsTrigger>
              <TabsTrigger value="skillgap">
                <BookOpen className="mr-1 h-3.5 w-3.5" />
                Skill Gap
              </TabsTrigger>
              <TabsTrigger value="scope">
                <ListChecks className="mr-1 h-3.5 w-3.5" />
                Scope
              </TabsTrigger>
              <TabsTrigger value="discovery">
                <HelpCircle className="mr-1 h-3.5 w-3.5" />
                Discovery
              </TabsTrigger>
              <TabsTrigger value="contract">
                <Scale className="mr-1 h-3.5 w-3.5" />
                Contract
              </TabsTrigger>
              <TabsTrigger value="variations">
                <MessageSquare className="mr-1 h-3.5 w-3.5" />
                Variations
              </TabsTrigger>
              <TabsTrigger value="clientintel">
                <Users className="mr-1 h-3.5 w-3.5" />
                Client Intel
              </TabsTrigger>
              <TabsTrigger value="notes">
                Notes ({job.notes.length})
              </TabsTrigger>
            </TabsList>

            {/* Description Tab */}
            <TabsContent value="description" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {job.description}
                    </p>
                  </div>
                  {job.skillsRequired.length > 0 && (
                    <>
                      <Separator className="my-4" />
                      <div>
                        <h3 className="mb-2 text-sm font-semibold">
                          Required Skills
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                          {job.skillsRequired.map((skill) => (
                            <Badge
                              key={skill}
                              variant="outline"
                              className="text-xs"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI Analysis Tab */}
            <TabsContent value="analysis" className="mt-4">
              <AiAnalysisPanel
                jobId={jobId}
                latestAnalysis={latestAnalysis}
                onAnalysisComplete={handleRefetch}
              />
            </TabsContent>

            {/* Proposals Tab */}
            <TabsContent value="proposals" className="mt-4">
              <ProposalPanel
                jobId={jobId}
                proposals={job.proposals}
                onProposalGenerated={handleRefetch}
              />
            </TabsContent>

            {/* Interview Prep Tab */}
            <TabsContent value="interview" className="mt-4">
              <InterviewPrepPanel jobId={jobId} />
            </TabsContent>

            {/* Bid Strategy Tab */}
            <TabsContent value="bidstrategy" className="mt-4">
              <BidStrategyPanel jobId={jobId} />
            </TabsContent>

            {/* Skill Gap Tab */}
            <TabsContent value="skillgap" className="mt-4">
              <SkillGapPanel jobId={jobId} />
            </TabsContent>

            {/* Scope Estimator Tab */}
            <TabsContent value="scope" className="mt-4">
              <ScopeEstimatorPanel jobId={jobId} />
            </TabsContent>

            {/* Discovery Questions Tab */}
            <TabsContent value="discovery" className="mt-4">
              <DiscoveryQuestionsPanel jobId={jobId} />
            </TabsContent>

            {/* Contract Advisor Tab */}
            <TabsContent value="contract" className="mt-4">
              <ContractAdvisorPanel jobId={jobId} />
            </TabsContent>

            {/* Proposal Variations Tab */}
            <TabsContent value="variations" className="mt-4">
              <ProposalVariationsPanel jobId={jobId} />
            </TabsContent>

            {/* Client Intelligence Tab */}
            <TabsContent value="clientintel" className="mt-4">
              <ClientIntelligencePanel jobId={jobId} />
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes" className="mt-4">
              {job.notes.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <p className="text-sm text-muted-foreground">
                      No notes yet. Run a client analysis to auto-generate notes.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {job.notes.map((note) => (
                    <Card key={note.id}>
                      <CardContent className="p-4">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                          {note.content}
                        </p>
                        <p className="mt-2 text-[10px] text-muted-foreground">
                          {new Date(note.createdAt).toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Client Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {job.clientCountry && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{job.clientCountry}</span>
                </div>
              )}
              {job.clientRating !== null && (
                <div className="flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 text-amber-500" />
                  <span>{job.clientRating.toFixed(1)} rating</span>
                </div>
              )}
              {job.clientTotalSpent !== null && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>
                    ${job.clientTotalSpent.toLocaleString()} spent
                  </span>
                </div>
              )}
              {job.clientTotalHires !== null && (
                <div className="text-sm text-muted-foreground">
                  {job.clientTotalHires} hires
                  {job.clientHireRate !== null &&
                    ` (${job.clientHireRate}% rate)`}
                </div>
              )}
              {job.clientPaymentVerified && (
                <div className="flex items-center gap-2 text-sm text-emerald-600">
                  <Shield className="h-4 w-4" />
                  <span>Payment Verified</span>
                </div>
              )}
              {job.clientMemberSince && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    Since{" "}
                    {new Date(job.clientMemberSince).toLocaleDateString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Budget Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Budget</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {job.jobType === "HOURLY" ? (
                <>
                  {job.hourlyRateMin !== null &&
                    job.hourlyRateMax !== null && (
                      <p className="text-lg font-bold">
                        ${job.hourlyRateMin}–${job.hourlyRateMax}
                        <span className="text-sm font-normal text-muted-foreground">
                          /hr
                        </span>
                      </p>
                    )}
                </>
              ) : (
                <>
                  {job.budgetMax !== null && (
                    <p className="text-lg font-bold">
                      ${job.budgetMax.toLocaleString()}
                    </p>
                  )}
                </>
              )}
              {job.connectsRequired !== null && (
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <span>{job.connectsRequired} connects required</span>
                </div>
              )}
              {job.proposalsCount !== null && (
                <p className="text-sm text-muted-foreground">
                  {job.proposalsCount} proposals received
                </p>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          {job.tags.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {job.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-xs"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Quick Actions</CardTitle>
              <CardDescription className="text-xs">
                Manage this job&apos;s status and analysis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                size="sm"
                onClick={() => analyseMutation.mutate({ jobId })}
                disabled={analyseMutation.isPending}
              >
                {analyseMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="mr-2 h-4 w-4" />
                )}
                {analyseMutation.isPending
                  ? "Analysing…"
                  : "Run AI Analysis"}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                size="sm"
                onClick={() => proposalMutation.mutate({ jobId })}
                disabled={proposalMutation.isPending}
              >
                {proposalMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="mr-2 h-4 w-4" />
                )}
                {proposalMutation.isPending
                  ? "Generating…"
                  : "Generate Proposal"}
              </Button>
              <ClientAnalysisButton
                jobId={jobId}
                onComplete={handleRefetch}
              />
              <Button
                variant="outline"
                className="w-full justify-start text-red-600 hover:text-red-700"
                size="sm"
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Flag as Fake
              </Button>
              <div className="pt-1">
                <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  More AI Tools
                </p>
                <div className="space-y-1.5">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-xs"
                    size="sm"
                    onClick={() => {
                      const el = document.querySelector('[data-value="interview"]') as HTMLButtonElement | null;
                      el?.click();
                    }}
                  >
                    <MessageSquare className="mr-2 h-3.5 w-3.5" />
                    Interview Prep
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-xs"
                    size="sm"
                    onClick={() => {
                      const el = document.querySelector('[data-value="bidstrategy"]') as HTMLButtonElement | null;
                      el?.click();
                    }}
                  >
                    <Target className="mr-2 h-3.5 w-3.5" />
                    Bid Strategy
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-xs"
                    size="sm"
                    onClick={() => {
                      const el = document.querySelector('[data-value="skillgap"]') as HTMLButtonElement | null;
                      el?.click();
                    }}
                  >
                    <BookOpen className="mr-2 h-3.5 w-3.5" />
                    Skill Gap Analysis
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-xs"
                    size="sm"
                    onClick={() => {
                      const el = document.querySelector('[data-value="scope"]') as HTMLButtonElement | null;
                      el?.click();
                    }}
                  >
                    <ListChecks className="mr-2 h-3.5 w-3.5" />
                    Scope Estimator
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-xs"
                    size="sm"
                    onClick={() => {
                      const el = document.querySelector('[data-value="discovery"]') as HTMLButtonElement | null;
                      el?.click();
                    }}
                  >
                    <HelpCircle className="mr-2 h-3.5 w-3.5" />
                    Discovery Questions
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-xs"
                    size="sm"
                    onClick={() => {
                      const el = document.querySelector('[data-value="contract"]') as HTMLButtonElement | null;
                      el?.click();
                    }}
                  >
                    <Scale className="mr-2 h-3.5 w-3.5" />
                    Contract Advisor
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-xs"
                    size="sm"
                    onClick={() => {
                      const el = document.querySelector('[data-value="variations"]') as HTMLButtonElement | null;
                      el?.click();
                    }}
                  >
                    <MessageSquare className="mr-2 h-3.5 w-3.5" />
                    Tone Variations
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-xs"
                    size="sm"
                    onClick={() => {
                      const el = document.querySelector('[data-value="clientintel"]') as HTMLButtonElement | null;
                      el?.click();
                    }}
                  >
                    <Users className="mr-2 h-3.5 w-3.5" />
                    Client Intelligence
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Client Trust Analysis (inline result) */}
          {/* ClientAnalysisButton will show its own card with results */}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function JobDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-24" />
      <div className="space-y-2">
        <Skeleton className="h-7 w-96" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
