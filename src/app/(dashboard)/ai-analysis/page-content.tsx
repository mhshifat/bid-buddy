"use client";

/**
 * AI Analysis Page Content — client component wrapping AI modules.
 * Bento-grid layout with animated sidebar and main content.
 */

import { AiHealthStatus } from "@/components/modules/ai/ai-health-status";
import { AiAnalysisOverview } from "@/components/modules/ai/ai-analysis-overview";

export function AiAnalysisPageContent() {
  return (
    <div className="grid gap-6 lg:grid-cols-4">
      {/* Sidebar */}
      <div className="space-y-4 animate-fade-in-up stagger-1">
        <AiHealthStatus />
        <div className="rounded-2xl border bg-gradient-to-br from-muted/30 to-muted/10 p-4 relative overflow-hidden">
          <div className="shimmer-bg pointer-events-none absolute inset-0 rounded-2xl" />
          <div className="relative z-10">
            <h3 className="mb-3 text-sm font-semibold">About AI Analysis</h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/50 shrink-0" />
                Powered by Groq (LLaMA 4 Scout)
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500/50 shrink-0" />
                Analyses job fit, win probability, and fake detection
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500/50 shrink-0" />
                Generates personalised proposals
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500/50 shrink-0" />
                Evaluates client trustworthiness
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-violet-500/50 shrink-0" />
                Considers your skills from GitHub and manual entries
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="lg:col-span-3 animate-fade-in-up stagger-2">
        <AiAnalysisOverview />
      </div>
    </div>
  );
}
