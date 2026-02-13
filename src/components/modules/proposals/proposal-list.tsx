"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc/client";
import { ErrorDisplay } from "@/components/shared/error-display";
import { EmptyState } from "@/components/shared/empty-state";
import { PaginationControls } from "@/components/shared/pagination-controls";

const proposalStatusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  REVIEW: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  READY: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  SENT: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
  VIEWED: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  SHORTLISTED: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
  ACCEPTED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  WITHDRAWN: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

export function ProposalList() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState("all");

  const { data, isLoading, error, refetch } = trpc.proposal.list.useQuery({
    page,
    pageSize,
    status: status !== "all" ? (status as "DRAFT") : undefined,
  });

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  }, []);

  if (isLoading) {
    return <ProposalListSkeleton />;
  }

  if (error) {
    const errorData = error.data as { correlationId?: string; userMessage?: string } | undefined;
    return (
      <ErrorDisplay
        message={errorData?.userMessage ?? "Failed to load proposals."}
        correlationId={errorData?.correlationId}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="REVIEW">Review</SelectItem>
            <SelectItem value="READY">Ready</SelectItem>
            <SelectItem value="SENT">Sent</SelectItem>
            <SelectItem value="VIEWED">Viewed</SelectItem>
            <SelectItem value="SHORTLISTED">Shortlisted</SelectItem>
            <SelectItem value="ACCEPTED">Accepted</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!data || data.items.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No proposals found"
          description="Create a proposal for a job to get started."
        />
      ) : (
        <>
          <div className="space-y-3">
            {data.items.map((proposal) => (
              <Card key={proposal.id} className="transition-all hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/jobs/${proposal.jobId}`}
                          className="text-sm font-semibold hover:underline"
                        >
                          {proposal.jobTitle}
                        </Link>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] ${proposalStatusColors[proposal.status] ?? ""}`}
                        >
                          {proposal.status}
                        </Badge>
                        {proposal.aiGenerated && (
                          <Badge variant="outline" className="text-[10px]">
                            AI Generated
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {proposal.coverLetter}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {proposal.proposedRate !== null && (
                          <span>${proposal.proposedRate}/hr</span>
                        )}
                        {proposal.connectsUsed !== null && (
                          <span>{proposal.connectsUsed} connects</span>
                        )}
                        <span>
                          {new Date(proposal.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <PaginationControls
            page={data.page}
            pageSize={data.pageSize}
            total={data.total}
            totalPages={data.totalPages}
            hasNext={data.hasNext}
            hasPrevious={data.hasPrevious}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
          />
        </>
      )}
    </div>
  );
}

function ProposalListSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-[160px]" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-lg border p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-64" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full max-w-md" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

