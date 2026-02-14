"use client";

/**
 * Pipeline Header — Hero-style header with animated SVG background,
 * geometric accents, and storytelling micro-copy.
 */

import { Sparkles, TrendingUp, Zap } from "lucide-react";

// ---------------------------------------------------------------------------
// Background SVG — abstract pipeline flow
// ---------------------------------------------------------------------------

function PipelineBgSvg() {
  return (
    <svg
      className="absolute inset-0 h-full w-full pointer-events-none"
      viewBox="0 0 800 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {/* Flowing dotted path */}
      <path
        d="M0 100 Q200 40 400 100 T800 100"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="6 6"
        opacity="0.08"
        className="animate-dash-flow text-primary"
      />
      <path
        d="M0 120 Q200 60 400 120 T800 120"
        stroke="currentColor"
        strokeWidth="0.5"
        strokeDasharray="4 8"
        opacity="0.05"
        className="text-primary"
      />

      {/* Decorative circles at waypoints */}
      <circle cx="100" cy="90" r="4" fill="currentColor" opacity="0.06" className="text-blue-500" />
      <circle cx="300" cy="80" r="3" fill="currentColor" opacity="0.05" className="text-amber-500" />
      <circle cx="500" cy="105" r="5" fill="currentColor" opacity="0.06" className="text-emerald-500" />
      <circle cx="700" cy="95" r="3.5" fill="currentColor" opacity="0.05" className="text-violet-500" />

      {/* Large subtle geometric rings */}
      <circle cx="700" cy="50" r="80" stroke="currentColor" strokeWidth="0.5" opacity="0.04" className="text-primary animate-spin-slow" />
      <circle cx="700" cy="50" r="60" stroke="currentColor" strokeWidth="0.5" opacity="0.03" className="text-primary" style={{ animationDirection: "reverse" }} />

      {/* Grid dots bottom */}
      {Array.from({ length: 20 }).map((_, i) => (
        <circle
          key={i}
          cx={i * 42 + 10}
          cy="180"
          r="0.8"
          fill="currentColor"
          opacity="0.06"
          className="text-foreground"
        />
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PipelineHeader() {
  return (
    <div className="animate-fade-in-up stagger-1 relative overflow-hidden rounded-2xl border bg-gradient-to-br from-card via-card to-primary/[0.02] p-6 md:p-8">
      <PipelineBgSvg />

      {/* Gradient accent bar */}
      <div className="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-blue-500 via-emerald-500 to-violet-500 opacity-60" />

      <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Left: Title + Description */}
        <div className="max-w-xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 animate-float">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Pipeline</h1>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Track every job&apos;s journey — from discovery through bidding, winning, delivering, and getting paid.
            Your complete freelancing funnel, at a glance.
          </p>
        </div>

        {/* Right: Quick insight badges */}
        <div className="flex flex-wrap gap-2">
          <QuickBadge icon={Sparkles} label="AI-Powered" />
          <QuickBadge icon={TrendingUp} label="Live Tracking" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quick insight badge
// ---------------------------------------------------------------------------

function QuickBadge({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-border/50 bg-card/80 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-border hover:text-foreground hover:shadow-sm">
      <Icon className="h-3 w-3" />
      <span>{label}</span>
    </div>
  );
}

