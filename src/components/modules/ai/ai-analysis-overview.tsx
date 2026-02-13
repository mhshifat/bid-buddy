"use client";

/**
 * AI Analysis Overview — lists recent new/unanalysed jobs with quick-analyse actions.
 */

import { useCallback } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Zap,
  ExternalLink,
  Loader2,
  Brain,
  Sparkles,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "sonner";

export function AiAnalysisOverview() {
  const {
    data: newJobs,
    isLoading,
    refetch,
  } = trpc.job.list.useQuery({
    page: 1,
    pageSize: 10,
    status: "NEW",
    sortBy: "created_at",
    sortDirection: "desc",
  });

  const {
    data: analysedJobs,
    isLoading: isLoadingAnalysed,
  } = trpc.job.list.useQuery({
    page: 1,
    pageSize: 5,
    status: "ANALYZED",
    sortBy: "created_at",
    sortDirection: "desc",
  });

  const analyseMutation = trpc.ai.analyseJob.useMutation({
    onSuccess: () => {
      toast.success("Analysis complete!");
      refetch();
    },
    onError: (error) => {
      const errorData = error.data as { userMessage?: string } | undefined;
      toast.error("Analysis failed", {
        description: errorData?.userMessage ?? "Something went wrong.",
      });
    },
  });

  const handleAnalyse = useCallback(
    (jobId: string) => {
      analyseMutation.mutate({ jobId });
    },
    [analyseMutation]
  );

  return (
    <div className="space-y-6">
      {/* New / Unanalysed Jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4 text-amber-500" />
            Jobs Awaiting Analysis
          </CardTitle>
          <CardDescription>
            New jobs that haven&apos;t been analysed yet. Run AI analysis to get fit
            scores and recommendations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : !newJobs || newJobs.items.length === 0 ? (
            <EmptyState
              icon={Brain}
              title="All caught up!"
              description="No new jobs awaiting analysis."
            />
          ) : (
            <div className="space-y-2">
              {newJobs.items.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/jobs/${job.id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {job.title}
                    </Link>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        {job.jobType === "HOURLY" ? "Hourly" : "Fixed"}
                      </span>
                      {job.connectsRequired !== null && (
                        <span>· {job.connectsRequired} connects</span>
                      )}
                      {job.budgetMax !== null && (
                        <span>· ${job.budgetMax.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAnalyse(job.id)}
                      disabled={analyseMutation.isPending}
                    >
                      {analyseMutation.isPending ? (
                        <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Zap className="mr-1 h-3.5 w-3.5" />
                      )}
                      Analyse
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/jobs/${job.id}`}>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recently Analysed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            Recently Analysed
          </CardTitle>
          <CardDescription>
            Jobs with completed AI analysis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingAnalysed ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : !analysedJobs || analysedJobs.items.length === 0 ? (
            <EmptyState
              icon={Brain}
              title="No analysed jobs"
              description="Run analysis on jobs to see them here."
            />
          ) : (
            <div className="space-y-2">
              {analysedJobs.items.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/jobs/${job.id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {job.title}
                    </Link>
                    {job.latestAnalysis && (
                      <div className="mt-1 flex items-center gap-2">
                        {job.latestAnalysis.fitScore !== null && (
                          <Badge variant="outline" className="text-[10px]">
                            Fit: {job.latestAnalysis.fitScore}%
                          </Badge>
                        )}
                        {job.latestAnalysis.winProbability !== null && (
                          <Badge variant="outline" className="text-[10px]">
                            Win: {job.latestAnalysis.winProbability}%
                          </Badge>
                        )}
                        {job.latestAnalysis.recommendation && (
                          <Badge
                            variant={
                              job.latestAnalysis.recommendation === "BID"
                                ? "default"
                                : "secondary"
                            }
                            className="text-[10px]"
                          >
                            {job.latestAnalysis.recommendation}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/jobs/${job.id}`}>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

