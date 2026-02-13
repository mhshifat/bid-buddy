/**
 * Scope List – displays all defined project scopes with summary stats.
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield,
  ChevronRight,
  FileCheck,
  FileX,
  Trash2,
  Calendar,
  DollarSign,
  RotateCcw,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";

interface ScopeListProps {
  onSelect: (scopeId: string, scopeTitle: string) => void;
  selectedScopeId?: string;
}

export function ScopeList({ onSelect, selectedScopeId }: ScopeListProps) {
  const utils = trpc.useUtils();
  const { data: scopes, isLoading } = trpc.scope.list.useQuery();
  const deleteMutation = trpc.scope.delete.useMutation({
    onSuccess: () => utils.scope.list.invalidate(),
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleDelete(id: string) {
    setDeletingId(id);
    deleteMutation.mutate({ id }, {
      onSettled: () => setDeletingId(null),
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!scopes || scopes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Shield className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <h3 className="text-lg font-semibold">No Scopes Defined</h3>
          <p className="text-sm text-muted-foreground max-w-md mt-1">
            Define a project scope to start protecting yourself from scope creep.
            Document deliverables, exclusions, and budget before starting work.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {scopes.map((scope) => (
        <Card
          key={scope.id}
          className={`cursor-pointer transition-colors hover:bg-muted/30 ${
            selectedScopeId === scope.id ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => onSelect(scope.id, scope.title)}
        >
          <CardContent className="py-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold truncate">{scope.title}</h3>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                  {scope.original_description}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <FileCheck className="h-3 w-3 text-green-500" />
                    {scope.deliverables.length} deliverables
                  </span>
                  {scope.exclusions.length > 0 && (
                    <span className="flex items-center gap-1">
                      <FileX className="h-3 w-3 text-red-500" />
                      {scope.exclusions.length} exclusions
                    </span>
                  )}
                  {scope.agreed_budget && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      ${Number(scope.agreed_budget).toLocaleString()}
                    </span>
                  )}
                  {scope.agreed_timeline && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {scope.agreed_timeline}
                    </span>
                  )}
                  {scope.revision_limit !== null && (
                    <span className="flex items-center gap-1">
                      <RotateCcw className="h-3 w-3" />
                      {scope.revision_limit} revisions
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4 shrink-0">
                <Badge variant="outline" className="text-xs">
                  {scope._count.change_requests} request{scope._count.change_requests !== 1 ? "s" : ""}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(scope.id);
                  }}
                  disabled={deletingId === scope.id}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

