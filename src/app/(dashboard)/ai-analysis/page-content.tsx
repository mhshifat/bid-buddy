"use client";

/**
 * AI Analysis Page Content — client component wrapping AI modules.
 */

import { AiHealthStatus } from "@/components/modules/ai/ai-health-status";
import { AiAnalysisOverview } from "@/components/modules/ai/ai-analysis-overview";

export function AiAnalysisPageContent() {
  return (
    <div className="grid gap-6 lg:grid-cols-4">
      {/* Sidebar */}
      <div className="space-y-4">
        <AiHealthStatus />
        <div className="rounded-lg border bg-muted/30 p-4">
          <h3 className="mb-2 text-sm font-semibold">About AI Analysis</h3>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li>• Powered by Groq (LLaMA 4 Scout)</li>
            <li>• Analyses job fit, win probability, and fake detection</li>
            <li>• Generates personalised proposals</li>
            <li>• Evaluates client trustworthiness</li>
            <li>• Considers your skills from GitHub and manual entries</li>
          </ul>
        </div>
      </div>

      {/* Main */}
      <div className="lg:col-span-3">
        <AiAnalysisOverview />
      </div>
    </div>
  );
}

