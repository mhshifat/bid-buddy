/**
 * Scope Shield Stats – overview cards showing scope protection metrics.
 */

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  DollarSign,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";

export function ScopeShieldStats() {
  const { data, isLoading } = trpc.scope.stats.useQuery();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  const stats = [
    {
      label: "Active Scopes",
      value: data?.totalScopes ?? 0,
      icon: Shield,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Scope Creep Detected",
      value: data?.outOfScope ?? 0,
      icon: ShieldAlert,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      label: "In-Scope Requests",
      value: data?.inScope ?? 0,
      icon: ShieldCheck,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Money Protected",
      value: `$${(data?.moneySaved ?? 0).toLocaleString()}`,
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="flex items-center gap-4 py-4">
            <div className={`rounded-lg p-2.5 ${stat.bg}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

