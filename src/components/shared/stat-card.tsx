"use client";

/**
 * Stat Card — bento-style card with shimmer overlay, floating icon,
 * micro-interaction hover effects, and optional trend indicator.
 */

import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  /** CSS class for icon background */
  iconBg?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  iconBg = "bg-primary",
}: StatCardProps) {
  return (
    <div
      className="
        group relative overflow-hidden rounded-2xl border
        bg-gradient-to-br from-card to-card
        p-5 transition-all duration-300
        hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5
        dark:hover:shadow-black/20
      "
    >
      {/* Shimmer overlay */}
      <div className="shimmer-bg pointer-events-none absolute inset-0 rounded-2xl" />

      {/* Top gradient accent */}
      <div className="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-60 animate-gradient-border" />

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/80">
              {title}
            </p>
            <p className="mt-2 text-2xl font-bold tracking-tight animate-count-up">
              {value}
            </p>
            {description && (
              <p className="mt-1 text-xs text-muted-foreground">
                {description}
              </p>
            )}
            {trend && (
              <div className="mt-2 flex items-center gap-1.5">
                <div
                  className={`h-1.5 w-1.5 rounded-full ${
                    trend.value >= 0 ? "bg-emerald-500" : "bg-red-500"
                  }`}
                />
                <span
                  className={`text-xs font-medium ${
                    trend.value >= 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {trend.value >= 0 ? "+" : ""}
                  {trend.value}% {trend.label}
                </span>
              </div>
            )}
          </div>

          {/* Floating icon */}
          <div
            className={`
              rounded-xl ${iconBg} p-2.5 shadow-sm
              transition-all duration-300 group-hover:shadow-md
              animate-float
            `}
          >
            <Icon className="h-4 w-4 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
