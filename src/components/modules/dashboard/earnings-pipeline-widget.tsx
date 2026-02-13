"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingUp, ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

const statusColors: Record<string, string> = {
  SENT: "bg-blue-100 text-blue-700",
  VIEWED: "bg-purple-100 text-purple-700",
  SHORTLISTED: "bg-emerald-100 text-emerald-700",
};

export function EarningsPipelineWidget() {
  const { data, isLoading } = trpc.dashboard.pipeline.useQuery();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-600" /> Earnings Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.activeProposals === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-600" /> Earnings Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <DollarSign className="h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">No active proposals in pipeline</p>
          <p className="text-xs text-muted-foreground">Submit proposals to see your projected earnings</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-emerald-600" /> Earnings Pipeline
        </CardTitle>
        <CardDescription className="text-xs">
          Projected income from {data.activeProposals} active proposals
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border p-3 text-center">
            <p className="text-xs text-muted-foreground">If All Win</p>
            <p className="text-lg font-bold text-emerald-600">
              ${data.totalEstimated.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-center">
            <p className="text-xs text-muted-foreground">Expected</p>
            <p className="text-lg font-bold text-primary">
              ${data.totalExpected.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Pipeline Items */}
        <div className="space-y-2">
          {data.items.slice(0, 5).map((item) => (
            <Link
              key={item.proposalId}
              href={`/jobs/${item.jobId}`}
              className="flex items-center justify-between rounded-md border px-3 py-2 text-xs transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Badge variant="outline" className={`text-[9px] shrink-0 ${statusColors[item.status] ?? ""}`}>
                  {item.status}
                </Badge>
                <span className="truncate font-medium">{item.jobTitle}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="text-muted-foreground">
                  ${item.estimatedValue.toLocaleString()}
                </span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium flex items-center gap-0.5">
                  <TrendingUp className="h-3 w-3 text-emerald-600" />
                  ${item.expectedValue.toLocaleString()}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {data.items.length > 5 && (
          <Link
            href="/proposals"
            className="block text-center text-xs text-muted-foreground hover:text-foreground"
          >
            View all {data.items.length} proposals →
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

