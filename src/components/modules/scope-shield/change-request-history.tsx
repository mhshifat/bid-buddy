/**
 * Change Request History – shows all past scope creep checks for a scope.
 */

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  Clock,
  Check,
  X,
  MessageSquare,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";

interface ChangeRequestHistoryProps {
  scopeId: string;
}

export function ChangeRequestHistory({ scopeId }: ChangeRequestHistoryProps) {
  const utils = trpc.useUtils();
  const { data: requests, isLoading } = trpc.scope.changeRequests.useQuery({ scopeId });
  const updateStatusMutation = trpc.scope.updateChangeRequestStatus.useMutation({
    onSuccess: () => utils.scope.changeRequests.invalidate({ scopeId }),
  });

  if (isLoading) {
    return <Skeleton className="h-48 rounded-lg" />;
  }

  if (!requests || requests.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <MessageSquare className="h-8 w-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">
            No client messages analysed yet. Paste a message above to check for scope creep.
          </p>
        </CardContent>
      </Card>
    );
  }

  const verdictIcon = {
    IN_SCOPE: ShieldCheck,
    OUT_OF_SCOPE: ShieldAlert,
    GRAY_AREA: ShieldQuestion,
  };

  const verdictColor = {
    IN_SCOPE: "text-green-600",
    OUT_OF_SCOPE: "text-red-600",
    GRAY_AREA: "text-yellow-600",
  };

  const statusBadge = {
    DETECTED: "secondary" as const,
    ACCEPTED: "default" as const,
    DECLINED: "destructive" as const,
    NEGOTIATED: "outline" as const,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Change Request History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {requests.map((req) => {
          const analysis = req.ai_analysis as { verdict?: string; confidence?: number; quickSummary?: string } | null;
          const verdict = (analysis?.verdict ?? "GRAY_AREA") as keyof typeof verdictIcon;
          const VerdictIcon = verdictIcon[verdict] ?? ShieldQuestion;

          return (
            <div key={req.id} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <VerdictIcon className={`h-4 w-4 mt-0.5 shrink-0 ${verdictColor[verdict] ?? "text-muted-foreground"}`} />
                  <div className="min-w-0">
                    <p className="text-sm line-clamp-2">&ldquo;{req.client_message}&rdquo;</p>
                    {analysis?.quickSummary && (
                      <p className="text-xs text-muted-foreground mt-0.5">{analysis.quickSummary}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {analysis?.confidence && (
                    <Badge variant="outline" className="text-xs">
                      {analysis.confidence}%
                    </Badge>
                  )}
                  <Badge variant={statusBadge[req.status] ?? "secondary"} className="text-xs capitalize">
                    {req.status.toLowerCase()}
                  </Badge>
                </div>
              </div>

              {req.estimated_cost && (
                <p className="text-xs text-muted-foreground">
                  Estimated additional cost: <span className="font-medium">${Number(req.estimated_cost).toLocaleString()}</span>
                  {req.estimated_hours && <> · {Number(req.estimated_hours)}h</>}
                </p>
              )}

              {req.status === "DETECTED" && req.is_out_of_scope && (
                <div className="flex gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => updateStatusMutation.mutate({ changeRequestId: req.id, status: "ACCEPTED" })}
                    disabled={updateStatusMutation.isPending}
                  >
                    <Check className="mr-1 h-3 w-3" /> Accept
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => updateStatusMutation.mutate({ changeRequestId: req.id, status: "NEGOTIATED" })}
                    disabled={updateStatusMutation.isPending}
                  >
                    <MessageSquare className="mr-1 h-3 w-3" /> Negotiate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs text-destructive"
                    onClick={() => updateStatusMutation.mutate({ changeRequestId: req.id, status: "DECLINED" })}
                    disabled={updateStatusMutation.isPending}
                  >
                    <X className="mr-1 h-3 w-3" /> Decline
                  </Button>
                </div>
              )}

              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {new Date(req.created_at).toLocaleDateString()} at {new Date(req.created_at).toLocaleTimeString()}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

