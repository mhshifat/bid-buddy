"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { ErrorDisplay } from "@/components/shared/error-display";

export function ConnectsRoiCard() {
  const { data, isLoading, error, refetch } = trpc.dashboard.connectsRoi.useQuery();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" /> Connects ROI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    const errorData = error.data as { correlationId?: string; userMessage?: string } | undefined;
    return (
      <ErrorDisplay
        message={errorData?.userMessage ?? "Failed to load connects ROI."}
        correlationId={errorData?.correlationId}
        onRetry={() => refetch()}
      />
    );
  }

  if (!data || data.totalProposalsSent === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" /> Connects ROI
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Zap className="h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">No proposal data yet</p>
          <p className="text-xs text-muted-foreground">Submit proposals to track your connects efficiency</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-500" /> Connects ROI
        </CardTitle>
        <CardDescription className="text-xs">Last 30 days — tracks your connects spending efficiency</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="rounded-md border p-2.5 text-center">
            <p className="text-[10px] text-muted-foreground">Spent</p>
            <p className="text-sm font-bold">{data.totalConnectsSpent}</p>
          </div>
          <div className="rounded-md border p-2.5 text-center">
            <p className="text-[10px] text-muted-foreground">Sent</p>
            <p className="text-sm font-bold">{data.totalProposalsSent}</p>
          </div>
          <div className="rounded-md border p-2.5 text-center">
            <p className="text-[10px] text-muted-foreground">Won</p>
            <p className="text-sm font-bold text-emerald-600">{data.totalProposalsWon}</p>
          </div>
          <div className="rounded-md border p-2.5 text-center">
            <p className="text-[10px] text-muted-foreground">Win Rate</p>
            <p className="text-sm font-bold text-primary">{data.overallWinRate}%</p>
          </div>
        </div>

        {data.avgCostPerWin !== null && (
          <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-3">
            <span className="text-sm font-medium">Avg Connects per Win</span>
            <span className="text-lg font-bold text-primary">{data.avgCostPerWin}</span>
          </div>
        )}

        {/* By Category */}
        {data.categories.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">By Category</p>
            <div className="space-y-2">
              {data.categories.map((cat) => (
                <div key={cat.category} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{cat.category}</span>
                    <Badge variant="outline" className="text-[9px]">
                      {cat.proposalsSent} sent
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-muted-foreground">{cat.connectsSpent} connects</span>
                    <span className={`font-medium ${cat.winRate > 0 ? "text-emerald-600" : "text-muted-foreground"}`}>
                      {cat.winRate}% win
                    </span>
                    {cat.costPerWin !== null && (
                      <span className="text-muted-foreground">
                        {cat.costPerWin}/win
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

