"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  FileText,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  DollarSign,
  Clock,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { toast } from "sonner";

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

interface ProposalItem {
  id: string;
  jobId: string;
  jobTitle: string;
  jobType: string;
  jobStatus: string;
  coverLetter: string;
  proposedRate: number | null;
  proposedDuration: string | null;
  connectsUsed: number | null;
  status: string;
  aiGenerated: boolean;
  sentAt: Date | null;
  createdAt: Date;
}

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
          description="Generate an AI proposal from a job page to get started."
        />
      ) : (
        <>
          <div className="space-y-3">
            {data.items.map((proposal) => (
              <ProposalCard key={proposal.id} proposal={proposal as ProposalItem} />
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

// ---------------------------------------------------------------------------
// Proposal Card with expand/collapse
// ---------------------------------------------------------------------------

function ProposalCard({ proposal }: { proposal: ProposalItem }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(proposal.coverLetter);
    setCopied(true);
    toast.success("Cover letter copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }, [proposal.coverLetter]);

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-2 px-4 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/jobs/${proposal.jobId}`}
                className="text-sm font-semibold hover:underline flex items-center gap-1"
              >
                {proposal.jobTitle}
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </Link>
              <Badge
                variant="secondary"
                className={`text-[10px] ${proposalStatusColors[proposal.status] ?? ""}`}
              >
                {proposal.status}
              </Badge>
              {proposal.aiGenerated && (
                <Badge variant="outline" className="text-[10px]">
                  <Sparkles className="mr-1 h-2.5 w-2.5" />
                  AI
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {proposal.proposedRate !== null && (
                <span className="flex items-center gap-1 font-medium text-emerald-600">
                  <DollarSign className="h-3 w-3" />
                  {proposal.proposedRate}
                </span>
              )}
              {proposal.proposedDuration && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {proposal.proposedDuration}
                </span>
              )}
              {proposal.connectsUsed !== null && (
                <span>{proposal.connectsUsed} connects</span>
              )}
              <span>
                {new Date(proposal.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
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
      <CardContent className="px-4 pb-4 pt-0">
        {expanded ? (
          <>
            <Separator className="mb-3" />
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {proposal.coverLetter}
            </p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {proposal.coverLetter}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

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
