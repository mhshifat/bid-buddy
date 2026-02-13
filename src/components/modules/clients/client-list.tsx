"use client";

import { useState, useCallback } from "react";
import { Users, Star, Shield, DollarSign, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Search } from "lucide-react";

const clientStatusColors: Record<string, string> = {
  PROSPECT: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  ACTIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  INACTIVE: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  BLOCKED: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

export function ClientList() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");

  const { data, isLoading, error, refetch } = trpc.clientManagement.list.useQuery({
    page,
    pageSize,
    status: status !== "all" ? (status as "ACTIVE") : undefined,
    search: search || undefined,
  });

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  }, []);

  if (isLoading) {
    return <ClientListSkeleton />;
  }

  if (error) {
    const errorData = error.data as { correlationId?: string; userMessage?: string } | undefined;
    return (
      <ErrorDisplay
        message={errorData?.userMessage ?? "Failed to load clients."}
        correlationId={errorData?.correlationId}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="PROSPECT">Prospect</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="BLOCKED">Blocked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!data || data.items.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients found"
          description="Clients will appear here as you interact with Upwork employers."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((client) => (
              <Card key={client.id} className="transition-all hover:shadow-md">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold">{client.name}</h3>
                      {client.company && (
                        <p className="text-xs text-muted-foreground">
                          {client.company}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant="secondary"
                      className={`shrink-0 text-[10px] ${clientStatusColors[client.status] ?? ""}`}
                    >
                      {client.status}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {client.upworkRating !== null && (
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-amber-500" />
                        {client.upworkRating.toFixed(1)}
                      </span>
                    )}
                    {client.totalSpent !== null && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        ${client.totalSpent.toLocaleString()}
                      </span>
                    )}
                    {client.paymentVerified && (
                      <span className="flex items-center gap-1 text-emerald-600">
                        <Shield className="h-3 w-3" />
                        Verified
                      </span>
                    )}
                    {client.country && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {client.country}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {client.projectCount} project{client.projectCount !== 1 ? "s" : ""}
                  </p>
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

function ClientListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 flex-1 max-w-sm" />
        <Skeleton className="h-10 w-[150px]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4 space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

