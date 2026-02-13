"use client";

/**
 * AI Health Status — displays the current health of the AI provider.
 */

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

export function AiHealthStatus() {
  const { data, isLoading } = trpc.ai.healthCheck.useQuery(undefined, {
    refetchInterval: 60_000, // Re-check every minute
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const status = data?.status ?? "error";
  const provider = data?.provider ?? "unknown";
  const model = data?.model ?? "unknown";

  const statusConfig = {
    ok: {
      icon: <CheckCircle className="h-5 w-5 text-emerald-500" />,
      badge: "default" as const,
      label: "Operational",
      color: "text-emerald-600",
    },
    degraded: {
      icon: <AlertCircle className="h-5 w-5 text-amber-500" />,
      badge: "secondary" as const,
      label: "Degraded",
      color: "text-amber-600",
    },
    error: {
      icon: <XCircle className="h-5 w-5 text-red-500" />,
      badge: "destructive" as const,
      label: "Unavailable",
      color: "text-red-600",
    },
  };

  const cfg = statusConfig[status];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Activity className="h-4 w-4" />
          AI Provider Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          {cfg.icon}
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${cfg.color}`}>
                {cfg.label}
              </span>
              <Badge variant={cfg.badge} className="text-[10px]">
                {provider.toUpperCase()}
              </Badge>
            </div>
            <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
              {model}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

