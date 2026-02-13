"use client";

/**
 * Pipeline Stats — conversion funnel summary cards.
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";
import {
  Eye,
  Send,
  Trophy,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

export function PipelineStats() {
  const { data, isLoading } = trpc.pipeline.stats.useQuery();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const funnelCards = [
    {
      label: "Jobs Discovered",
      value: data.totalJobs,
      icon: Eye,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      label: "Proposals Sent",
      value: data.phaseCounts["PROPOSAL_SENT"] ?? 0,
      icon: Send,
      color: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-950",
      rate: data.conversionRates.discoveredToProposal,
      rateLabel: "of discovered",
    },
    {
      label: "Jobs Won",
      value: data.phaseCounts["WON"] ?? 0,
      icon: Trophy,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950",
      rate: data.conversionRates.proposalToWon,
      rateLabel: "win rate",
    },
    {
      label: "Delivered",
      value: data.phaseCounts["PROJECT_DELIVERED"] ?? 0,
      icon: CheckCircle,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
      rate: data.conversionRates.wonToDelivered,
      rateLabel: "completion",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {funnelCards.map((card, idx) => (
        <Card key={card.label} className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.label}
            </CardTitle>
            <div className={`rounded-lg p-2 ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            {card.rate !== undefined && (
              <p className="mt-1 text-xs text-muted-foreground">
                {card.rate}% {card.rateLabel}
              </p>
            )}
          </CardContent>
          {idx < funnelCards.length - 1 && (
            <ArrowRight className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-4 w-4 text-muted-foreground/30 hidden md:block z-10" />
          )}
        </Card>
      ))}
    </div>
  );
}

