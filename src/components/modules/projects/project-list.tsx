"use client";

/**
 * Project List — bento grid of project cards with glass-morphism,
 * staggered animations, and hover interactions.
 */

import { useState, useCallback } from "react";
import { FolderKanban, DollarSign, Calendar, CheckSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { keepPreviousData } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc/client";
import { ErrorDisplay } from "@/components/shared/error-display";
import { EmptyState } from "@/components/shared/empty-state";
import { PaginationControls } from "@/components/shared/pagination-controls";

const projectStatusColors: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  ACTIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  ON_HOLD: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  COMPLETED: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  DISPUTED: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

export function ProjectList() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState("all");

  const { data, isLoading, error, refetch } = trpc.project.list.useQuery({
    page,
    pageSize,
    status: status !== "all" ? (status as "ACTIVE") : undefined,
  }, {
    placeholderData: keepPreviousData,
  });

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  }, []);

  if (isLoading) {
    return <ProjectListSkeleton />;
  }

  if (error) {
    const errorData = error.data as { correlationId?: string; userMessage?: string } | undefined;
    return (
      <ErrorDisplay
        message={errorData?.userMessage ?? "Failed to load projects."}
        correlationId={errorData?.correlationId}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-[160px] rounded-xl">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="ON_HOLD">On Hold</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
            <SelectItem value="DISPUTED">Disputed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!data || data.items.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects found"
          description="Projects will appear here once you land Upwork jobs."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((project, idx) => (
              <div
                key={project.id}
                className={`
                  animate-fade-in-up stagger-${Math.min(idx + 1, 6)}
                  group relative overflow-hidden rounded-2xl border bg-card
                  p-4 transition-all duration-300
                  hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5
                  dark:hover:shadow-black/20
                `}
              >
                {/* Shimmer overlay */}
                <div className="shimmer-bg pointer-events-none absolute inset-0 rounded-2xl" />

                {/* Hover gradient reveal */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 min-w-0">
                      <h3 className="text-sm font-semibold leading-tight line-clamp-1">
                        {project.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {project.clientName}
                        {project.clientCompany && ` · ${project.clientCompany}`}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`shrink-0 text-[10px] rounded-md ${projectStatusColors[project.status] ?? ""}`}
                    >
                      {project.status.replace(/_/g, " ")}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {project.totalEarned !== null && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-emerald-500" />
                        ${project.totalEarned.toLocaleString()}
                      </span>
                    )}
                    {project.deadline && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-blue-500" />
                        {new Date(project.deadline).toLocaleDateString()}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <CheckSquare className="h-3 w-3 text-violet-500" />
                      {project.taskCount} tasks
                    </span>
                  </div>
                </div>
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

function ProjectListSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-[160px] rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border p-4 space-y-3">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
