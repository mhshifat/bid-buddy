"use client";

import { useState, useCallback } from "react";
import { Briefcase } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";
import { ErrorDisplay } from "@/components/shared/error-display";
import { EmptyState } from "@/components/shared/empty-state";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { JobCard } from "./job-card";
import { JobFilters } from "./job-filters";

export function JobList() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [jobType, setJobType] = useState("all");
  const [experienceLevel, setExperienceLevel] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");

  const queryInput = {
    page,
    pageSize,
    search: search || undefined,
    status: status !== "all" ? (status as "NEW") : undefined,
    jobType: jobType !== "all" ? (jobType as "HOURLY") : undefined,
    experienceLevel:
      experienceLevel !== "all"
        ? (experienceLevel as "ENTRY")
        : undefined,
    sortBy: sortBy as "created_at",
    sortDirection: "desc" as const,
  };

  const { data, isLoading, error, refetch } =
    trpc.job.list.useQuery(queryInput);

  const handleClearFilters = useCallback(() => {
    setSearch("");
    setStatus("all");
    setJobType("all");
    setExperienceLevel("all");
    setSortBy("created_at");
    setPage(1);
  }, []);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  }, []);

  if (isLoading) {
    return <JobListSkeleton />;
  }

  if (error) {
    const errorData = error.data as
      | { correlationId?: string; userMessage?: string }
      | undefined;
    return (
      <ErrorDisplay
        message={errorData?.userMessage ?? "Failed to load jobs."}
        correlationId={errorData?.correlationId}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-4">
      <JobFilters
        search={search}
        status={status}
        jobType={jobType}
        experienceLevel={experienceLevel}
        sortBy={sortBy}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        onStatusChange={(v) => {
          setStatus(v);
          setPage(1);
        }}
        onJobTypeChange={(v) => {
          setJobType(v);
          setPage(1);
        }}
        onExperienceLevelChange={(v) => {
          setExperienceLevel(v);
          setPage(1);
        }}
        onSortByChange={(v) => {
          setSortBy(v);
          setPage(1);
        }}
        onClearFilters={handleClearFilters}
      />

      {!data || data.items.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No jobs found"
          description={
            search || status !== "all" || jobType !== "all"
              ? "Try adjusting your filters to see more results."
              : "Install the browser extension and browse Upwork to start capturing jobs."
          }
          actionLabel={
            search || status !== "all" || jobType !== "all"
              ? "Clear Filters"
              : undefined
          }
          onAction={
            search || status !== "all" || jobType !== "all"
              ? handleClearFilters
              : undefined
          }
        />
      ) : (
        <>
          <div className="space-y-3">
            {data.items.map((job) => (
              <JobCard key={job.id} {...job} />
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

function JobListSkeleton() {
  return (
    <div className="space-y-4">
      {/* Filter skeleton */}
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-[150px]" />
        <Skeleton className="h-10 w-[140px]" />
        <Skeleton className="h-10 w-[160px]" />
        <Skeleton className="h-10 w-[160px]" />
      </div>
      {/* Card skeletons */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-lg border p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-80" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full max-w-lg" />
              <div className="flex gap-1">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-5 w-16 rounded-full" />
                ))}
              </div>
              <div className="flex gap-4">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

