import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/config";
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
        description="Welcome back! Here's an overview of your Upwork activity."
      />
      <DashboardStats />
      <SmartAlertsWidget />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <TopPicksWidget />
          <RecentJobsList />
        </div>
        <div className="space-y-6">
          <EarningsPipelineWidget />
          <WeeklyDigestWidget />
        </div>
      </div>
    </div>
  );
}
