"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Briefcase, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { keepPreviousData } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc/client";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { ErrorDisplay } from "@/components/shared/error-display";
import { EmptyState } from "@/components/shared/empty-state";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { JobCard } from "./job-card";
import { JobFilters } from "./job-filters";

const LAST_VISITED_KEY = "last-visited-job-id";

export function JobList() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [jobType, setJobType] = useState("all");
  const [experienceLevel, setExperienceLevel] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");

  // Debounce the search value so the query only fires 300ms after
  // the user stops typing — prevents input unmount on every keystroke
  const debouncedSearch = useDebouncedValue(search, 300);

  const queryInput = {
    page,
    pageSize,
    search: debouncedSearch || undefined,
    status: status !== "all" ? (status as "NEW") : undefined,
    jobType: jobType !== "all" ? (jobType as "HOURLY") : undefined,
    experienceLevel:
      experienceLevel !== "all"
        ? (experienceLevel as "ENTRY")
        : undefined,
    sortBy: sortBy as "created_at",
    sortDirection: "desc" as const,
  };

  const { data, isLoading, isFetching, error, refetch } =
    trpc.job.list.useQuery(queryInput, {
      // Keep showing old results while the new query loads so the
      // entire list doesn't flash to a skeleton on every filter change
      placeholderData: keepPreviousData,
    });

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

  // ---- Scroll-to-card & glow on return from detail page ----
  const scrollRestoredRef = useRef(false);

  useEffect(() => {
    // Only run once when data first loads (not on filter changes)
    if (scrollRestoredRef.current || !data?.items.length) return;

    const lastVisitedId = sessionStorage.getItem(LAST_VISITED_KEY);
    if (!lastVisitedId) return;

    // Clear immediately so it doesn't trigger again on filter / page changes
    sessionStorage.removeItem(LAST_VISITED_KEY);
    scrollRestoredRef.current = true;

    // Allow the DOM to paint the card list first
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(
        `[data-job-id="${lastVisitedId}"]`
      );
      if (!el) return;

      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("animate-return-glow");

      // Remove animation class after it finishes so it doesn't replay
      const cleanup = () => {
        el.classList.remove("animate-return-glow");
        el.removeEventListener("animationend", cleanup);
      };
      el.addEventListener("animationend", cleanup);
    });
  }, [data?.items.length]);

  // Filters are ALWAYS rendered — they must never unmount during loading
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

      {/* Subtle fetching indicator (doesn't replace content) */}
      {isFetching && !isLoading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Updating results…
        </div>
      )}

      {/* Initial load — no cached data at all */}
      {isLoading ? (
        <JobListContentSkeleton />
      ) : error ? (
        (() => {
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
        })()
      ) : !data || data.items.length === 0 ? (
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
          <div className={`space-y-3 transition-opacity duration-200 ${isFetching ? "opacity-60" : ""}`}>
            {data.items.map((job, idx) => (
              <div
                key={job.id}
                className={`animate-fade-in-up stagger-${Math.min(idx + 1, 6)}`}
              >
                <JobCard {...job} />
              </div>
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

function JobListContentSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-2xl border p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-80" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full max-w-lg" />
              <div className="flex gap-1.5">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-5 w-16 rounded-md" />
                ))}
              </div>
              <div className="flex gap-4">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-5 w-12 rounded-lg" />
              <Skeleton className="h-4 w-16 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

