"use client";

/**
 * Job Detail View — immersive, bento-grid layout with glass-morphism cards,
 * animated hero header, floating sidebar, and micro-interactions.
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
  Activity,
  Rocket,
  ChevronRight,
  TrendingUp,
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
import { JobTimeline } from "@/components/modules/pipeline/job-timeline";
import { ConvertToProjectDialog } from "@/components/modules/pipeline/convert-to-project-dialog";
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
        className="group inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Back to Jobs
      </Link>

      {/* ================================================================ */}
      {/* HERO HEADER — immersive with SVG background + glass overlay      */}
      {/* ================================================================ */}
      <div className="animate-fade-in-up stagger-1 relative overflow-hidden rounded-2xl border bg-gradient-to-br from-card via-card to-primary/[0.04] p-6 md:p-8">
        {/* SVG background */}
        <JobDetailBgSvg />

        {/* Gradient accent */}
        <div className="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-blue-500/50 via-primary/40 to-violet-500/50" />

        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3 max-w-3xl">
            {/* Title row */}
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">
                {job.title}
              </h1>
              <JobStatusBadge status={job.status} />
              {job.isFlaggedFake && (
                <Badge variant="destructive" className="text-xs animate-glow-pulse">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  Possibly Fake
                </Badge>
              )}
            </div>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>{job.jobType === "HOURLY" ? "Hourly" : "Fixed Price"}</span>
              {job.experienceLevel && (
                <>
                  <span className="text-muted-foreground/30">·</span>
                  <span>{job.experienceLevel}</span>
                </>
              )}
              {job.category && (
                <>
                  <span className="text-muted-foreground/30">·</span>
                  <span>{job.category}</span>
                </>
              )}
              {job.estimatedDuration && (
                <>
                  <span className="text-muted-foreground/30">·</span>
                  <span>{job.estimatedDuration}</span>
                </>
              )}
            </div>

            {/* Quick AI insight badges */}
            {latestAnalysis && (
              <div className="flex flex-wrap gap-2 animate-fade-in-up stagger-2">
                {latestAnalysis.fitScore !== null && (
                  <div className="flex items-center gap-1 rounded-lg bg-background/60 border backdrop-blur px-2.5 py-1 text-xs">
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                    <span className="font-medium">{latestAnalysis.fitScore}%</span>
                    <span className="text-muted-foreground">Fit</span>
                  </div>
                )}
                {latestAnalysis.winProbability !== null && (
                  <div className="flex items-center gap-1 rounded-lg bg-background/60 border backdrop-blur px-2.5 py-1 text-xs">
                    <Target className="h-3 w-3 text-blue-500" />
                    <span className="font-medium">{latestAnalysis.winProbability}%</span>
                    <span className="text-muted-foreground">Win</span>
                  </div>
                )}
                {latestAnalysis.recommendation && (
                  <Badge
                    variant={latestAnalysis.recommendation === "BID" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {latestAnalysis.recommendation}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button asChild variant="outline" size="sm" className="rounded-xl">
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
              className="rounded-xl"
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
      </div>

      {/* ================================================================ */}
      {/* MAIN BENTO GRID                                                  */}
      {/* ================================================================ */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content — 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="description">
            <TabsList className="flex-wrap rounded-xl bg-muted/50 p-1">
              <TabsTrigger value="description" className="rounded-lg text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">Description</TabsTrigger>
              <TabsTrigger value="analysis" className="rounded-lg text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Brain className="mr-1 h-3.5 w-3.5" />AI Analysis
              </TabsTrigger>
              <TabsTrigger value="proposals" className="rounded-lg text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Proposals ({job.proposals.length})
              </TabsTrigger>
              <TabsTrigger value="interview" className="rounded-lg text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <MessageSquare className="mr-1 h-3.5 w-3.5" />Interview
              </TabsTrigger>
              <TabsTrigger value="bidstrategy" className="rounded-lg text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Target className="mr-1 h-3.5 w-3.5" />Bid Strategy
              </TabsTrigger>
              <TabsTrigger value="skillgap" className="rounded-lg text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <BookOpen className="mr-1 h-3.5 w-3.5" />Skill Gap
              </TabsTrigger>
              <TabsTrigger value="scope" className="rounded-lg text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <ListChecks className="mr-1 h-3.5 w-3.5" />Scope
              </TabsTrigger>
              <TabsTrigger value="discovery" className="rounded-lg text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <HelpCircle className="mr-1 h-3.5 w-3.5" />Discovery
              </TabsTrigger>
              <TabsTrigger value="contract" className="rounded-lg text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Scale className="mr-1 h-3.5 w-3.5" />Contract
              </TabsTrigger>
              <TabsTrigger value="variations" className="rounded-lg text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <MessageSquare className="mr-1 h-3.5 w-3.5" />Variations
              </TabsTrigger>
              <TabsTrigger value="clientintel" className="rounded-lg text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Users className="mr-1 h-3.5 w-3.5" />Client Intel
              </TabsTrigger>
              <TabsTrigger value="timeline" className="rounded-lg text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Activity className="mr-1 h-3.5 w-3.5" />Timeline
              </TabsTrigger>
              <TabsTrigger value="notes" className="rounded-lg text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Notes ({job.notes.length})
              </TabsTrigger>
            </TabsList>

            {/* ---- Description Tab ---- */}
            <TabsContent value="description" className="mt-4 animate-fade-in-up">
              <div className="rounded-2xl border bg-card overflow-hidden">
                <div className="p-6">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {job.description}
                    </p>
                  </div>
                  {job.skillsRequired.length > 0 && (
                    <>
                      <Separator className="my-5" />
                      <div>
                        <h3 className="mb-3 text-sm font-semibold flex items-center gap-2">
                          <Zap className="h-3.5 w-3.5 text-primary" />
                          Required Skills
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {job.skillsRequired.map((skill) => (
                            <Badge
                              key={skill}
                              variant="outline"
                              className="text-xs rounded-lg px-2.5 py-0.5 border-primary/20 bg-primary/5"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* ---- AI Analysis Tab ---- */}
            <TabsContent value="analysis" className="mt-4 animate-fade-in-up">
              <AiAnalysisPanel
                jobId={jobId}
                latestAnalysis={latestAnalysis}
                onAnalysisComplete={handleRefetch}
              />
            </TabsContent>

            {/* ---- Proposals Tab ---- */}
            <TabsContent value="proposals" className="mt-4 animate-fade-in-up">
              <ProposalPanel
                jobId={jobId}
                proposals={job.proposals}
                onProposalGenerated={handleRefetch}
              />
            </TabsContent>

            {/* ---- Interview Prep Tab ---- */}
            <TabsContent value="interview" className="mt-4 animate-fade-in-up">
              <InterviewPrepPanel jobId={jobId} />
            </TabsContent>

            {/* ---- Bid Strategy Tab ---- */}
            <TabsContent value="bidstrategy" className="mt-4 animate-fade-in-up">
              <BidStrategyPanel jobId={jobId} />
            </TabsContent>

            {/* ---- Skill Gap Tab ---- */}
            <TabsContent value="skillgap" className="mt-4 animate-fade-in-up">
              <SkillGapPanel jobId={jobId} />
            </TabsContent>

            {/* ---- Scope Estimator Tab ---- */}
            <TabsContent value="scope" className="mt-4 animate-fade-in-up">
              <ScopeEstimatorPanel
                jobId={jobId}
                jobTitle={job?.title}
                jobDescription={job?.description}
              />
            </TabsContent>

            {/* ---- Discovery Questions Tab ---- */}
            <TabsContent value="discovery" className="mt-4 animate-fade-in-up">
              <DiscoveryQuestionsPanel jobId={jobId} />
            </TabsContent>

            {/* ---- Contract Advisor Tab ---- */}
            <TabsContent value="contract" className="mt-4 animate-fade-in-up">
              <ContractAdvisorPanel jobId={jobId} />
            </TabsContent>

            {/* ---- Proposal Variations Tab ---- */}
            <TabsContent value="variations" className="mt-4 animate-fade-in-up">
              <ProposalVariationsPanel jobId={jobId} />
            </TabsContent>

            {/* ---- Client Intelligence Tab ---- */}
            <TabsContent value="clientintel" className="mt-4 animate-fade-in-up">
              <ClientIntelligencePanel jobId={jobId} />
            </TabsContent>

            {/* ---- Timeline Tab ---- */}
            <TabsContent value="timeline" className="mt-4 animate-fade-in-up">
              <div className="space-y-4">
                <JobTimeline jobId={jobId} />
                {(job.status === "ACCEPTED" || job.status === "INTERVIEWING") && (
                  <ConvertToProjectDialog
                    jobId={jobId}
                    jobTitle={job.title}
                    jobDescription={job.description}
                    budgetMax={job.budgetMax}
                    hourlyRate={job.hourlyRateMax}
                    proposalId={job.proposals[0]?.id ?? null}
                  >
                    <Button className="w-full rounded-xl">
                      <Rocket className="mr-2 h-4 w-4" />
                      Convert to Project
                    </Button>
                  </ConvertToProjectDialog>
                )}
              </div>
            </TabsContent>

            {/* ---- Notes Tab ---- */}
            <TabsContent value="notes" className="mt-4 animate-fade-in-up">
              {job.notes.length === 0 ? (
                <div className="rounded-2xl border bg-card">
                  <div className="flex flex-col items-center justify-center py-12">
                    <p className="text-sm text-muted-foreground">
                      No notes yet. Run a client analysis to auto-generate notes.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {job.notes.map((note, idx) => (
                    <div
                      key={note.id}
                      className={`animate-fade-in-up rounded-2xl border bg-card p-4 stagger-${Math.min(idx + 1, 6)}`}
                    >
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                        {note.content}
                      </p>
                      <p className="mt-2 text-[10px] text-muted-foreground/60">
                        {new Date(note.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* ============================================================== */}
        {/* SIDEBAR — glass-morphism cards with micro interactions          */}
        {/* ============================================================== */}
        <div className="space-y-4">
          {/* Client Info Card */}
          <div className="animate-fade-in-up stagger-2 group relative overflow-hidden rounded-2xl border bg-card p-5 transition-all duration-300 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5">
            <div className="shimmer-bg pointer-events-none absolute inset-0 rounded-2xl" />
            <div className="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <div className="relative z-10">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/10">
                  <Users className="h-3 w-3 text-blue-500" />
                </div>
                Client Information
              </h3>
              <div className="space-y-3">
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
                    <span>${job.clientTotalSpent.toLocaleString()} spent</span>
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
              </div>
            </div>
          </div>

          {/* Budget Card */}
          <div className="animate-fade-in-up stagger-3 group relative overflow-hidden rounded-2xl border bg-card p-5 transition-all duration-300 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5">
            <div className="shimmer-bg pointer-events-none absolute inset-0 rounded-2xl" />
            <div className="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
            <div className="relative z-10">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10">
                  <DollarSign className="h-3 w-3 text-emerald-500" />
                </div>
                Budget
              </h3>
              <div className="space-y-2">
                {job.jobType === "HOURLY" ? (
                  <>
                    {job.hourlyRateMin !== null &&
                      job.hourlyRateMax !== null && (
                        <p className="text-2xl font-bold">
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
                      <p className="text-2xl font-bold">
                        ${job.budgetMax.toLocaleString()}
                      </p>
                    )}
                  </>
                )}
                {job.connectsRequired !== null && (
                  <div className="flex items-center gap-2 text-sm">
                    <Zap className="h-4 w-4 text-amber-500" />
                    <span>{job.connectsRequired} connects required</span>
                  </div>
                )}
                {job.proposalsCount !== null && (
                  <p className="text-sm text-muted-foreground">
                    {job.proposalsCount} proposals received
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Tags */}
          {job.tags.length > 0 && (
            <div className="animate-fade-in-up stagger-4 rounded-2xl border bg-card p-5">
              <h3 className="text-sm font-semibold mb-3">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {job.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-xs rounded-lg"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions Card */}
          <div className="animate-fade-in-up stagger-5 group relative overflow-hidden rounded-2xl border bg-card p-5 transition-all duration-300 hover:shadow-lg hover:shadow-black/5">
            <div className="shimmer-bg pointer-events-none absolute inset-0 rounded-2xl" />
            <div className="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
            <div className="relative z-10 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-500/10">
                  <Sparkles className="h-3 w-3 text-violet-500" />
                </div>
                Quick Actions
              </h3>
              <p className="text-xs text-muted-foreground">
                Manage this job&apos;s status and analysis.
              </p>

              <div className="space-y-1.5">
                <Button
                  variant="outline"
                  className="w-full justify-start rounded-xl text-xs"
                  size="sm"
                  onClick={() => analyseMutation.mutate({ jobId })}
                  disabled={analyseMutation.isPending}
                >
                  {analyseMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="mr-2 h-4 w-4 text-amber-500" />
                  )}
                  {analyseMutation.isPending
                    ? "Analysing…"
                    : "Run AI Analysis"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start rounded-xl text-xs"
                  size="sm"
                  onClick={() => proposalMutation.mutate({ jobId })}
                  disabled={proposalMutation.isPending}
                >
                  {proposalMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="mr-2 h-4 w-4 text-blue-500" />
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
                  className="w-full justify-start rounded-xl text-xs text-red-600 hover:text-red-700"
                  size="sm"
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Flag as Fake
                </Button>
              </div>

              {/* More AI tools */}
              <Separator className="my-2" />
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                AI Tools
              </p>
              <div className="grid grid-cols-2 gap-1">
                {[
                  { label: "Interview", value: "interview", icon: MessageSquare, color: "text-cyan-500" },
                  { label: "Bid Strategy", value: "bidstrategy", icon: Target, color: "text-orange-500" },
                  { label: "Skill Gap", value: "skillgap", icon: BookOpen, color: "text-emerald-500" },
                  { label: "Scope", value: "scope", icon: ListChecks, color: "text-violet-500" },
                  { label: "Discovery", value: "discovery", icon: HelpCircle, color: "text-pink-500" },
                  { label: "Contract", value: "contract", icon: Scale, color: "text-amber-500" },
                  { label: "Variations", value: "variations", icon: MessageSquare, color: "text-blue-500" },
                  { label: "Client Intel", value: "clientintel", icon: Users, color: "text-teal-500" },
                ].map(({ label, value, icon: Icon, color }) => (
                  <Button
                    key={value}
                    variant="ghost"
                    className="w-full justify-start text-[11px] rounded-lg px-2 h-8"
                    size="sm"
                    onClick={() => {
                      const el = document.querySelector(`[data-value="${value}"]`) as HTMLButtonElement | null;
                      el?.click();
                    }}
                  >
                    <Icon className={`mr-1.5 h-3 w-3 ${color}`} />
                    {label}
                    <ChevronRight className="ml-auto h-3 w-3 text-muted-foreground/40" />
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Background SVG
// ---------------------------------------------------------------------------

function JobDetailBgSvg() {
  return (
    <svg
      className="absolute inset-0 h-full w-full pointer-events-none"
      viewBox="0 0 800 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {/* Diagonal grid */}
      <line x1="0" y1="0" x2="200" y2="200" stroke="currentColor" strokeWidth="0.3" opacity="0.04" className="text-primary" />
      <line x1="200" y1="0" x2="400" y2="200" stroke="currentColor" strokeWidth="0.3" opacity="0.04" className="text-primary" />
      <line x1="400" y1="0" x2="600" y2="200" stroke="currentColor" strokeWidth="0.3" opacity="0.04" className="text-primary" />
      <line x1="600" y1="0" x2="800" y2="200" stroke="currentColor" strokeWidth="0.3" opacity="0.04" className="text-primary" />

      {/* Decorative circles */}
      <circle cx="720" cy="50" r="70" stroke="currentColor" strokeWidth="0.5" opacity="0.04" className="text-blue-500 animate-spin-slow" />
      <circle cx="720" cy="50" r="40" stroke="currentColor" strokeWidth="0.5" opacity="0.03" className="text-violet-500" />

      {/* Hex pattern */}
      <polygon points="50,10 65,25 65,45 50,60 35,45 35,25" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.04" className="text-primary" />
      <polygon points="90,40 105,55 105,75 90,90 75,75 75,55" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.03" className="text-primary" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function JobDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-24 rounded-lg" />
      {/* Hero skeleton */}
      <div className="rounded-2xl border p-6 md:p-8 space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-7 w-96" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-lg" />
          <Skeleton className="h-6 w-20 rounded-lg" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
