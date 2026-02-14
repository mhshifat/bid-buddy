"use client";

/**
 * Pipeline Stats — Bento-grid conversion funnel with animated SVG backgrounds,
 * micro-interactions, and storytelling layout.
 *
 * Uses a standard grid-cols-4 layout. Funnel connector arrows are rendered as
 * absolutely-positioned decorative elements between cards — they never affect
 * layout flow and can never cause horizontal overflow.
 */

import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";
import {
  Eye,
  Send,
  Trophy,
  CheckCircle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Decorative SVG backgrounds (one per card, unique geometric patterns)
// ---------------------------------------------------------------------------

function GridPatternSvg({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <pattern id="grid-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="currentColor" opacity="0.15" />
        </pattern>
      </defs>
      <rect width="200" height="200" fill="url(#grid-dots)" />
      <circle cx="160" cy="40" r="50" stroke="currentColor" strokeWidth="0.5" opacity="0.1" className="animate-spin-slow" />
      <circle cx="160" cy="40" r="30" stroke="currentColor" strokeWidth="0.5" opacity="0.08" className="animate-spin-slow" style={{ animationDirection: "reverse" }} />
    </svg>
  );
}

function WaveSvg({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M0 40 Q50 10 100 40 T200 40 V80 H0 Z"
        fill="currentColor"
        opacity="0.04"
      />
      <path
        d="M0 50 Q50 20 100 50 T200 50 V80 H0 Z"
        fill="currentColor"
        opacity="0.03"
      />
    </svg>
  );
}

function DiamondPatternSvg({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="30" y="30" width="40" height="40" rx="4" transform="rotate(45 50 50)" stroke="currentColor" strokeWidth="0.8" opacity="0.1" />
      <rect x="30" y="30" width="60" height="60" rx="6" transform="rotate(45 60 60)" stroke="currentColor" strokeWidth="0.5" opacity="0.06" />
    </svg>
  );
}

function HexPatternSvg({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 140 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <polygon points="70,10 120,35 120,85 70,110 20,85 20,35" stroke="currentColor" strokeWidth="0.6" opacity="0.08" fill="none" />
      <polygon points="70,25 105,42 105,78 70,95 35,78 35,42" stroke="currentColor" strokeWidth="0.5" opacity="0.06" fill="none" />
      <polygon points="70,40 90,50 90,70 70,80 50,70 50,50" stroke="currentColor" strokeWidth="0.4" opacity="0.04" fill="currentColor" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

interface StatCardConfig {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  iconBg: string;
  gradientFrom: string;
  gradientTo: string;
  accentBorder: string;
  pattern: React.ElementType;
  rate?: number;
  rateLabel?: string;
}

function StatCard({
  config,
  staggerIndex,
  showConnector,
}: {
  config: StatCardConfig;
  staggerIndex: number;
  /** Show a dashed arrow on the right side of the card (hidden on small screens) */
  showConnector?: boolean;
}) {
  const PatternComponent = config.pattern;

  return (
    <div
      className={`
        animate-fade-in-up stagger-${staggerIndex}
        relative
      `}
    >
      {/* The card */}
      <div
        className={`
          group relative overflow-hidden rounded-2xl border h-full
          bg-gradient-to-br ${config.gradientFrom} ${config.gradientTo}
          ${config.accentBorder}
          p-4 sm:p-5 transition-all duration-300
          hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5
          dark:hover:shadow-black/20
        `}
      >
        {/* Shimmer overlay */}
        <div className="shimmer-bg pointer-events-none absolute inset-0 rounded-2xl" />

        {/* Background pattern — pushed to bottom-right corner */}
        <PatternComponent className={`absolute -right-6 -bottom-6 h-24 w-24 ${config.color} opacity-40 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12`} />

        {/* Gradient accent line at top */}
        <div className={`absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-transparent ${config.iconBg} to-transparent opacity-60 animate-gradient-border`} />

        {/* Content */}
        <div className="relative z-10">
          {/* Label row */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 truncate">
              {config.label}
            </p>
            {/* Icon */}
            <div className={`
              shrink-0 rounded-lg ${config.iconBg} p-1.5
              shadow-sm transition-all duration-300
              group-hover:shadow-md group-hover:scale-110
            `}>
              <config.icon className="h-3.5 w-3.5 text-white" />
            </div>
          </div>

          {/* Big number */}
          <p className="text-2xl sm:text-3xl font-bold tracking-tight animate-count-up">
            {config.value.toLocaleString()}
          </p>

          {/* Rate sub-line */}
          {config.rate !== undefined && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <div className={`h-1.5 w-1.5 rounded-full ${config.iconBg} animate-glow-pulse`} />
              <span className="text-[11px] font-medium text-muted-foreground truncate">
                {config.rate}% {config.rateLabel}
              </span>
            </div>
          )}

          {/* Micro progress bar */}
          {config.rate !== undefined && (
            <div className="mt-2.5 h-1 w-full rounded-full bg-muted/50 overflow-hidden">
              <div
                className={`h-full rounded-full ${config.iconBg} transition-all duration-1000 ease-out`}
                style={{ width: `${Math.min(config.rate, 100)}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Funnel connector arrow — absolutely positioned to the right of the card.
          Sits in the gap area, doesn't affect grid column width at all. */}
      {showConnector && (
        <div className="hidden md:flex absolute -right-[14px] top-1/2 -translate-y-1/2 z-20 pointer-events-none">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-muted-foreground/30">
            <path
              d="M3 10H15"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="3 3"
              className="animate-dash-flow"
            />
            <path
              d="M12 7L15 10L12 13"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Export
// ---------------------------------------------------------------------------

export function PipelineStats() {
  const { data, isLoading } = trpc.pipeline.stats.useQuery();

  if (isLoading) {
    return <PipelineStatsSkeleton />;
  }

  if (!data) return null;

  const cards: StatCardConfig[] = [
    {
      label: "Jobs Discovered",
      value: data.totalJobs,
      icon: Eye,
      color: "text-blue-500",
      iconBg: "bg-blue-500",
      gradientFrom: "from-blue-50/80",
      gradientTo: "to-card",
      accentBorder: "border-blue-100 dark:border-blue-900/50",
      pattern: GridPatternSvg,
    },
    {
      label: "Proposals Sent",
      value: data.phaseCounts["PROPOSAL_SENT"] ?? 0,
      icon: Send,
      color: "text-amber-500",
      iconBg: "bg-amber-500",
      gradientFrom: "from-amber-50/80",
      gradientTo: "to-card",
      accentBorder: "border-amber-100 dark:border-amber-900/50",
      pattern: WaveSvg,
      rate: data.conversionRates.discoveredToProposal,
      rateLabel: "of discovered",
    },
    {
      label: "Jobs Won",
      value: data.phaseCounts["WON"] ?? 0,
      icon: Trophy,
      color: "text-emerald-500",
      iconBg: "bg-emerald-500",
      gradientFrom: "from-emerald-50/80",
      gradientTo: "to-card",
      accentBorder: "border-emerald-100 dark:border-emerald-900/50",
      pattern: DiamondPatternSvg,
      rate: data.conversionRates.proposalToWon,
      rateLabel: "win rate",
    },
    {
      label: "Delivered",
      value: data.phaseCounts["PROJECT_DELIVERED"] ?? 0,
      icon: CheckCircle,
      color: "text-violet-500",
      iconBg: "bg-violet-500",
      gradientFrom: "from-violet-50/80",
      gradientTo: "to-card",
      accentBorder: "border-violet-100 dark:border-violet-900/50",
      pattern: HexPatternSvg,
      rate: data.conversionRates.wonToDelivered,
      rateLabel: "completion",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
      {cards.map((card, idx) => (
        <StatCard
          key={card.label}
          config={card}
          staggerIndex={idx + 1}
          showConnector={idx < cards.length - 1}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function PipelineStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl border bg-card p-4 sm:p-5 h-full">
          <div className="flex items-center justify-between mb-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-7 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-14 mt-1" />
          <Skeleton className="h-3 w-28 mt-2" />
          <Skeleton className="mt-2.5 h-1 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}
