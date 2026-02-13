"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell,
  Sparkles,
  Loader2,
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
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-blue-100 text-blue-700",
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
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" /> Smart Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border-l-4 border p-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="mt-2 h-3 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" /> Smart Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center py-6">
          <p className="text-sm text-muted-foreground mb-3 text-center">
            AI analyses your pipeline to surface opportunities, warnings, and tips
          </p>
          <Button onClick={handleGenerate} size="sm">
            <Sparkles className="mr-2 h-3.5 w-3.5" />
            Generate Alerts
          </Button>
        </CardContent>
      </Card>
    );
  }

  const highPriorityCount = result.alerts.filter((a) => a.priority === "high").length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" /> Smart Alerts
          {highPriorityCount > 0 && (
            <Badge className="bg-red-100 text-red-700 text-[10px]">
              {highPriorityCount} urgent
            </Badge>
          )}
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2"
          onClick={handleGenerate}
          disabled={mutation.isPending}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${mutation.isPending ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Summary */}
        <p className="text-xs text-muted-foreground mb-3">{result.summary}</p>

        {/* Alerts */}
        {result.alerts.map((alert, i) => (
          <div
            key={i}
            className={`rounded-lg border-l-4 border p-3 ${priorityColors[alert.priority]}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0">
                <div className="mt-0.5 shrink-0">{getAlertIcon(alert.type)}</div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-medium leading-tight">{alert.title}</p>
                    <Badge className={`${priorityBadgeColors[alert.priority]} text-[8px] px-1 py-0`}>
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
                  <Button variant="outline" size="sm" className="h-6 text-[10px] px-2">
                    {alert.actionLabel}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        ))}

        {/* Next Check */}
        <p className="text-[10px] text-muted-foreground text-center pt-1">
          ⏰ {result.nextCheckRecommendation}
        </p>
      </CardContent>
    </Card>
  );
}

