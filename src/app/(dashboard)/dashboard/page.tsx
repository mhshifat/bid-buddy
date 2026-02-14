import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/config";
import { LayoutDashboard } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DashboardStats } from "@/components/modules/dashboard/dashboard-stats";
import { RecentJobsList } from "@/components/modules/dashboard/recent-jobs-list";
import { TopPicksWidget } from "@/components/modules/dashboard/top-picks-widget";
import { EarningsPipelineWidget } from "@/components/modules/dashboard/earnings-pipeline-widget";
import { WeeklyDigestWidget } from "@/components/modules/dashboard/weekly-digest-widget";
import { SmartAlertsWidget } from "@/components/modules/dashboard/smart-alerts-widget";

export const metadata: Metadata = createPageMetadata(
  "Dashboard",
  "Overview of your Upwork freelancing activity."
);

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Welcome back! Here's an overview of your Upwork activity, AI insights, and pipeline progress."
        icon={LayoutDashboard}
        accentGradient="from-blue-500/50 via-emerald-500/30 to-violet-500/50"
      />

      {/* Bento stat cards */}
      <DashboardStats />

      {/* Smart alerts — full width */}
      <SmartAlertsWidget />

      {/* Bento grid — mixed sizes for visual interest */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TopPicksWidget />
        </div>
        <div>
          <EarningsPipelineWidget />
        </div>
        <div>
          <WeeklyDigestWidget />
        </div>
        <div className="lg:col-span-2">
          <RecentJobsList />
        </div>
      </div>
    </div>
  );
}
