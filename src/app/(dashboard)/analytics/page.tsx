import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/config";
import { TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { WinPatternsCard } from "@/components/modules/analytics/win-patterns-card";
import { ConnectsRoiCard } from "@/components/modules/analytics/connects-roi-card";
import { ActivityTrendsCard } from "@/components/modules/analytics/activity-trends-card";

export const metadata: Metadata = createPageMetadata(
  "Analytics",
  "Track your Upwork freelancing performance metrics."
);

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="AI-powered insights into your bidding success, connects efficiency, and win patterns."
        icon={TrendingUp}
        accentGradient="from-cyan-500/50 via-blue-500/30 to-indigo-500/50"
      />

      {/* Row 1: Activity Trends (full width) */}
      <div className="animate-fade-in-up stagger-1">
        <ActivityTrendsCard />
      </div>

      {/* Row 2: Win Patterns + Connects ROI */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="animate-fade-in-up stagger-2">
          <WinPatternsCard />
        </div>
        <div className="animate-fade-in-up stagger-3">
          <ConnectsRoiCard />
        </div>
      </div>
    </div>
  );
}
