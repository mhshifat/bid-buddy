"use client";

/**
 * Smart Alerts Widget — bento card with priority-colored alerts,
 * glass-morphism, staggered animations, and AI-powered insights.
 */

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell,
  Sparkles,
  AlertTriangle,
  Clock,
  TrendingUp,
  Target,
  Lightbulb,
  Trophy,
  RefreshCw,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";

interface SmartAlert {
  type: "opportunity" | "deadline" | "stale-proposal" | "market-shift" | "milestone" | "tip";
  priority: "high" | "medium" | "low";
  title: string;
  message: string;
  actionLabel: string | null;
  actionUrl: string | null;
}

interface SmartAlertResult {
  alerts: SmartAlert[];
  summary: string;
  nextCheckRecommendation: string;
}

const priorityColors: Record<string, string> = {
  high: "border-l-red-500 bg-red-50/50 dark:bg-red-950/10",
  medium: "border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/10",
  low: "border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/10",
};

const priorityBadgeColors: Record<string, string> = {
  high: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  low: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
};

function getAlertIcon(type: SmartAlert["type"]) {
  switch (type) {
    case "opportunity": return <Target className="h-3.5 w-3.5 text-emerald-600" />;
    case "deadline": return <Clock className="h-3.5 w-3.5 text-red-600" />;
    case "stale-proposal": return <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />;
    case "market-shift": return <TrendingUp className="h-3.5 w-3.5 text-blue-600" />;
    case "milestone": return <Trophy className="h-3.5 w-3.5 text-purple-600" />;
    case "tip": return <Lightbulb className="h-3.5 w-3.5 text-yellow-600" />;
    default: return <Bell className="h-3.5 w-3.5" />;
  }
}

export function SmartAlertsWidget() {
  const [result, setResult] = useState<SmartAlertResult | null>(null);

  // Load cached result on mount
  const { data: cached } = trpc.ai.getCachedInsight.useQuery(
    { insightType: "SMART_ALERTS" },
    { staleTime: Infinity, refetchOnWindowFocus: false }
  );

  useEffect(() => {
    if (cached?.result && !result) {
      setResult(cached.result as SmartAlertResult);
    }
  }, [cached, result]);

  const mutation = trpc.ai.smartAlerts.useMutation({
    onSuccess: (data) => {
      setResult(data);
      toast.success(`${data.alerts.length} smart alerts generated!`);
    },
    onError: () => toast.error("Failed to generate smart alerts"),
  });

  const handleGenerate = useCallback(() => {
    mutation.mutate();
  }, [mutation]);

  if (mutation.isPending) {
    return (
      <div className="rounded-2xl border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-6 w-6 rounded-lg" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border-l-4 border p-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="mt-2 h-3 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="relative overflow-hidden rounded-2xl border bg-card p-5">
        <div className="shimmer-bg pointer-events-none absolute inset-0 rounded-2xl" />
        <div className="relative z-10">
          <h3 className="text-base font-semibold flex items-center gap-2 mb-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 animate-float">
              <Bell className="h-3.5 w-3.5 text-primary" />
            </div>
            Smart Alerts
          </h3>
          <div className="flex flex-col items-center py-4">
            <p className="text-sm text-muted-foreground mb-3 text-center">
              AI analyses your pipeline to surface opportunities, warnings, and tips
            </p>
            <Button onClick={handleGenerate} size="sm" className="rounded-xl">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              Generate Alerts
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const highPriorityCount = result.alerts.filter((a) => a.priority === "high").length;

  return (
    <div className="group relative overflow-hidden rounded-2xl border bg-card p-5 transition-all duration-300 hover:shadow-lg hover:shadow-black/5">
      <div className="shimmer-bg pointer-events-none absolute inset-0 rounded-2xl" />
      <div className="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 animate-float">
              <Bell className="h-3.5 w-3.5 text-primary" />
            </div>
            Smart Alerts
            {highPriorityCount > 0 && (
              <Badge className="bg-red-100 text-red-700 text-[10px] rounded-md animate-glow-pulse dark:bg-red-500/20 dark:text-red-300">
                {highPriorityCount} urgent
              </Badge>
            )}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 rounded-lg"
            onClick={handleGenerate}
            disabled={mutation.isPending}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${mutation.isPending ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Summary */}
        <p className="text-xs text-muted-foreground mb-3">{result.summary}</p>

        {/* Alerts */}
        <div className="space-y-2">
          {result.alerts.map((alert, i) => (
            <div
              key={i}
              className={`animate-fade-in-up stagger-${Math.min(i + 1, 6)} rounded-xl border-l-4 border p-3 ${priorityColors[alert.priority]}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  <div className="mt-0.5 shrink-0">{getAlertIcon(alert.type)}</div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-medium leading-tight">{alert.title}</p>
                      <Badge className={`${priorityBadgeColors[alert.priority]} text-[8px] px-1 py-0 rounded-md`}>
                        {alert.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {alert.message}
                    </p>
                  </div>
                </div>
              </div>
              {alert.actionLabel && alert.actionUrl && (
                <div className="mt-2 pl-5">
                  <Link href={alert.actionUrl}>
                    <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 rounded-lg">
                      {alert.actionLabel}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Next Check */}
        <p className="text-[10px] text-muted-foreground text-center pt-2">
          ⏰ {result.nextCheckRecommendation}
        </p>
      </div>
    </div>
  );
}
